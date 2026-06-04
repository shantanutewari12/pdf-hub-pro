/**
 * word-processors.ts
 *
 * Document conversions involving Microsoft Word formats:
 *   • Word  → PDF   (server-side via CloudConvert, fallback: html2canvas)
 *   • PDF   → Word  (server-side via CloudConvert, fallback: image-in-docx)
 *   • Image → Word  (client-side: base64 embed in Word-compatible HTML)
 */

import type { ProcessResult } from "./pdf-processors";

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

const stripExt = (name: string) => name.replace(/\.[^.]+$/i, "");

async function loadJsPdf() {
  const module = await import("jspdf");
  return module.default;
}

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

async function generatePdfPreview(blob: Blob): Promise<string | undefined> {
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

function buildWordHtml(bodyHtml: string): string {
  return (
    `<html xmlns:o='urn:schemas-microsoft-com:office:office'` +
    ` xmlns:w='urn:schemas-microsoft-com:office:word'` +
    ` xmlns='http://www.w3.org/TR/REC-html40'>` +
    `<head><meta charset='utf-8'>` +
    `<style>@page{margin:1.5cm 2cm;}body{margin:0;padding:0;font-family:Calibri,Arial,sans-serif;}` +
    `div{margin:0;padding:0;}</style>` +
    `</head><body>${bodyHtml}</body></html>`
  );
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Word → PDF
 *
 * Primary  : POST /api/convert/word-to-pdf  (Vercel Edge → CloudConvert LibreOffice)
 *            → perfect quality, images/logos/borders preserved.
 * Fallback : html2canvas client-side render (no server needed, but images may vary).
 */
export async function wordToPdf(file: File): Promise<ProcessResult> {
  console.log("[word-processors] wordToPdf:", file.name);

  // ── Server-side path (CloudConvert) ──────────────────────────
  try {
    const arrayBuffer = await file.arrayBuffer();
    const response = await fetch("/api/convert/word-to-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Filename": file.name,
      },
      body: arrayBuffer,
    });

    if (response.ok) {
      const blob = await response.blob();
      const previewUrl = await generatePdfPreview(blob);
      return { blob, filename: stripExt(file.name) + ".pdf", previewUrl };
    }
    console.warn("[word-processors] API failed:", response.status, await response.text());
  } catch (err) {
    console.warn("[word-processors] API unreachable, falling back to client-side:", err);
  }

  // ── Client-side fallback (html2canvas) ───────────────────────
  console.log("[word-processors] wordToPdf: client-side fallback");
  const mammoth = await import("mammoth");
  const html2canvas = (await import("html2canvas")).default;
  const jsPDF = await loadJsPdf();

  const arrayBuffer = await file.arrayBuffer();
  const { value: bodyHtml } = await mammoth.convertToHtml({ arrayBuffer });

  const A4_WIDTH_PX = 794;
  const MARGIN_PX = 60;
  const wrapper = document.createElement("div");
  wrapper.style.cssText = [
    "position:fixed",
    "left:-9999px",
    "top:0",
    `width:${A4_WIDTH_PX}px`,
    "background:#fff",
    "color:#000",
    "font-family:Calibri,Arial,sans-serif",
    "font-size:11pt",
    "line-height:1.5",
    `padding:${MARGIN_PX}px`,
    "box-sizing:border-box",
    "word-wrap:break-word",
  ].join(";");
  wrapper.innerHTML =
    `<style>*{box-sizing:border-box}h1{font-size:20pt;font-weight:bold;margin:16px 0 8px}` +
    `h2{font-size:16pt;font-weight:bold;margin:14px 0 6px}p{margin:0 0 8px}` +
    `table{border-collapse:collapse;width:100%}td,th{border:1px solid #888;padding:4px 8px}` +
    `img{max-width:100%;height:auto;display:block;margin:8px auto}</style>` +
    bodyHtml;
  document.body.appendChild(wrapper);
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => setTimeout(r, 100));

  const fullCanvas = await html2canvas(wrapper, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
  document.body.removeChild(wrapper);

  const doc = new jsPDF("p", "mm", "a4");
  const PAGE_W_MM = 210;
  const PAGE_H_MM = 297;
  const pxPerMm = fullCanvas.width / PAGE_W_MM;
  const pageHeightPx = Math.floor(PAGE_H_MM * pxPerMm);
  const totalPages = Math.ceil(fullCanvas.height / pageHeightPx);

  for (let i = 0; i < totalPages; i++) {
    if (i > 0) doc.addPage();
    const sliceY = i * pageHeightPx;
    const sliceH = Math.min(pageHeightPx, fullCanvas.height - sliceY);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = fullCanvas.width;
    pageCanvas.height = sliceH;
    const ctx = pageCanvas.getContext("2d")!;
    ctx.drawImage(fullCanvas, 0, sliceY, fullCanvas.width, sliceH, 0, 0, fullCanvas.width, sliceH);
    doc.addImage(
      pageCanvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      0,
      0,
      PAGE_W_MM,
      (sliceH / fullCanvas.width) * PAGE_W_MM,
    );
  }

  const blob = doc.output("blob");
  const previewUrl = await generatePdfPreview(blob);
  return { blob, filename: stripExt(file.name) + ".pdf", previewUrl };
}

