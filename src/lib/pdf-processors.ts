async function loadPdfLib() {
  return import("pdf-lib");
}

async function loadJsPdf() {
  const module = await import("jspdf");
  return module.default;
}

export type ProcessResult = {
  blob: Blob;
  filename: string;
  text?: string; // for text/summary preview
  previewUrl?: string; // canvas dataUrl for PDF first-page preview
};

// ---------- PDF Preview (first page as image) ----------
export async function generatePdfPreview(blob: Blob): Promise<string | undefined> {
  try {
    const pdfjs = await loadPdfJs();
    const data = await blob.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.4 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return undefined;
  }
}

function download(result: ProcessResult) {
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadResult(result: ProcessResult) {
  download(result);
}

const stripExt = (name: string) => name.replace(/\.[^.]+$/i, "");

// ---------- Clean PDF text artifacts ----------
function cleanStr(raw: string): string {
  return (
    raw
      // Remove PDF kerning/spacing artifact codes like .5pt.4pt or .5pt
      .replace(/\.?\d+(\.\d+)?pt\.?\d*(\.\d+)?pt\s*/gi, "")
      // Remove standalone pt measurements like ".5pt"
      .replace(/\.?\d+pt\s*/gi, "")
      // Remove Europass/ECV artifacts like ecvlanglinkcolor
      .replace(/ecv\w*/gi, "")
      // Remove control characters (except tab, newline, carriage return)
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // Remove soft hyphens
      .replace(/\u00AD/g, "")
      // Remove zero-width chars
      .replace(/[\u200B-\u200F\uFEFF]/g, "")
      // Collapse excessive whitespace within a line
      .replace(/[ \t]{3,}/g, " ")
      .trim()
  );
}

// ---------- PDF.js loader ----------
async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  try {
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = (worker as { default: string }).default;
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  return pdfjs;
}

// ---------- Merge ----------
export async function mergePdfs(files: File[]): Promise<ProcessResult> {
  const { PDFDocument } = await loadPdfLib();
  const merged = await PDFDocument.create();
  for (const file of files) {
    const src = await PDFDocument.load(await file.arrayBuffer());
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const out = await merged.save();
  return { blob: new Blob([out as BlobPart], { type: "application/pdf" }), filename: "merged.pdf" };
}

// ---------- Split ----------
export async function splitPdf(file: File): Promise<ProcessResult> {
  const { PDFDocument } = await loadPdfLib();
  const src = await PDFDocument.load(await file.arrayBuffer());
  const count = src.getPageCount();
  for (let i = 0; i < count - 1; i++) {
    const single = await PDFDocument.create();
    const [page] = await single.copyPages(src, [i]);
    single.addPage(page);
    const out = await single.save();
    download({
      blob: new Blob([out as BlobPart], { type: "application/pdf" }),
      filename: `${stripExt(file.name)}-page-${i + 1}.pdf`,
    });
    await new Promise((r) => setTimeout(r, 120));
  }
  const last = await PDFDocument.create();
  const [page] = await last.copyPages(src, [Math.max(0, count - 1)]);
  last.addPage(page);
  const out = await last.save();
  return {
    blob: new Blob([out as BlobPart], { type: "application/pdf" }),
    filename: `${stripExt(file.name)}-page-${count}.pdf`,
  };
}

// ---------- Compress (user picks quality 1-10) ----------
export async function compressPdf(file: File, qualityInput = "5"): Promise<ProcessResult> {
  const pdfjs = await loadPdfJs();
  const { PDFDocument } = await loadPdfLib();

  // Map 1-10 → jpeg quality 0.15-0.95  and render scale 0.8-1.8
  const level = Math.min(10, Math.max(1, parseInt(qualityInput, 10) || 5));
  const jpegQuality = 0.15 + (level - 1) * 0.089; // 1→0.15, 10→0.95
  const renderScale = 0.8 + (level - 1) * 0.11; // 1→0.8, 10→1.79

  const data = await file.arrayBuffer();
  const srcPdfJs = await pdfjs.getDocument({ data: data.slice(0) }).promise;
  const outDoc = await PDFDocument.create();

  for (let i = 1; i <= srcPdfJs.numPages; i++) {
    const pg = await srcPdfJs.getPage(i);
    const vp = pg.getViewport({ scale: renderScale });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext("2d")!;
    await pg.render({ canvasContext: ctx, canvas, viewport: vp }).promise;
    const jpegBlob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", jpegQuality),
    );
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    const img = await outDoc.embedJpg(jpegBytes);
    const outPage = outDoc.addPage([vp.width, vp.height]);
    outPage.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
  }

  const out = await outDoc.save({ useObjectStreams: true });
  const blob = new Blob([out as BlobPart], { type: "application/pdf" });
  const previewUrl = await generatePdfPreview(blob);
  return { blob, filename: stripExt(file.name) + "-compressed.pdf", previewUrl };
}

// ---------- Image -> PDF ----------
export async function imagesToPdf(files: File[]): Promise<ProcessResult> {
  const { PDFDocument } = await loadPdfLib();
  const doc = await PDFDocument.create();
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isPng = file.type.includes("png") || /\.png$/i.test(file.name);
    const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  const out = await doc.save();
  return { blob: new Blob([out as BlobPart], { type: "application/pdf" }), filename: "images.pdf" };
}

// ---------- Rotate ----------
export async function rotatePdf(file: File, deg = 90): Promise<ProcessResult> {
  const { PDFDocument, degrees } = await loadPdfLib();
  const src = await PDFDocument.load(await file.arrayBuffer());
  src.getPages().forEach((p) => p.setRotation(degrees(deg)));
  const out = await src.save();
  return {
    blob: new Blob([out as BlobPart], { type: "application/pdf" }),
    filename: stripExt(file.name) + "-rotated.pdf",
  };
}

// ---------- Page range parser ----------
function parsePageRange(input: string, total: number): number[] {
  const result = new Set<number>();
  for (const part of input
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((n) => parseInt(n, 10));
      if (!isNaN(a) && !isNaN(b))
        for (let i = a; i <= b; i++) if (i >= 1 && i <= total) result.add(i);
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= total) result.add(n);
    }
  }
  return [...result].sort((a, b) => a - b);
}

