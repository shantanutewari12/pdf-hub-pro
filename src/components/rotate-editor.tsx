import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Lock, RotateCw, RotateCcw, FlipHorizontal2, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type PageState = { pageNum: number; canvasDataUrl: string; width: number; height: number; rotation: number; };

export function RotateEditor({ file }: { file: File }) {
  const [pages, setPages] = useState<PageState[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const pdfjs = await import("pdfjs-dist");
        try { const w = await import("pdfjs-dist/build/pdf.worker.min.mjs?url"); pdfjs.GlobalWorkerOptions.workerSrc = (w as { default: string }).default; }
        catch { pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`; }
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const ps: PageState[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas"); canvas.width = vp.width; canvas.height = vp.height;
          await page.render({ canvasContext: canvas.getContext("2d")!, canvas, viewport: vp }).promise;
          ps.push({ pageNum: i, canvasDataUrl: canvas.toDataURL("image/jpeg", 0.9), width: vp.width, height: vp.height, rotation: 0 });
        }
        if (!cancelled) { setPages(ps); setLoading(false); }
      } catch (err) { if (!cancelled) { toast.error("Failed to load PDF"); setLoading(false); } }
    })();
    return () => { cancelled = true; };
  }, [file]);

  const rotateCurrentPage = (deg: number) => {
    setPages((prev) => prev.map((p, i) => i === currentPage ? { ...p, rotation: (p.rotation + deg + 360) % 360 } : p));
  };
  const rotateAllPages = (deg: number) => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + deg + 360) % 360 })));
  };

  const handleDownload = async () => {
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer());
      for (let i = 0; i < pages.length; i++) {
        const page = src.getPage(i);
        if (pages[i].rotation !== 0) {
          page.setRotation(degrees(pages[i].rotation));
        }
      }
      const bytes = await src.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "-rotated.pdf";
      a.click(); URL.revokeObjectURL(url);
      toast.success("Rotated PDF downloaded!");
    } catch (err) { toast.error("Download failed"); }
  };

  if (loading) return <div className="flex items-center justify-center p-16 gap-3"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /><span className="text-muted-foreground">Loading…</span></div>;
  if (!pages.length) return <p className="text-center text-muted-foreground p-8">No pages.</p>;

  const pg = pages[currentPage];

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-background flex flex-col" : "space-y-3"}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 sm:px-4 py-2 shadow-soft shrink-0">
        <Button size="sm" variant="outline" onClick={() => rotateCurrentPage(-90)}><RotateCcw className="h-4 w-4 mr-1" /> -90°</Button>
        <Button size="sm" variant="outline" onClick={() => rotateCurrentPage(90)}><RotateCw className="h-4 w-4 mr-1" /> +90°</Button>
        <Button size="sm" variant="outline" onClick={() => rotateCurrentPage(180)}><FlipHorizontal2 className="h-4 w-4 mr-1" /> 180°</Button>
        <div className="h-5 w-px bg-border mx-0.5 hidden sm:block" />
        <Button size="sm" variant="ghost" onClick={() => rotateAllPages(90)} className="text-xs">All +90°</Button>
        <div className="flex-1" />
        {pages.length > 1 && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}>←</Button>
            <span className="text-xs">{currentPage + 1}/{pages.length}</span>
            <Button size="sm" variant="ghost" disabled={currentPage === pages.length - 1} onClick={() => setCurrentPage((p) => p + 1)}>→</Button>
          </div>
        )}
        <Button size="sm" variant="ghost" onClick={() => setFullscreen(!fullscreen)}>
          {fullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button size="sm" onClick={handleDownload} className="bg-gradient-emerald text-primary-foreground hover:opacity-90">
          <Download className="h-4 w-4 mr-1" /> Save
        </Button>
      </div>

      <div className="flex-1 overflow-auto bg-neutral-800/50 flex items-center justify-center p-4">
        <div className="bg-white shadow-2xl rounded overflow-hidden" style={{ transition: "transform 0.3s", transform: `rotate(${pg.rotation}deg)` }}>
          <img src={pg.canvasDataUrl} alt={`Page ${currentPage + 1}`} className="block max-h-[65vh] object-contain" draggable={false} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-1.5 shrink-0 bg-card border-t border-border">
        <Lock className="h-3 w-3" /> Current: {pg.rotation}° rotation
      </div>
    </div>
  );
}
