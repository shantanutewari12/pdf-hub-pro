import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Loader2, UploadCloud } from "lucide-react";
import { motion } from "framer-motion";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToolCard } from "@/components/tool-card";
import { getTool, tools } from "@/lib/tools";

const UploadDropzone = lazy(() => import("@/components/upload-dropzone").then((m) => ({ default: m.UploadDropzone })));
const PdfEditor = lazy(() => import("@/components/pdf-editor").then((m) => ({ default: m.PdfEditor })));
const RotateEditor = lazy(() => import("@/components/rotate-editor").then((m) => ({ default: m.RotateEditor })));
const CropEditor = lazy(() => import("@/components/crop-editor").then((m) => ({ default: m.CropEditor })));

const VISUAL_EDITORS = new Set(["edit-pdf", "crop-pdf", "rotate-pdf"]);

export const Route = createFileRoute("/tools/$slug")({
  loader: ({ params }) => {
    const tool = getTool(params.slug);
    if (!tool) throw notFound();
    return { tool: { slug: tool.slug, name: tool.name, description: tool.description, category: tool.category, pro: tool.pro ?? false } };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.tool.name} — PDF Master` },
          { name: "description", content: loaderData.tool.description },
          { property: "og:title", content: `${loaderData.tool.name} — PDF Master` },
          { property: "og:description", content: loaderData.tool.description },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="font-display text-3xl font-bold">Tool not found</h1>
          <Link to="/tools" className="mt-4 inline-block text-primary underline">Back to tools</Link>
        </div>
      </main>
      <Footer />
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <h1 className="font-display text-3xl font-bold">Unable to open tool</h1>
            <p className="mt-3 text-muted-foreground">{error.message || "Something went wrong."}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-xl bg-gradient-emerald px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition">Try again</button>
              <Link to="/tools" className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-card">Back to tools</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  },
  component: ToolPage,
});

function ToolPage() {
  const { tool } = Route.useLoaderData();
  const fullTool = getTool(tool.slug);
  if (!fullTool) throw notFound();
  const Icon = fullTool.icon;
  const related = tools.filter((t) => t.category === fullTool.category && t.slug !== fullTool.slug).slice(0, 3);
  const isVisual = VISUAL_EDITORS.has(tool.slug);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-10 sm:py-14">
          <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${isVisual ? "max-w-6xl" : "max-w-4xl"}`}>
            <Link to="/tools" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="h-4 w-4" /> All tools
            </Link>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-10">
              <div className="inline-flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-emerald shadow-elevated mb-4 sm:mb-5">
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" strokeWidth={2} />
              </div>
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                {tool.name}
                {tool.pro && (
                  <span className="ml-2 sm:ml-3 inline-flex items-center gap-1 rounded-full bg-gradient-gold px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-emerald-deep align-middle shadow-gold">
                    <Sparkles className="h-3 w-3" /> PRO
                  </span>
                )}
              </h1>
              <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto px-2">{tool.description}</p>
            </motion.div>

            <ClientOnly>
              <Suspense fallback={<DropzoneFallback />}>
                {isVisual ? (
                  <VisualEditorFlow slug={tool.slug} />
                ) : (
                  <UploadDropzone toolName={tool.name.toLowerCase()} toolSlug={tool.slug} />
                )}
              </Suspense>
            </ClientOnly>
          </div>
        </section>

        {related.length > 0 && (
          <section className="py-12 border-t border-border/60 bg-card/40">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="font-display text-2xl font-bold mb-6">Related tools</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((t, i) => <ToolCard key={t.slug} tool={t} index={i} />)}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

// Generic file picker → launches the right visual editor
function VisualEditorFlow({ slug }: { slug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (f.type === "application/pdf" || f.name.endsWith(".pdf")) setFile(f);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  if (file) {
    const labels: Record<string, string> = {
      "edit-pdf": "Editing",
      "crop-pdf": "Cropping",
      "rotate-pdf": "Rotating",
    };
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium truncate max-w-[200px] sm:max-w-none">{labels[slug] || "Processing"}: {file.name}</span>
            <span className="text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
          <button onClick={() => setFile(null)} className="text-xs text-muted-foreground hover:text-foreground underline">Change file</button>
        </div>
        <Suspense fallback={<DropzoneFallback />}>
          {slug === "edit-pdf" && <PdfEditor file={file} />}
          {slug === "crop-pdf" && <CropEditor file={file} />}
          {slug === "rotate-pdf" && <RotateEditor file={file} />}
        </Suspense>
      </div>
    );
  }

  const descriptions: Record<string, string> = {
    "edit-pdf": "Add text, images, and annotations",
    "crop-pdf": "Select area to crop from your pages",
    "rotate-pdf": "Rotate pages to any angle",
  };

  return (
    <motion.div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      animate={{ scale: drag ? 1.01 : 1 }}
      className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-6 sm:p-10 md:p-14 text-center transition-all ${
        drag ? "border-primary bg-primary/5" : "border-border bg-card/60 hover:border-primary/40 hover:bg-card"
      }`}
    >
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <motion.div animate={{ y: drag ? -6 : 0 }} className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-emerald shadow-elevated">
          <UploadCloud className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" strokeWidth={2} />
        </motion.div>
        <div>
          <h3 className="font-display text-lg sm:text-xl font-semibold">Drop your PDF here</h3>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{descriptions[slug] || "Upload to get started"}</p>
        </div>
        <label>
          <input type="file" className="hidden" accept="application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <span className="inline-flex h-10 sm:h-11 cursor-pointer items-center justify-center rounded-xl bg-gradient-emerald px-5 sm:px-6 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition">
            Select PDF
          </span>
        </label>
      </div>
    </motion.div>
  );
}

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <DropzoneFallback />;
  return <>{children}</>;
}

function DropzoneFallback() {
  return (
    <div className="flex items-center justify-center rounded-3xl border-2 border-dashed border-border bg-card/60 p-8 sm:p-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
