import { PDFDocument, degrees } from "pdf-lib";

export type ProcessResult = {
  blob: Blob;
  filename: string;
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

export async function mergePdfs(files: File[]): Promise<ProcessResult> {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const src = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const out = await merged.save();
  return { blob: new Blob([out as BlobPart], { type: "application/pdf" }), filename: "merged.pdf" };
}

export async function splitPdf(file: File): Promise<ProcessResult> {
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes);
  const count = src.getPageCount();
  if (count <= 1) {
    return { blob: new Blob([new Uint8Array(await src.save()) as BlobPart], { type: "application/pdf" }), filename: file.name };
  }
  for (let i = 0; i < count; i++) {
    const single = await PDFDocument.create();
    const [page] = await single.copyPages(src, [i]);
    single.addPage(page);
    const out = await single.save();
    download({
      blob: new Blob([out as BlobPart], { type: "application/pdf" }),
      filename: `${file.name.replace(/\.pdf$/i, "")}-page-${i + 1}.pdf`,
    });
    await new Promise((r) => setTimeout(r, 150));
  }
  const single = await PDFDocument.create();
  const [page] = await single.copyPages(src, [count - 1]);
  single.addPage(page);
  const out = await single.save();
  return {
    blob: new Blob([out as BlobPart], { type: "application/pdf" }),
    filename: `${file.name.replace(/\.pdf$/i, "")}-page-${count}.pdf`,
  };
}

export async function compressPdf(file: File): Promise<ProcessResult> {
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes);
  const out = await src.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
  return {
    blob: new Blob([out as BlobPart], { type: "application/pdf" }),
    filename: file.name.replace(/\.pdf$/i, "") + "-compressed.pdf",
  };
}

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

export async function rotatePdf(file: File, deg: number = 90): Promise<ProcessResult> {
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes);
  src.getPages().forEach((p) => p.setRotation(degrees(deg)));
  const out = await src.save();
  return {
    blob: new Blob([out as BlobPart], { type: "application/pdf" }),
    filename: file.name.replace(/\.pdf$/i, "") + "-rotated.pdf",
  };
}

export async function deletePages(file: File, pagesToDelete: number[]): Promise<ProcessResult> {
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();
  const set = new Set(pagesToDelete.map((p) => p - 1));
  const keep = src.getPageIndices().filter((i) => !set.has(i));
  const pages = await out.copyPages(src, keep);
  pages.forEach((p) => out.addPage(p));
  const bytesOut = await out.save();
  return {
    blob: new Blob([bytesOut as BlobPart], { type: "application/pdf" }),
    filename: file.name.replace(/\.pdf$/i, "") + "-edited.pdf",
  };
}

export function downloadResult(result: ProcessResult) {
  download(result);
}

export type ToolHandler = {
  accept: string;
  multiple: boolean;
  minFiles?: number;
  run: (files: File[]) => Promise<ProcessResult>;
};

export const toolHandlers: Record<string, ToolHandler> = {
  "merge-pdf": { accept: "application/pdf", multiple: true, minFiles: 2, run: (files) => mergePdfs(files) },
  "split-pdf": { accept: "application/pdf", multiple: false, run: (files) => splitPdf(files[0]) },
  "compress-pdf": { accept: "application/pdf", multiple: false, run: (files) => compressPdf(files[0]) },
  "image-to-pdf": { accept: "image/png,image/jpeg", multiple: true, run: (files) => imagesToPdf(files) },
  "rotate-pdf": { accept: "application/pdf", multiple: false, run: (files) => rotatePdf(files[0], 90) },
};