// ---------- Extract Pages ----------
export async function extractPages(file: File, range: string): Promise<ProcessResult> {
  const { PDFDocument } = await loadPdfLib();
  const src = await PDFDocument.load(await file.arrayBuffer());
  const pages = parsePageRange(range, src.getPageCount());
  if (!pages.length) throw new Error("No valid pages selected. Try e.g. 1-3,5");
  const out = await PDFDocument.create();
  const copied = await out.copyPages(
    src,
    pages.map((p) => p - 1),
  );
  copied.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  return {
    blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
    filename: stripExt(file.name) + "-extracted.pdf",
  };
}

// ---------- Delete Pages ----------
export async function deletePagesByRange(file: File, range: string): Promise<ProcessResult> {
  const { PDFDocument } = await loadPdfLib();
  const src = await PDFDocument.load(await file.arrayBuffer());
  const total = src.getPageCount();
  const remove = new Set(parsePageRange(range, total).map((p) => p - 1));
  const keep = src.getPageIndices().filter((i) => !remove.has(i));
  if (!keep.length) throw new Error("Cannot delete all pages");
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, keep);
  copied.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  return {
    blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
    filename: stripExt(file.name) + "-edited.pdf",
  };
}

// ---------- Watermark ----------
export async function watermarkPdf(file: File, text: string): Promise<ProcessResult> {
  const { PDFDocument, StandardFonts, degrees, rgb } = await loadPdfLib();
  const src = await PDFDocument.load(await file.arrayBuffer());
  const font = await src.embedFont(StandardFonts.HelveticaBold);
  for (const page of src.getPages()) {
    const { width, height } = page.getSize();
    const fontSize = Math.min(60, width / (text.length * 0.55));
    page.drawText(text, {
      x: width / 2 - text.length * fontSize * 0.28,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.6, 0.6, 0.6),
      opacity: 0.25,
      rotate: degrees(-35),
    });
  }
  const out = await src.save();
  return {
    blob: new Blob([out as BlobPart], { type: "application/pdf" }),
    filename: stripExt(file.name) + "-watermarked.pdf",
  };
}

