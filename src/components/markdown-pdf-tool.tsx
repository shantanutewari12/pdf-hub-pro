/**
 * Markdown ↔ PDF Converter — dedicated visual tool component
 * PDF → Markdown: extracts text, formats as Markdown
 * Markdown → PDF: parses .md file or pasted text, renders to PDF
 */
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileText,
  FileCode2,
  ArrowRight,
  Download,
  Copy,
  Check,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { playSuccessSound, playDownloadSound } from "@/lib/sounds";
import { addActivity } from "@/lib/activity";

// ── PDF → Markdown ────────────────────────────────────────────────────────────
async function pdfToMarkdown(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  let md = `# ${file.name.replace(/\.pdf$/i, "")}\n\n`;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    if (pdf.numPages > 1) {
      md += `## Page ${i}\n\n`;
    }

    let lastY = -1;
    let paragraph = "";

    for (const item of content.items as Array<{ str: string; transform: number[] }>) {
      const y = Math.round(item.transform[5]);
      const text = item.str;

      if (!text.trim()) continue;

      if (lastY !== -1 && Math.abs(y - lastY) > 15) {
        // New paragraph
        if (paragraph.trim()) {
          // Heuristic: short line at top of page → heading
          if (paragraph.length < 60 && paragraph === paragraph.trim() && i === 1 && lastY > 700) {
            md += `## ${paragraph.trim()}\n\n`;
          } else {
            md += `${paragraph.trim()}\n\n`;
          }
          paragraph = "";
        }
      }

      paragraph += (paragraph && !paragraph.endsWith(" ") ? " " : "") + text;
      lastY = y;
    }

    if (paragraph.trim()) {
      md += `${paragraph.trim()}\n\n`;
    }
  }

  return md.trim();
}

