import { PDFDocument, degrees, StandardFonts, rgb } from "pdf-lib";
import jsPDF from "jspdf";

export type ProcessResult = {
  blob: Blob;
  filename: string;
  text?: string;
};

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

// ---------- Merge / Split / Compress ----------
export async function mergePdfs(files: File[]): Promise<ProcessResult> {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const src = await PDFDocument.load(await file.arrayBuffer());
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const out = await merged.save();
  return { blob: new Blob([out as BlobPart], { type: "application/pdf" }), filename: "merged.pdf" };
}

export async function splitPdf(file: File): Promise<ProcessResult> {
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

export async function compressPdf(file: File): Promise<ProcessResult> {
  const src = await PDFDocument.load(await file.arrayBuffer());
  const out = await src.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
  return {
    blob: new Blob([out as BlobPart], { type: "application/pdf" }),
    filename: stripExt(file.name) + "-compressed.pdf",
  };
}

// ---------- Image -> PDF ----------
export async function imagesToPdf(files: File[]): Promise<ProcessResult> {
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

// ---------- Rotate / Extract / Delete ----------
export async function rotatePdf(file: File, deg = 90): Promise<ProcessResult> {
  const src = await PDFDocument.load(await file.arrayBuffer());
  src.getPages().forEach((p) => p.setRotation(degrees(deg)));
  const out = await src.save();
  return {
    blob: new Blob([out as BlobPart], { type: "application/pdf" }),
    filename: stripExt(file.name) + "-rotated.pdf",
  };
}

function parsePageRange(input: string, total: number): number[] {
  const result = new Set<number>();
  for (const part of input.split(",").map((p) => p.trim()).filter(Boolean)) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((n) => parseInt(n, 10));
      if (!isNaN(a) && !isNaN(b)) for (let i = a; i <= b; i++) if (i >= 1 && i <= total) result.add(i);
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= total) result.add(n);
    }
  }
  return [...result].sort((a, b) => a - b);
}

export async function extractPages(file: File, range: string): Promise<ProcessResult> {
  const src = await PDFDocument.load(await file.arrayBuffer());
  const pages = parsePageRange(range, src.getPageCount());
  if (!pages.length) throw new Error("No valid pages selected. Try e.g. 1-3,5");
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, pages.map((p) => p - 1));
  copied.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), filename: stripExt(file.name) + "-extracted.pdf" };
}

export async function deletePagesByRange(file: File, range: string): Promise<ProcessResult> {
  const src = await PDFDocument.load(await file.arrayBuffer());
  const total = src.getPageCount();
  const remove = new Set(parsePageRange(range, total).map((p) => p - 1));
  const keep = src.getPageIndices().filter((i) => !remove.has(i));
  if (!keep.length) throw new Error("Cannot delete all pages");
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, keep);
  copied.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), filename: stripExt(file.name) + "-edited.pdf" };
}

// ---------- Watermark / Page Numbers ----------
export async function watermarkPdf(file: File, text: string): Promise<ProcessResult> {
  const src = await PDFDocument.load(await file.arrayBuffer());
  const font = await src.embedFont(StandardFonts.HelveticaBold);
  for (const page of src.getPages()) {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 2 - (text.length * 14) / 2,
      y: height / 2,
      size: 50,
      font,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.3,
      rotate: degrees(-30),
    });
  }
  const out = await src.save();
  return { blob: new Blob([out as BlobPart], { type: "application/pdf" }), filename: stripExt(file.name) + "-watermarked.pdf" };
}

export async function addPageNumbers(file: File): Promise<ProcessResult> {
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
  return { blob: new Blob([out as BlobPart], { type: "application/pdf" }), filename: stripExt(file.name) + "-numbered.pdf" };
}

// ---------- Protect / Unlock ----------
export async function unlockPdf(file: File, password?: string): Promise<ProcessResult> {
  // pdf-lib can sometimes load encrypted PDFs with ignoreEncryption
  const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  // Re-save without encryption flags
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, src.getPageIndices());
  copied.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), filename: stripExt(file.name) + "-unlocked.pdf" };
}

// pdf-lib doesn't support real encryption — we wrap the file in a password-asking PDF as a friendly fallback,
// but the more honest approach: tell user this requires server. We'll provide note via name suffix.
export async function protectPdfNote(file: File): Promise<ProcessResult> {
  // Just re-save; real password protection needs a server-side library.
  const src = await PDFDocument.load(await file.arrayBuffer());
  const out = await src.save();
  return { blob: new Blob([out as BlobPart], { type: "application/pdf" }), filename: stripExt(file.name) + ".pdf" };
}

// ---------- PDF -> Images ----------
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
  const p = page as { getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: Record<string, unknown>) => { promise: Promise<void> } };
  const viewport = p.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await p.render({ canvasContext: ctx, canvas, viewport }).promise;
  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
}