// ---------- Page Numbers ----------
export async function addPageNumbers(file: File): Promise<ProcessResult> {
  const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
  const src = await PDFDocument.load(await file.arrayBuffer());
  const font = await src.embedFont(StandardFonts.Helvetica);
  const pages = src.getPages();
  pages.forEach((page, i) => {
    const { width } = page.getSize();
    page.drawText(`${i + 1} / ${pages.length}`, {
      x: width / 2 - 20,
      y: 20,
      size: 11,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });
  const out = await src.save();
  return {
    blob: new Blob([out as BlobPart], { type: "application/pdf" }),
    filename: stripExt(file.name) + "-numbered.pdf",
  };
}

// ---------- Unlock (with optional password hint) ----------
export async function unlockPdf(file: File, password?: string): Promise<ProcessResult> {
  const { PDFDocument } = await loadPdfLib();
  try {
    // Try loading with ignoreEncryption (works for owner-locked PDFs)
    const src = await PDFDocument.load(await file.arrayBuffer(), {
      ignoreEncryption: true,
      password: password || undefined,
    } as object);
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, src.getPageIndices());
    copied.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    return {
      blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
      filename: stripExt(file.name) + "-unlocked.pdf",
    };
  } catch {
    throw new Error(
      "Could not unlock this PDF. The password may be incorrect, or this PDF uses strong encryption that requires a server-side tool.",
    );
  }
}

// ---------- Protect PDF (add visual protection stamp + metadata) ----------
export async function protectPdf(file: File, password = ""): Promise<ProcessResult> {
  const { PDFDocument, StandardFonts, rgb, degrees } = await loadPdfLib();
  const src = await PDFDocument.load(await file.arrayBuffer());
  // Note: pdf-lib doesn't support true AES encryption (needs server)
  // We add a visible protection stamp + metadata as best-effort
  if (password) {
    src.setTitle(`[PROTECTED] ${src.getTitle() ?? file.name}`);
    src.setSubject(`Password hint: set by PDF Master on ${new Date().toLocaleDateString()}`);
    // Add a subtle "PROTECTED" watermark
    const font = await src.embedFont(StandardFonts.HelveticaBold);
    for (const page of src.getPages()) {
      const { width, height } = page.getSize();
      page.drawText("PROTECTED", {
        x: width / 2 - 80,
        y: height - 30,
        size: 14,
        font,
        color: rgb(0.8, 0.1, 0.1),
        opacity: 0.5,
        rotate: degrees(0),
      });
    }
  }
  const out = await src.save();
  return {
    blob: new Blob([out as BlobPart], { type: "application/pdf" }),
    filename: stripExt(file.name) + "-protected.pdf",
  };
}

// ---------- Crop PDF (trim margins by 10%) ----------
export async function cropPdf(file: File): Promise<ProcessResult> {
  const { PDFDocument } = await loadPdfLib();
  const src = await PDFDocument.load(await file.arrayBuffer());
  for (const page of src.getPages()) {
    const { width, height } = page.getSize();
    const marginX = width * 0.05;
    const marginY = height * 0.05;
    page.setCropBox(marginX, marginY, width - marginX * 2, height - marginY * 2);
  }
  const out = await src.save();
  return {
    blob: new Blob([out as BlobPart], { type: "application/pdf" }),
    filename: stripExt(file.name) + "-cropped.pdf",
  };
}

// ---------- PDF -> Images ----------
export async function pdfToImages(file: File): Promise<ProcessResult> {
  const pdfjs = await loadPdfJs();
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  for (let i = 1; i <= pdf.numPages - 1; i++) {
    const blob = await renderPage(pdf, i);
    download({ blob, filename: `${stripExt(file.name)}-page-${i}.png` });
    await new Promise((r) => setTimeout(r, 120));
  }
  const last = await renderPage(pdf, pdf.numPages);
  return { blob: last, filename: `${stripExt(file.name)}-page-${pdf.numPages}.png` };
}

async function renderPage(pdf: unknown, pageNum: number): Promise<Blob> {
  const page = await (pdf as { getPage: (n: number) => Promise<unknown> }).getPage(pageNum);
  const p = page as {
    getViewport: (o: { scale: number }) => { width: number; height: number };
    render: (o: Record<string, unknown>) => { promise: Promise<void> };
  };
  const viewport = p.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await p.render({ canvasContext: ctx, canvas, viewport }).promise;
  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
}

// ---------- PDF -> Text ----------
export async function pdfToText(file: File): Promise<ProcessResult> {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str: string; hasEOL?: boolean; transform?: number[] }>;

    type LineMap = Record<number, string[]>;
    const lineMap: LineMap = {};
    for (const item of items) {
      const cleaned = cleanStr(item.str);
      if (!cleaned && !item.hasEOL) continue;
      const y = item.transform ? Math.round(item.transform[5]) : 0;
      if (!lineMap[y]) lineMap[y] = [];
      if (cleaned) lineMap[y].push(cleaned);
    }
    const sortedYs = Object.keys(lineMap)
      .map(Number)
      .sort((a, b) => b - a);
    const pageText = sortedYs.map((y) => lineMap[y].join(" ")).join("\n");
    text += `--- Page ${i} ---\n${pageText}\n\n`;
  }
  return {
    blob: new Blob([text], { type: "text/plain" }),
    filename: stripExt(file.name) + ".txt",
    text,
  };
}

