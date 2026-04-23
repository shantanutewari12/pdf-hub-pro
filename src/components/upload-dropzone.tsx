import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, X, Lock, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toolHandlers, downloadResult, type ProcessResult } from "@/lib/pdf-processors";

type Props = {
  toolName?: string;
  toolSlug?: string;
  accept?: string;
  multiple?: boolean;
};

export function UploadDropzone({ toolName = "files", toolSlug, accept, multiple = true }: Props) {
  const handler = toolSlug ? toolHandlers[toolSlug] : undefined;
  const effectiveAccept = handler?.accept ?? accept;
  const effectiveMultiple = handler?.multiple ?? multiple;

  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setResult(null);
    setFiles((prev) => (effectiveMultiple ? [...prev, ...arr] : arr.slice(0, 1)));
  }, [effectiveMultiple]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    addFiles(e.dataTransfer.files);
  };

  const start = async () => {
    if (!files.length) return;
    if (handler?.minFiles && files.length < handler.minFiles) {
      toast.error(`Please select at least ${handler.minFiles} files`);
      return;
    }
    setProcessing(true);
    setProgress(10);
    const tick = setInterval(() => setProgress((p) => (p < 85 ? p + 5 : p)), 80);
    try {
      if (handler) {
        const res = await handler.run(files);
        clearInterval(tick);
        setProgress(100);
        setResult(res);
        downloadResult(res);
        toast.success("Done!", { description: "Your file is ready and downloading." });
      } else {
        // Fallback simulation for tools not yet wired
        for (let i = 10; i <= 100; i += 10) {
          await new Promise((r) => setTimeout(r, 80));
          setProgress(i);
        }
        clearInterval(tick);
        toast.info("This tool is coming soon", { description: "UI ready — processing not yet enabled." });
      }
    } catch (err) {
      clearInterval(tick);
      toast.error("Processing failed", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        animate={{ scale: drag ? 1.01 : 1 }}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center transition-all ${
          drag
            ? "border-primary bg-primary/5"
            : "border-border bg-card/60 hover:border-primary/40 hover:bg-card"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ y: drag ? -6 : 0 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-emerald shadow-elevated"
          >
            <UploadCloud className="h-8 w-8 text-primary-foreground" strokeWidth={2} />
          </motion.div>
          <div>
            <h3 className="font-display text-xl font-semibold">
              Drop your {toolName} here
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
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
            <span className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-gradient-emerald px-6 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition">
              Select files
            </span>
          </label>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
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
            className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-soft"
          >
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
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

            {processing && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Processing securely…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-emerald"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {result && !processing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 p-3"
              >
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">{result.filename} ready</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => downloadResult(result)}
                  className="bg-gradient-emerald text-primary-foreground hover:opacity-90"
                >
                  <Download className="h-4 w-4 mr-1.5" /> Download
                </Button>
              </motion.div>
            )}

            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setFiles([]); setResult(null); }} disabled={processing}>
                Clear
              </Button>
              <Button
                onClick={start}
                disabled={processing}
                className="bg-gradient-emerald text-primary-foreground hover:opacity-90"
              >
                {processing ? "Processing…" : `Start (${files.length})`}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
