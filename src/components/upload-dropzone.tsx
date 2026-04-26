import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileText,
  X,
  Lock,
  Download,
  CheckCircle2,
  Eye,
  FileSearch,
  RefreshCw,
  Brain,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  toolHandlers,
  downloadResult,
  generatePdfPreview,
  type ProcessResult,
} from "@/lib/pdf-processors";
import { playSuccessSound, playDownloadSound } from "@/lib/sounds";
import { addActivity } from "@/lib/activity";

const AI_SLUGS = new Set(["ai-summarize", "ai-translate", "ai-chat"]);
const AI_PHRASES = [
  "AI is analyzing your document…",
  "Extracting key insights…",
  "Understanding the content…",
  "Generating intelligent output…",
  "Almost there, magic happening…",
];

type Props = {
  toolName?: string;
  toolSlug?: string;
  accept?: string;
  multiple?: boolean;
  initialFiles?: File[];
};

export function UploadDropzone({
  toolName = "files",
  toolSlug,
  accept,
  multiple = true,
  initialFiles,
}: Props) {
  const handler = toolSlug ? toolHandlers[toolSlug] : undefined;
  const effectiveAccept = handler?.accept ?? accept;
  const effectiveMultiple = handler?.multiple ?? multiple;
  const isAI = AI_SLUGS.has(toolSlug ?? "");

  const [files, setFiles] = useState<File[]>(initialFiles ?? []);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [promptValue, setPromptValue] = useState(handler?.promptDefault ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [retranslateLang, setRetranslateLang] = useState(handler?.promptDefault ?? "en");
  const [retranslating, setRetranslating] = useState(false);
  const [aiPhrase, setAiPhrase] = useState(0);

  // Auto-start if initial files are provided
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && !processing && !result) {
      // Small delay to ensure everything is loaded
      const t = setTimeout(() => {
        start();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [initialFiles]);

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      setResult(null);
      setPreviewUrl(null);
      setShowPreview(false);
      setFiles((prev) =>
        effectiveMultiple ? [...prev, ...Array.from(list)] : Array.from(list).slice(0, 1),
      );
    },
    [effectiveMultiple],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    addFiles(e.dataTransfer.files);
  };

  const handlePreview = async (res: ProcessResult) => {
    setGeneratingPreview(true);
    try {
      if (res.blob.type === "application/pdf") {
        const url = res.previewUrl ?? (await generatePdfPreview(res.blob));
        setPreviewUrl(url ?? null);
      } else if (res.text) {
        setPreviewUrl(null);
      } else if (res.blob.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(res.blob));
      }
      setShowPreview(true);
    } catch {
      toast.error("Could not generate preview");
    } finally {
      setGeneratingPreview(false);
    }
  };

  const start = async () => {
    if (!files.length) return;
    if (handler?.minFiles && files.length < handler.minFiles) {
      toast.error(`Please select at least ${handler.minFiles} files`);
      return;
    }
    setProcessing(true);
    setProgress(10);
    setShowPreview(false);
    setPreviewUrl(null);
    setAiPhrase(0);

    // AI phrase rotation
    let phraseInterval: ReturnType<typeof setInterval> | null = null;
    if (isAI) {
      phraseInterval = setInterval(() => setAiPhrase((p) => (p + 1) % AI_PHRASES.length), 2500);
    }

    const tick = setInterval(() => setProgress((p) => (p < 85 ? p + 5 : p)), 80);
    try {
      if (handler) {
        const res = await handler.run(files, handler.promptLabel ? promptValue : undefined);
        clearInterval(tick);
        if (phraseInterval) clearInterval(phraseInterval);
        setProgress(100);
        setResult(res);
        setRetranslateLang(promptValue || handler.promptDefault || "en");
        playSuccessSound();
        addActivity(toolName, toolSlug ?? "", files[0]?.name ?? "file");
        toast.success("Done! Preview or download your file. ✨", { duration: 4000 });
      } else {
        for (let i = 10; i <= 100; i += 10) {
          await new Promise((r) => setTimeout(r, 80));
          setProgress(i);
        }
        clearInterval(tick);
        toast.info("This tool is coming soon");
      }
    } catch (err) {
      clearInterval(tick);
      if (phraseInterval) clearInterval(phraseInterval);
      toast.error("Processing failed", { description: err instanceof Error ? err.message : "" });
    } finally {
      setProcessing(false);
    }
  };

  const handleRetranslate = async (newLang: string) => {
    if (!handler || !files.length) return;
    setRetranslating(true);
    setRetranslateLang(newLang);
    try {
      const res = await handler.run(files, newLang);
      setResult(res);
      if (res.text) {
        setPreviewUrl(null);
        setShowPreview(true);
      }
      playSuccessSound();
      toast.success("Language updated!", { duration: 2000 });
    } catch (err) {
      toast.error("Re-processing failed", { description: err instanceof Error ? err.message : "" });
    } finally {
      setRetranslating(false);
    }
  };

  const handleDownload = (res: ProcessResult) => {
    downloadResult(res);
    playDownloadSound();
  };

  const renderPrompt = () => {
    if (!handler?.promptLabel) return null;
    if (handler.promptType === "select" && handler.promptOptions) {
      return (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1.5">{handler.promptLabel}</label>
          <select
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            disabled={processing}
            className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
          >
            {handler.promptOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1.5">{handler.promptLabel}</label>
        <input
          type="text"
          value={promptValue}
          onChange={(e) => setPromptValue(e.target.value)}
          placeholder={handler.promptPlaceholder ?? ""}
          disabled={processing}
          className="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop zone */}
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        animate={{ scale: drag ? 1.01 : 1 }}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-6 sm:p-10 md:p-14 text-center transition-all ${
          drag
            ? "border-primary bg-primary/5"
            : "border-border bg-card/60 hover:border-primary/40 hover:bg-card"
        }`}
      >
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <motion.div
            animate={{ y: drag ? -6 : 0 }}
            className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl shadow-elevated ${isAI ? "bg-gradient-to-br from-primary via-emerald-500 to-teal-500" : "bg-gradient-emerald"}`}
          >
            {isAI ? (
              <Brain className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" strokeWidth={2} />
            ) : (
              <UploadCloud
                className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground"
                strokeWidth={2}
              />
            )}
          </motion.div>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-semibold">
              {isAI && <Sparkles className="h-4 w-4 inline mr-1.5 text-gold" />}
              Drop your {toolName} here
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              or click to browse — up to 100MB
            </p>
          </div>
          <label>
            <input
              type="file"
              className="hidden"
              accept={effectiveAccept}
              multiple={effectiveMultiple}
              onChange={(e) => addFiles(e.target.files)}
            />
            <span className="inline-flex h-10 sm:h-11 cursor-pointer items-center justify-center rounded-xl bg-gradient-emerald px-5 sm:px-6 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition">
              Select files
            </span>
          </label>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 sm:mt-2">
            <Lock className="h-3 w-3" /> Processed in your browser — files never leave your device
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-soft"
          >
            {/* File list */}
            <div className="space-y-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 sm:gap-3 rounded-lg bg-muted/40 px-2 sm:px-3 py-2"
                >
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(f.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                    className="p-1 rounded hover:bg-background"
                    disabled={processing}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>

            {renderPrompt()}

            {/* AI Processing Animation */}
            {processing && isAI && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 rounded-2xl bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-primary/20 p-5 text-center"
              >
                <div className="relative mx-auto w-16 h-16 mb-4">
                  {/* Outer ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary" />
                  </motion.div>
                  {/* Inner pulse */}
                  <motion.div
                    className="absolute inset-2 rounded-full bg-primary/10"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  {/* Brain icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <motion.p
                  key={aiPhrase}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-medium text-primary"
                >
                  {AI_PHRASES[aiPhrase]}
                </motion.p>
                <p className="text-xs text-muted-foreground mt-1">Powered by AI ✨</p>
              </motion.div>
            )}

            {/* Normal Progress bar */}
            {processing && !isAI && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Processing securely…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-emerald"
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>
              </div>
            )}

            {/* Result card */}
            {result && !processing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm min-w-0">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-medium truncate">{result.filename}</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(result)}
                      disabled={generatingPreview}
                      className="gap-1.5 flex-1 sm:flex-none"
                    >
                      {generatingPreview ? (
                        <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(result)}
                      className="bg-gradient-emerald text-primary-foreground hover:opacity-90 gap-1.5 flex-1 sm:flex-none"
                    >
                      <Download className="h-4 w-4" /> Download
                    </Button>
                  </div>
                </div>

                {/* Retranslate dropdown */}
                {handler?.supportRetranslate && handler.promptOptions && (
                  <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-3 border-t border-primary/10">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <RefreshCw className={`h-3.5 w-3.5 ${retranslating ? "animate-spin" : ""}`} />
                      <span>Switch language:</span>
                    </div>
                    <select
                      value={retranslateLang}
                      onChange={(e) => handleRetranslate(e.target.value)}
                      disabled={retranslating}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer w-full sm:w-auto"
                    >
                      {handler.promptOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {retranslating && (
                      <span className="text-xs text-muted-foreground">Translating…</span>
                    )}
                  </div>
                )}

                {/* Preview panel */}
                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 overflow-hidden"
                    >
                      <div className="rounded-xl border border-border overflow-hidden bg-background">
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full object-contain max-h-[400px] sm:max-h-[500px]"
                          />
                        )}
                        {!previewUrl && result.text && (
                          <div className="p-3 sm:p-4">
                            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              <FileSearch className="h-3.5 w-3.5" /> Content Preview
                            </div>
                            <pre className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed font-sans text-foreground max-h-60 sm:max-h-80 overflow-y-auto">
                              {result.text}
                            </pre>
                          </div>
                        )}
                        {!previewUrl && !result.text && (
                          <div className="p-4 sm:p-6 text-center text-sm text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-2 text-primary/50" />
                            <p>Preview not available for this file type.</p>
                            <p className="mt-1">Download and open in Microsoft Word / Excel.</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setShowPreview(false)}
                        className="mt-2 text-xs text-muted-foreground hover:text-foreground transition"
                      >
                        Hide preview
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="mt-4 flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setFiles([]);
                  setResult(null);
                  setPreviewUrl(null);
                  setShowPreview(false);
                }}
                disabled={processing}
              >
                Clear
              </Button>
              <Button
                onClick={start}
                disabled={processing}
                className="bg-gradient-emerald text-primary-foreground hover:opacity-90"
              >
                {processing ? (isAI ? "AI Processing…" : "Processing…") : `Start (${files.length})`}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