// ---------- PDF -> Word (pixel-perfect: render pages as images) ----------
export async function pdfToWord(file: File): Promise<ProcessResult> {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;

  let htmlBody = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewportOriginal = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 2.5 }); // high-res for crisp text
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    // Set explicit width so Word doesn't stretch the high-res image outside the page
    htmlBody += `<div style="text-align:center;margin:0;padding:0"><img src="${dataUrl}" width="${Math.floor(viewportOriginal.width)}" style="display:block;" /></div>`;
    if (i < pdf.numPages) {
      htmlBody += `<br clear="all" style="page-break-before:always" />`;
    }
  }

  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>@page{margin:0.5cm;}body{margin:0;padding:0;}div{margin:0;padding:0;}</style></head><body>${htmlBody}</body></html>`;
  return {
    blob: new Blob(["\ufeff", html], { type: "application/msword" }),
    filename: stripExt(file.name) + ".doc",
  };
}

// ---------- PDF -> Excel (CSV with tab-separated columns) ----------
export async function pdfToExcel(file: File): Promise<ProcessResult> {
  const { text } = await pdfToText(file);
  const lines = (text ?? "").split("\n").filter((l) => l.trim() && !l.startsWith("---"));
  const csv = lines
    .map((line) => {
      // Split by 2+ spaces to detect columns
      const cols = line.split(/\s{2,}/).map((c) => `"${c.replace(/"/g, '""')}"`);
      return cols.join(",");
    })
    .join("\n");
  return {
    blob: new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    filename: stripExt(file.name) + ".csv",
  };
}

// ---------- Image -> PDF (OCR then typeset as PDF) ----------
export async function ocrToPdf(files: File[]): Promise<ProcessResult> {
  const Tesseract = (await import("tesseract.js")).default;
  const jsPDF = await loadJsPdf();
  const doc = new jsPDF();
  let first = true;
  for (const file of files) {
    const { data } = await Tesseract.recognize(file, "eng");
    const text = data.text.trim();
    if (!text) continue;
    if (!first) doc.addPage();
    first = false;
    const lines = doc.splitTextToSize(text, 170);
    let y = 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    for (const line of lines) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 6;
    }
  }
  return {
    blob: doc.output("blob"),
    filename: "ocr-result.pdf",
  };
}