// ── Markdown → PDF ────────────────────────────────────────────────────────────
async function markdownToPdf(markdownText: string, filename = "document"): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const lines = markdownText.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // H1
    if (line.startsWith("# ")) {
      addPageIfNeeded(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      const wrapped = doc.splitTextToSize(line.slice(2), contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 9 + 5;
      // Underline
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.6);
      doc.line(margin, y - 3, pageWidth - margin, y - 3);
      y += 3;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      addPageIfNeeded(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      const wrapped = doc.splitTextToSize(line.slice(3), contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 7 + 4;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      addPageIfNeeded(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      const wrapped = doc.splitTextToSize(line.slice(4), contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 6 + 3;
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$|^\*\*\*+$/)) {
      addPageIfNeeded(5);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
      continue;
    }

    // Bullet list
    if (line.match(/^[-*+] /)) {
      addPageIfNeeded(7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      const content = line
        .slice(2)
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1");
      const wrapped = doc.splitTextToSize(content, contentWidth - 8);
      doc.text("•", margin + 2, y);
      doc.text(wrapped, margin + 8, y);
      y += wrapped.length * 5.5 + 2;
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      addPageIfNeeded(7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      const match = line.match(/^(\d+)\. (.+)/);
      if (match) {
        const content = match[2].replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
        const wrapped = doc.splitTextToSize(content, contentWidth - 10);
        doc.text(`${match[1]}.`, margin, y);
        doc.text(wrapped, margin + 10, y);
        y += wrapped.length * 5.5 + 2;
      }
      continue;
    }

    // Code block line
    if (line.startsWith("    ") || line.startsWith("\t")) {
      addPageIfNeeded(6);
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.setFillColor(248, 250, 252);
      const codeText = line.replace(/^\t/, "    ");
      const wrapped = doc.splitTextToSize(codeText, contentWidth - 10);
      doc.roundedRect(margin, y - 4, contentWidth, wrapped.length * 4.5 + 3, 1, 1, "F");
      doc.text(wrapped, margin + 4, y);
      y += wrapped.length * 4.5 + 5;
      continue;
    }

    // Empty line → small gap
    if (!line.trim()) {
      y += 3;
      continue;
    }

    // Normal paragraph — strip inline markdown
    addPageIfNeeded(7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const cleaned = line
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1");
    const wrapped = doc.splitTextToSize(cleaned, contentWidth);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5.5 + 2;
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${filename} — Page ${p} of ${totalPages} • Generated by PDF Master`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" },
    );
  }

  return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
}

// ── Component ─────────────────────────────────────────────────────────────────
type Mode = "pdf-to-md" | "md-to-pdf";

export function MarkdownPdfTool() {
  const [mode, setMode] = useState<Mode>("pdf-to-md");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mdOutput, setMdOutput] = useState<string>("");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [mdInput, setMdInput] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setMdOutput("");
    setPdfBlob(null);
    setMdInput("");
    setProgress(0);
  };

  const handleFile = useCallback(
    (f: File) => {
      reset();
      if (mode === "pdf-to-md" && !f.name.endsWith(".pdf") && f.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      if (mode === "md-to-pdf" && !f.name.endsWith(".md")) {
        toast.error("Please upload a .md Markdown file");
        return;
      }
      setFile(f);
      // Auto-load .md file content
      if (f.name.endsWith(".md")) {
        const reader = new FileReader();
        reader.onload = (e) => setMdInput(e.target?.result as string);
        reader.readAsText(f);
      }
    },
    [mode],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const runConversion = async () => {
    if (mode === "pdf-to-md" && !file) return;
    if (mode === "md-to-pdf" && !mdInput.trim()) {
      toast.error("Please paste or upload some Markdown content");
      return;
    }

    setProcessing(true);
    setProgress(10);
    const tick = setInterval(() => setProgress((p) => (p < 85 ? p + 8 : p)), 150);

    try {
      if (mode === "pdf-to-md") {
        const md = await pdfToMarkdown(file!);
        clearInterval(tick);
        setProgress(100);
        setMdOutput(md);
        addActivity("PDF to Markdown", "markdown-converter", file!.name);
      } else {
        const name = file?.name.replace(/\.md$/i, "") ?? "document";
        const blob = await markdownToPdf(mdInput, name);
        clearInterval(tick);
        setProgress(100);
        setPdfBlob(blob);
        addActivity("Markdown to PDF", "markdown-converter", file?.name ?? "markdown");
      }
      playSuccessSound();
      toast.success("Conversion complete! ✨", { duration: 3000 });
    } catch (err) {
      clearInterval(tick);
      toast.error("Conversion failed", { description: err instanceof Error ? err.message : "" });
    } finally {
      setProcessing(false);
    }
  };

  const downloadMd = () => {
    const baseName = file?.name.replace(/\.pdf$/i, "") ?? "converted";
    const blob = new Blob([mdOutput], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.md`;
    a.click();
    URL.revokeObjectURL(url);
    playDownloadSound();
  };

  const downloadPdf = () => {
    if (!pdfBlob) return;
    const baseName = file?.name.replace(/\.md$/i, "") ?? "converted";
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    playDownloadSound();
  };

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(mdOutput);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const accept = mode === "pdf-to-md" ? "application/pdf" : ".md,text/markdown,text/plain";

  return (
    <div className="w-full space-y-5">
      {/* Mode Toggle — explicit input/output labels */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            setMode("pdf-to-md");
            reset();
          }}
          className={`group relative rounded-2xl border-2 p-4 text-left transition-all ${
            mode === "pdf-to-md"
              ? "border-primary bg-primary/5 shadow-soft"
              : "border-border bg-card hover:border-primary/40 hover:bg-card"
          }`}
        >
          {mode === "pdf-to-md" && (
            <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
              <Check className="h-3 w-3 text-primary-foreground" />
            </span>
          )}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <FileCode2 className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <p className="font-display font-bold text-sm">PDF → Markdown</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Upload a <span className="font-semibold text-blue-500">.pdf</span> file
            {" → "}download a clean <span className="font-semibold text-emerald-500">.md</span> file
          </p>
        </button>

        <button
          onClick={() => {
            setMode("md-to-pdf");
            reset();
          }}
          className={`group relative rounded-2xl border-2 p-4 text-left transition-all ${
            mode === "md-to-pdf"
              ? "border-primary bg-primary/5 shadow-soft"
              : "border-border bg-card hover:border-primary/40 hover:bg-card"
          }`}
        >
          {mode === "md-to-pdf" && (
            <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
              <Check className="h-3 w-3 text-primary-foreground" />
            </span>
          )}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <FileCode2 className="h-4 w-4 text-emerald-500" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <FileText className="h-4 w-4 text-red-500" />
            </div>
          </div>
          <p className="font-display font-bold text-sm">Markdown → PDF</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Upload a <span className="font-semibold text-emerald-500">.md</span> file or paste text
            {" → "}download a styled <span className="font-semibold text-red-500">.pdf</span>
          </p>
        </button>
      </div>

      {/* Drop zone */}
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        animate={{ scale: drag ? 1.01 : 1 }}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer ${
          drag
            ? "border-primary bg-primary/5"
            : file
              ? "border-primary/40 bg-primary/5"
              : "border-border bg-card/60 hover:border-primary/40 hover:bg-card"
        }`}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              {mode === "pdf-to-md" ? (
                <FileText className="h-6 w-6 text-primary" />
              ) : (
                <FileCode2 className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Change file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ y: drag ? -6 : 0 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-emerald shadow-elevated"
            >
              <UploadCloud className="h-7 w-7 text-primary-foreground" strokeWidth={2} />
            </motion.div>
            <div>
              <h3 className="font-display text-lg font-semibold">
                {mode === "pdf-to-md" ? "Drop your PDF here" : "Drop your .md file here"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "pdf-to-md"
                  ? "We'll extract the text and convert to clean Markdown"
                  : "Or paste Markdown content below to convert to PDF"}
              </p>
            </div>
            <span className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-emerald px-5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition">
              Select file
            </span>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" /> Processed entirely in your browser
            </p>
          </div>
        )}
      </motion.div>

      {/* Markdown paste area (md-to-pdf mode only) */}
      {mode === "md-to-pdf" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <label className="block text-sm font-medium mb-2">
            Markdown content
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              (paste here or upload a .md file above)
            </span>
          </label>
          <textarea
            value={mdInput}
            onChange={(e) => setMdInput(e.target.value)}
            placeholder={`# My Document\n\n## Introduction\n\nWrite your **Markdown** content here.\n\n- Item one\n- Item two\n- Item three\n\n### Code Example\n\n    const hello = "world";\n`}
            rows={12}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        </motion.div>
      )}

      {/* Progress bar */}
      <AnimatePresence>
        {processing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{mode === "pdf-to-md" ? "Extracting & formatting…" : "Rendering PDF…"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-gradient-emerald"
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action button */}
      {!mdOutput && !pdfBlob && (
        <Button
          onClick={runConversion}
          disabled={processing || (mode === "pdf-to-md" ? !file : !mdInput.trim())}
          className="w-full h-12 bg-gradient-emerald text-primary-foreground hover:opacity-90 font-semibold rounded-xl text-base gap-2"
        >
          {processing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {processing
            ? mode === "pdf-to-md"
              ? "Converting…"
              : "Generating PDF…"
            : mode === "pdf-to-md"
              ? "Convert to Markdown"
              : "Generate PDF"}
        </Button>
      )}

      {/* PDF → Markdown result */}
      <AnimatePresence>
        {mdOutput && !processing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-primary/10">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <FileCode2 className="h-4 w-4" />
                Markdown output ready
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyMarkdown}
                  className="gap-1.5 h-8 text-xs"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  onClick={downloadMd}
                  className="gap-1.5 h-8 text-xs bg-gradient-emerald text-primary-foreground hover:opacity-90"
                >
                  <Download className="h-3.5 w-3.5" /> Download .md
                </Button>
                <button
                  onClick={() => setPreviewExpanded((v) => !v)}
                  className="p-1.5 rounded-lg hover:bg-background transition text-muted-foreground"
                >
                  {previewExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {previewExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <pre className="p-4 text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto max-h-80 overflow-y-auto text-foreground whitespace-pre-wrap">
                    {mdOutput}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="px-4 pb-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="text-xs text-muted-foreground"
              >
                Convert another file
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Markdown → PDF result */}
      <AnimatePresence>
        {pdfBlob && !processing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-primary/20 bg-primary/5 p-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <FileText className="h-4 w-4" />
                PDF generated successfully
                <span className="text-xs text-muted-foreground font-normal">
                  ({(pdfBlob.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="text-xs flex-1 sm:flex-none"
                >
                  Convert another
                </Button>
                <Button
                  size="sm"
                  onClick={downloadPdf}
                  className="gap-1.5 bg-gradient-emerald text-primary-foreground hover:opacity-90 flex-1 sm:flex-none"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