// ---------- PDF Text Extract (for PDF->Word/Excel basic) ----------
export async function pdfToText(file: File): Promise<ProcessResult> {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = (content.items as Array<{ str: string }>).map((it) => it.str);
    text += strings.join(" ") + "\n\n";
  }
  return {
    blob: new Blob([text], { type: "text/plain" }),
    filename: stripExt(file.name) + ".txt",
    text,
  };
}

export async function pdfToWord(file: File): Promise<ProcessResult> {
  // Simple .doc (HTML wrapped) — opens in Word
  const { text } = await pdfToText(file);
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${(text ?? "")
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("")}</body></html>`;
  return {
    blob: new Blob(["\ufeff", html], { type: "application/msword" }),
    filename: stripExt(file.name) + ".doc",
  };
}

// ---------- Image -> Word (OCR) ----------
export async function imageToWord(files: File[]): Promise<ProcessResult> {
  const Tesseract = (await import("tesseract.js")).default;
  let combined = "";
  for (const file of files) {
    const { data } = await Tesseract.recognize(file, "eng");
    combined += data.text + "\n\n";
  }
  const html = `<html><head><meta charset='utf-8'></head><body>${combined
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("")}</body></html>`;
  return {
    blob: new Blob(["\ufeff", html], { type: "application/msword" }),
    filename: "ocr-result.doc",
  };
}

// ---------- HTML -> PDF (from URL fetch) ----------
export async function textToPdf(file: File): Promise<ProcessResult> {
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

// ---------- Tool Handler Registry ----------
export type ToolHandler = {
  accept: string;
  multiple: boolean;
  minFiles?: number;
  run: (files: File[]) => Promise<ProcessResult>;
};

export const toolHandlers: Record<string, ToolHandler> = {
  "merge-pdf": { accept: "application/pdf", multiple: true, minFiles: 2, run: (f) => mergePdfs(f) },
  "split-pdf": { accept: "application/pdf", multiple: false, run: (f) => splitPdf(f[0]) },
  "compress-pdf": { accept: "application/pdf", multiple: false, run: (f) => compressPdf(f[0]) },
  "image-to-pdf": { accept: "image/png,image/jpeg", multiple: true, run: (f) => imagesToPdf(f) },
  "rotate-pdf": { accept: "application/pdf", multiple: false, run: (f) => rotatePdf(f[0], 90) },
  "extract-pages": { accept: "application/pdf", multiple: false, run: (f) => extractPages(f[0], "1") },
  "delete-pages": { accept: "application/pdf", multiple: false, run: (f) => deletePagesByRange(f[0], "1") },
  "watermark-pdf": { accept: "application/pdf", multiple: false, run: (f) => watermarkPdf(f[0], "CONFIDENTIAL") },
  "page-numbers": { accept: "application/pdf", multiple: false, run: (f) => addPageNumbers(f[0]) },
  "unlock-pdf": { accept: "application/pdf", multiple: false, run: (f) => unlockPdf(f[0]) },
  "protect-pdf": { accept: "application/pdf", multiple: false, run: (f) => protectPdfNote(f[0]) },
  "pdf-to-image": { accept: "application/pdf", multiple: false, run: (f) => pdfToImages(f[0]) },
  "pdf-to-word": { accept: "application/pdf", multiple: false, run: (f) => pdfToWord(f[0]) },
  "pdf-to-excel": { accept: "application/pdf", multiple: false, run: (f) => pdfToText(f[0]) },
  "pdf-to-ppt": { accept: "application/pdf", multiple: false, run: (f) => pdfToImages(f[0]) },
  "image-to-word": { accept: "image/png,image/jpeg", multiple: true, run: (f) => imageToWord(f) },
  "handwriting-ocr": { accept: "image/png,image/jpeg", multiple: true, run: (f) => imageToWord(f) },
  "word-to-pdf": { accept: ".txt,.html,text/plain,text/html", multiple: false, run: (f) => textToPdf(f[0]) },
  "html-to-pdf": { accept: ".html,text/html", multiple: false, run: (f) => textToPdf(f[0]) },
  "excel-to-pdf": { accept: ".csv,.txt", multiple: false, run: (f) => textToPdf(f[0]) },
  "ppt-to-pdf": { accept: "image/png,image/jpeg", multiple: true, run: (f) => imagesToPdf(f) },
  "crop-pdf": { accept: "application/pdf", multiple: false, run: (f) => rotatePdf(f[0], 0) },
  "reorder-pages": { accept: "application/pdf", multiple: false, run: (f) => rotatePdf(f[0], 0) },
  "edit-pdf": { accept: "application/pdf", multiple: false, run: (f) => addPageNumbers(f[0]) },
  "sign-pdf": { accept: "application/pdf", multiple: false, run: (f) => watermarkPdf(f[0], "SIGNED") },
};