// ---------- Image -> Word (Embed images into Word doc) ----------
export async function imageToWord(files: File[]): Promise<ProcessResult> {
  let htmlBody = "";
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    // Set explicit width to fit inside a standard Word page
    htmlBody += `<div style="text-align:center;margin:0;padding:0"><img src="${dataUrl}" width="600" style="display:block;" /></div>`;
    if (i < files.length - 1) {
      htmlBody += `<br clear="all" style="page-break-before:always" />`;
    }
  }

  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>@page{margin:0.5cm;}body{margin:0;padding:0;}div{margin:0;padding:0;}</style></head><body>${htmlBody}</body></html>`;
  return {
    blob: new Blob(["\ufeff", html], { type: "application/msword" }),
    filename: stripExt(files[0].name) + "-converted.doc",
  };
}

// ---------- Word -> PDF (Robust Text-based Renderer) ----------
export async function wordToPdf(file: File): Promise<ProcessResult> {
  console.log("Starting Robust Word to PDF conversion:", file.name);
  const mammoth = await import("mammoth");
  const jsPDF = await loadJsPdf();

  const arrayBuffer = await file.arrayBuffer();

  // Convert to HTML first to get some structure
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

  // Create jsPDF instance
  const doc = new jsPDF("p", "pt", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Simple HTML parser for basic tags
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const nodes = Array.from(tempDiv.childNodes);

  for (const node of nodes) {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }

    const tagName = (node as HTMLElement).tagName?.toLowerCase();
    const text = node.textContent?.trim();
    if (!text) continue;

    if (tagName === "h1") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 28;
    } else if (tagName === "h2" || tagName === "h3") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 20;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 14;
    }
    y += 10; // spacing between blocks
  }

  const blob = doc.output("blob");
  const previewUrl = await generatePdfPreview(blob);
  return { blob, filename: stripExt(file.name) + ".pdf", previewUrl };
}

// ---------- Text/HTML -> PDF ----------
export async function textToPdf(file: File): Promise<ProcessResult> {
  const jsPDF = await loadJsPdf();
  const text = await file.text();
  const doc = new jsPDF();
  const lines = doc.splitTextToSize(text, 180);
  let y = 20;
  for (const line of lines) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 15, y);
    y += 7;
  }
  return {
    blob: doc.output("blob"),
    filename: stripExt(file.name) + ".pdf",
  };
}

// ---------- Reorder Pages (re-save, user can use extract to pick order) ----------
export async function reorderPages(file: File): Promise<ProcessResult> {
  const { PDFDocument } = await loadPdfLib();
  const src = await PDFDocument.load(await file.arrayBuffer());
  const out = await src.save();
  return {
    blob: new Blob([out as BlobPart], { type: "application/pdf" }),
    filename: stripExt(file.name) + "-reordered.pdf",
  };
}

// ---------- Devanagari -> Roman transliteration (for WhatsApp Hinglish) ----------
function devanagariToRoman(text: string): string {
  const C: Record<string, string> = {
    क: "k",
    ख: "kh",
    ग: "g",
    घ: "gh",
    ङ: "ng",
    च: "ch",
    छ: "chh",
    ज: "j",
    झ: "jh",
    ञ: "ny",
    ट: "t",
    ठ: "th",
    ड: "d",
    ढ: "dh",
    ण: "n",
    त: "t",
    थ: "th",
    द: "d",
    ध: "dh",
    न: "n",
    प: "p",
    फ: "ph",
    ब: "b",
    भ: "bh",
    म: "m",
    य: "y",
    र: "r",
    ल: "l",
    व: "v",
    श: "sh",
    ष: "sh",
    स: "s",
    ह: "h",
    क़: "q",
    ख़: "kh",
    ग़: "gh",
    ज़: "z",
    ड़: "r",
    ढ़: "rh",
    फ़: "f",
  };
  const V: Record<string, string> = {
    अ: "a",
    आ: "aa",
    इ: "i",
    ई: "ee",
    उ: "u",
    ऊ: "oo",
    ए: "e",
    ऐ: "ai",
    ओ: "o",
    औ: "au",
    ऋ: "ri",
  };
  const M: Record<string, string> = {
    "ा": "aa",
    "ि": "i",
    "ी": "ee",
    "ु": "u",
    "ू": "oo",
    "े": "e",
    "ै": "ai",
    "ो": "o",
    "ौ": "au",
    "ृ": "ri",
    "ं": "n",
    "ः": "h",
    "ँ": "n",
  };
  const virama = "\u094D";
  const nums: Record<string, string> = {
    "०": "0",
    "१": "1",
    "२": "2",
    "३": "3",
    "४": "4",
    "५": "5",
    "६": "6",
    "७": "7",
    "८": "8",
    "९": "9",
  };
  const chars = [...text];
  let r = "";
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i],
      nx = chars[i + 1];
    if (C[ch]) {
      if (nx === virama) {
        r += C[ch];
        i++;
      } else if (nx && M[nx]) {
        r += C[ch] + M[nx];
        i++;
      } else {
        r += C[ch] + "a";
      }
    } else if (V[ch]) {
      r += V[ch];
    } else if (M[ch]) {
      r += M[ch];
    } else if (nums[ch]) {
      r += nums[ch];
    } else if (ch === "।" || ch === "॥") {
      r += ".";
    } else {
      r += ch;
    }
  }
  return r;
}

// ---------- Google Translate (unofficial, free, no key needed) ----------
async function googleTranslate(text: string, targetLang: string): Promise<string> {
  const isHinglish = targetLang === "wa";
  const actualLang = isHinglish ? "hi" : targetLang;
  const CHUNK = 4000;
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK) chunks.push(text.slice(i, i + CHUNK));
  let out = "";
  for (const chunk of chunks) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${actualLang}&dt=t&q=${encodeURIComponent(chunk)}`;
    const res = await fetch(url);
    const json = (await res.json()) as Array<Array<Array<string>>>;
    const translated = (json[0] ?? []).map((item) => item[0] ?? "").join("");
    out += isHinglish ? devanagariToRoman(translated) : translated;
  }
  return out;
}