/**
 * PDF → Word (.docx)
 *
 * Primary  : POST /api/convert/pdf-to-word  (Vercel Edge → CloudConvert LibreOffice)
 *            → fully editable .docx, perfect layout, fonts, images.
 * Fallback : renders each PDF page as PNG and embeds in a .docx  (pixel-perfect, not editable).
 */
export async function pdfToWord(file: File): Promise<ProcessResult> {
  console.log("[word-processors] pdfToWord:", file.name);

  // ── Server-side path (CloudConvert) ──────────────────────────
  try {
    const arrayBuffer = await file.arrayBuffer();
    const response = await fetch("/api/convert/pdf-to-word", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Filename": file.name,
      },
      body: arrayBuffer,
    });

    if (response.ok) {
      const blob = await response.blob();
      return { blob, filename: stripExt(file.name) + ".docx" };
    }
    console.warn("[word-processors] API failed:", response.status, await response.text());
  } catch (err) {
    console.warn("[word-processors] API unreachable, falling back to client-side:", err);
  }

  // ── Client-side fallback: pages as images in .docx ───────────
  console.log("[word-processors] pdfToWord: client-side fallback");
  const pdfjs = await loadPdfJs();
  const { Document, Packer, Paragraph, ImageRun } = await import("docx");

  const RENDER_SCALE = 2;
  const CONTENT_WIDTH_EMU = 170 * 36000; // 170mm in EMU

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;

  type DocxSection = ConstructorParameters<typeof Document>[0]["sections"][number];
  const sections: DocxSection[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: RENDER_SCALE });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, canvas, viewport }).promise;

    const pngBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
    const pngBuffer = await pngBlob.arrayBuffer();

    const aspectRatio = canvas.height / canvas.width;
    const imgWidthEmu = CONTENT_WIDTH_EMU;
    const imgHeightEmu = Math.round(CONTENT_WIDTH_EMU * aspectRatio);

    sections.push({
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [
            new ImageRun({
              type: "png",
              data: pngBuffer,
              transformation: {
                width: imgWidthEmu / 9144,
                height: imgHeightEmu / 9144,
              },
            }),
          ],
        }),
      ],
    });
  }

  const wordDoc = new Document({ sections });
  const buffer = await Packer.toBlob(wordDoc);
  return {
    blob: new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    filename: stripExt(file.name) + ".docx",
  };
}

/**
 * Image(s) → Word (.doc)
 * Embeds images as base64 data-URLs in a Word-compatible HTML document.
 */
export async function imageToWord(files: File[]): Promise<ProcessResult> {
  console.log(
    "[word-processors] imageToWord:",
    files.map((f) => f.name),
  );

  let htmlBody = "";

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    htmlBody +=
      `<div style="text-align:center;margin:0;padding:0">` +
      `<img src="${dataUrl}" width="600" style="display:block;margin:0 auto;" />` +
      `</div>`;
    if (i < files.length - 1) {
      htmlBody += `<br clear="all" style="page-break-before:always" />`;
    }
  }

  return {
    blob: new Blob(["\ufeff", buildWordHtml(htmlBody)], { type: "application/msword" }),
    filename: stripExt(files[0].name) + "-converted.doc",
  };
}
