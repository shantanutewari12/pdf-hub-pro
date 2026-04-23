import {
  FileText, FileType, Image, ScanText, Combine, Scissors, Minimize2, FileOutput,
  Crop, RotateCw, Pencil, Presentation, FileImage, Droplets, Unlock, Lock,
  ArrowUpDown, Trash2, Hash, Signature, FileSpreadsheet, Sheet, Globe, Camera,
  Sparkles, MessageSquare, Languages, PenLine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ToolCategory = "convert" | "organize" | "edit" | "secure" | "ai";

export type Tool = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: ToolCategory;
  popular?: boolean;
  pro?: boolean;
};

export const categories: Record<ToolCategory, { label: string; description: string }> = {
  convert: { label: "Convert", description: "Transform between formats" },
  organize: { label: "Organize", description: "Arrange and manage pages" },
  edit: { label: "Edit", description: "Modify content directly" },
  secure: { label: "Secure", description: "Protect and unlock files" },
  ai: { label: "AI Tools", description: "Smart document intelligence" },
};

export const tools: Tool[] = [
  { slug: "pdf-to-word", name: "PDF to Word", description: "Convert PDFs into editable Word documents.", icon: FileType, category: "convert", popular: true },
  { slug: "word-to-pdf", name: "Word to PDF", description: "Turn Word files into polished PDFs.", icon: FileText, category: "convert", popular: true },
  { slug: "image-to-pdf", name: "Image to PDF", description: "Combine JPG, PNG into a single PDF.", icon: Image, category: "convert", popular: true },
  { slug: "image-to-word", name: "Image to Word (OCR)", description: "Extract editable text from images.", icon: ScanText, category: "convert" },
  { slug: "pdf-to-ppt", name: "PDF to PPT", description: "Turn PDFs into PowerPoint slides.", icon: Presentation, category: "convert" },
  { slug: "ppt-to-pdf", name: "PPT to PDF", description: "Export presentations as PDFs.", icon: Presentation, category: "convert" },
  { slug: "pdf-to-image", name: "PDF to Image", description: "Render PDF pages as JPG or PNG.", icon: FileImage, category: "convert" },
  { slug: "excel-to-pdf", name: "Excel to PDF", description: "Convert spreadsheets to clean PDFs.", icon: FileSpreadsheet, category: "convert" },
  { slug: "pdf-to-excel", name: "PDF to Excel", description: "Pull tables from PDFs into Excel.", icon: Sheet, category: "convert" },
  { slug: "html-to-pdf", name: "HTML to PDF", description: "Capture web pages as PDFs.", icon: Globe, category: "convert" },

  { slug: "merge-pdf", name: "Merge PDF", description: "Combine multiple PDFs into one.", icon: Combine, category: "organize", popular: true },
  { slug: "split-pdf", name: "Split PDF", description: "Break a PDF into separate files.", icon: Scissors, category: "organize" },
  { slug: "compress-pdf", name: "Compress PDF", description: "Reduce file size without losing quality.", icon: Minimize2, category: "organize", popular: true },
  { slug: "extract-pages", name: "Extract Pages", description: "Pull selected pages into a new PDF.", icon: FileOutput, category: "organize" },
  { slug: "reorder-pages", name: "Reorder Pages", description: "Drag-and-drop page sorting.", icon: ArrowUpDown, category: "organize" },
  { slug: "delete-pages", name: "Delete Pages", description: "Remove unwanted pages instantly.", icon: Trash2, category: "organize" },

  { slug: "crop-pdf", name: "Crop PDF", description: "Trim margins and unwanted areas.", icon: Crop, category: "edit" },
  { slug: "rotate-pdf", name: "Rotate PDF", description: "Fix orientation of any page.", icon: RotateCw, category: "edit" },
  { slug: "edit-pdf", name: "Edit PDF", description: "Modify text, images, and shapes.", icon: Pencil, category: "edit" },
  { slug: "watermark-pdf", name: "Watermark PDF", description: "Add text or image watermarks.", icon: Droplets, category: "edit" },
  { slug: "page-numbers", name: "Add Page Numbers", description: "Number pages with custom styles.", icon: Hash, category: "edit" },
  { slug: "scan-document", name: "Scan with Camera", description: "Capture and digitize documents.", icon: Camera, category: "edit" },

  { slug: "unlock-pdf", name: "Unlock PDF", description: "Remove password from a PDF.", icon: Unlock, category: "secure" },
  { slug: "protect-pdf", name: "Protect PDF", description: "Add password and restrictions.", icon: Lock, category: "secure" },
  { slug: "sign-pdf", name: "Sign PDF", description: "Add digital or drawn signatures.", icon: Signature, category: "secure" },

  { slug: "ai-summarize", name: "AI Summarize", description: "Get instant document summaries.", icon: Sparkles, category: "ai", pro: true },
  { slug: "ai-chat", name: "Chat with PDF", description: "Ask questions, get cited answers.", icon: MessageSquare, category: "ai", pro: true },
  { slug: "ai-translate", name: "Translate PDF", description: "Translate while preserving layout.", icon: Languages, category: "ai", pro: true },
  { slug: "handwriting-ocr", name: "Handwriting to Text", description: "Convert handwritten notes.", icon: PenLine, category: "ai", pro: true },
];

export const popularTools = tools.filter((t) => t.popular);
export const getTool = (slug: string) => tools.find((t) => t.slug === slug);