// ---------- AI Summarize (extractive + optional language) ----------
export async function aiSummarize(file: File, lang = "en"): Promise<ProcessResult> {
  const { text } = await pdfToText(file);
  const raw = (text ?? "").replace(/--- Page \d+ ---/g, "").trim();
  if (!raw) throw new Error("No text could be extracted from this PDF.");

  const sentences =
    raw.match(/[^.!?\n]+[.!?\n]+/g) ?? raw.split("\n").filter((s) => s.trim().length > 20);

  // Extractive summarization via word frequency
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "is",
    "in",
    "of",
    "and",
    "to",
    "for",
    "on",
    "at",
    "with",
    "by",
    "from",
    "that",
    "this",
    "it",
    "was",
    "are",
    "be",
    "as",
    "or",
    "but",
    "not",
    "we",
    "he",
    "she",
    "they",
    "i",
    "you",
  ]);
  for (const s of sentences) {
    for (const w of s.toLowerCase().match(/\b[a-z]{3,}\b/g) ?? []) {
      if (!stopWords.has(w)) wordFreq[w] = (wordFreq[w] ?? 0) + 1;
    }
  }
  const scored = sentences.map((s) => ({
    s: s.trim(),
    score: (s.toLowerCase().match(/\b[a-z]{3,}\b/g) ?? []).reduce(
      (acc, w) => acc + (wordFreq[w] ?? 0),
      0,
    ),
  }));
  const topN = Math.max(4, Math.ceil(sentences.length * 0.2));
  const summaryEn = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((x) => x.s)
    .join(" ");

  let finalText = summaryEn;
  let langLabel = "English";
  if (lang !== "en") {
    finalText = await googleTranslate(summaryEn, lang);
    const langMap: Record<string, string> = {
      hi: "Hindi",
      wa: "WhatsApp (Hinglish)",
      fr: "French",
      es: "Spanish",
      de: "German",
      ar: "Arabic",
    };
    langLabel = langMap[lang] ?? lang.toUpperCase();
  }

  const header = `📄 AI SUMMARY — ${file.name}\nLanguage: ${langLabel} | Sentences extracted: ${topN} of ${sentences.length}\n${"-".repeat(60)}\n\n`;
  const output = header + finalText + "\n";
  return {
    blob: new Blob([output], { type: "text/plain" }),
    filename: stripExt(file.name) + `-summary-${lang}.txt`,
    text: output,
  };
}

// ---------- AI Translate (Google Translate) ----------
export async function aiTranslate(file: File, targetLang = "hi"): Promise<ProcessResult> {
  const { text } = await pdfToText(file);
  const raw = (text ?? "").replace(/--- Page \d+ ---/g, " ").trim();
  if (!raw) throw new Error("No text found in this PDF.");

  const translated = await googleTranslate(raw, targetLang);
  const langMap: Record<string, string> = {
    hi: "Hindi",
    wa: "WhatsApp (Hinglish)",
    fr: "French",
    es: "Spanish",
    de: "German",
    ar: "Arabic",
    zh: "Chinese",
  };
  const langLabel = langMap[targetLang] ?? targetLang.toUpperCase();

  const output = `🌐 TRANSLATED TO: ${langLabel}\n${"-".repeat(60)}\n\n${translated}\n`;
  return {
    blob: new Blob([output], { type: "text/plain" }),
    filename: stripExt(file.name) + `-${targetLang}.txt`,
    text: output,
  };
}

// ---------- Tool Handler Registry ----------
export type ToolHandler = {
  accept: string;
  multiple: boolean;
  minFiles?: number;
  promptLabel?: string;
  promptPlaceholder?: string;
  promptDefault?: string;
  promptType?: "text" | "select"; // NEW: show dropdown instead of text
  promptOptions?: { value: string; label: string }[];
  supportRetranslate?: boolean; // NEW: AI tools show language re-picker in result
  run: (files: File[], prompt?: string) => Promise<ProcessResult>;
};

const AI_LANG_OPTIONS = [
  { value: "en", label: "🇬🇧 English" },
  { value: "hi", label: "🇮🇳 Hindi (हिंदी)" },
  { value: "wa", label: "💬 WhatsApp (Hinglish)" },
  { value: "fr", label: "🇫🇷 French" },
  { value: "es", label: "🇪🇸 Spanish" },
  { value: "de", label: "🇩🇪 German" },
  { value: "ar", label: "🇸🇦 Arabic" },
];

export const toolHandlers: Record<string, ToolHandler> = {
  "merge-pdf": { accept: "application/pdf", multiple: true, minFiles: 2, run: (f) => mergePdfs(f) },
  "split-pdf": { accept: "application/pdf", multiple: false, run: (f) => splitPdf(f[0]) },
  "compress-pdf": {
    accept: "application/pdf",
    multiple: false,
    promptLabel: "Quality level (1 = max compression, 10 = best quality)",
    promptPlaceholder: "1–10",
    promptDefault: "5",
    run: (f, p) => compressPdf(f[0], p ?? "5"),
  },
  "image-to-pdf": {
    accept: "image/png,image/jpeg,image/webp",
    multiple: true,
    run: (f) => imagesToPdf(f),
  },
  "rotate-pdf": { accept: "application/pdf", multiple: false, run: (f) => rotatePdf(f[0], 90) },
  "extract-pages": {
    accept: "application/pdf",
    multiple: false,
    promptLabel: "Pages to extract (e.g. 1-3,5)",
    promptPlaceholder: "1-3,5",
    promptDefault: "1",
    run: (f, p) => extractPages(f[0], p ?? "1"),
  },
  "delete-pages": {
    accept: "application/pdf",
    multiple: false,
    promptLabel: "Pages to delete (e.g. 2,4-6)",
    promptPlaceholder: "2,4-6",
    promptDefault: "1",
    run: (f, p) => deletePagesByRange(f[0], p ?? "1"),
  },
  "watermark-pdf": {
    accept: "application/pdf",
    multiple: false,
    promptLabel: "Watermark text",
    promptPlaceholder: "CONFIDENTIAL",
    promptDefault: "CONFIDENTIAL",
    run: (f, p) => watermarkPdf(f[0], p ?? "CONFIDENTIAL"),
  },
  "page-numbers": { accept: "application/pdf", multiple: false, run: (f) => addPageNumbers(f[0]) },
  "unlock-pdf": {
    accept: "application/pdf",
    multiple: false,
    promptLabel: "Password (if known — helps unlock some PDFs)",
    promptPlaceholder: "Enter password or leave blank",
    promptDefault: "",
    run: (f, p) => unlockPdf(f[0], p),
  },
  "protect-pdf": {
    accept: "application/pdf",
    multiple: false,
    promptLabel: "Your password (adds protection stamp — full encryption needs server)",
    promptPlaceholder: "Enter your password",
    promptDefault: "",
    run: (f, p) => protectPdf(f[0], p ?? ""),
  },
  "pdf-to-image": { accept: "application/pdf", multiple: false, run: (f) => pdfToImages(f[0]) },
  "pdf-to-word": { accept: "application/pdf", multiple: false, run: (f) => pdfToWord(f[0]) },
  "pdf-to-excel": { accept: "application/pdf", multiple: false, run: (f) => pdfToExcel(f[0]) },
  "pdf-to-ppt": { accept: "application/pdf", multiple: false, run: (f) => pdfToImages(f[0]) },
  "image-to-word": { accept: "image/png,image/jpeg", multiple: true, run: (f) => imageToWord(f) },
  "handwriting-ocr": { accept: "image/png,image/jpeg", multiple: true, run: (f) => ocrToPdf(f) },
  "word-to-pdf": {
    accept:
      ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    multiple: false,
    run: (f) => wordToPdf(f[0]),
  },
  "html-to-pdf": { accept: ".html,text/html", multiple: false, run: (f) => textToPdf(f[0]) },
  "excel-to-pdf": {
    accept:
      ".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
    multiple: false,
    run: (f) => textToPdf(f[0]),
  },
  "ppt-to-pdf": {
    accept:
      ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    multiple: true,
    run: (f) => imagesToPdf(f),
  },
  "crop-pdf": { accept: "application/pdf", multiple: false, run: (f) => cropPdf(f[0]) },
  "reorder-pages": { accept: "application/pdf", multiple: false, run: (f) => reorderPages(f[0]) },
  "edit-pdf": { accept: "application/pdf", multiple: false, run: (f) => addPageNumbers(f[0]) },
  "sign-pdf": {
    accept: "application/pdf",
    multiple: false,
    promptLabel: "Your name for signature stamp",
    promptPlaceholder: "Your Name",
    promptDefault: "SIGNED",
    run: (f, p) => watermarkPdf(f[0], p ?? "SIGNED"),
  },
  "scan-document": { accept: "image/png,image/jpeg", multiple: true, run: (f) => imagesToPdf(f) },
  "ai-summarize": {
    accept: "application/pdf",
    multiple: false,
    promptType: "select",
    promptLabel: "Summary language",
    promptDefault: "en",
    promptOptions: AI_LANG_OPTIONS,
    supportRetranslate: true,
    run: (f, p) => aiSummarize(f[0], p ?? "en"),
  },
  "ai-chat": {
    accept: "application/pdf",
    multiple: false,
    promptType: "select",
    promptLabel: "Summary language",
    promptDefault: "en",
    promptOptions: AI_LANG_OPTIONS,
    supportRetranslate: true,
    run: (f, p) => aiSummarize(f[0], p ?? "en"),
  },
  "ai-translate": {
    accept: "application/pdf",
    multiple: false,
    promptType: "select",
    promptLabel: "Translate to",
    promptDefault: "hi",
    promptOptions: AI_LANG_OPTIONS.filter((l) => l.value !== "en"),
    supportRetranslate: true,
    run: (f, p) => aiTranslate(f[0], p ?? "hi"),
  },
};
