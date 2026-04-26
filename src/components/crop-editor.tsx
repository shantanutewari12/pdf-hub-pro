import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Lock, Crop, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CropEditor({ file }: { file: File }) {
  const [pages, setPages] = useState<{ dataUrl: string; w: number; h: number }[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Selection rectangle (in image-relative coordinates 0-1)
  const [sel, setSel] = useState({ x1: 0.05, y1: 0.05, x2: 0.95, y2: 0.95 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ mx: 0, my: 0, x1: 0, y1: 0, x2: 0, y2: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const pdfjs = await import("pdfjs-dist");
        try {
          const w = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
          pdfjs.GlobalWorkerOptions.workerSrc = (w as { default: string }).default;
        } catch {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        }
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const ps: { dataUrl: string; w: number; h: number }[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width;
          canvas.height = vp.height;
          await page.render({ canvasContext: canvas.getContext("2d")!, canvas, viewport: vp })
            .promise;
          ps.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.9), w: vp.width, h: vp.height });
        }
        if (!cancelled) {
          setPages(ps);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  // Mouse down on overlay to start selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    dragStartRef.current = { mx, my, x1: mx, y1: my, x2: mx, y2: my };
    setDragging(true);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const my = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const s = dragStartRef.current;
      setSel({
        x1: Math.min(s.mx, mx),
        y1: Math.min(s.my, my),
        x2: Math.max(s.mx, mx),
        y2: Math.max(s.my, my),
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  const handleDownload = async () => {
    try {
      const { PDFDocument } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer());
      for (const page of src.getPages()) {
        const { width, height } = page.getSize();
        const cx = sel.x1 * width;
        const cy = (1 - sel.y2) * height;
        const cw = (sel.x2 - sel.x1) * width;
        const ch = (sel.y2 - sel.y1) * height;
        page.setCropBox(cx, cy, cw, ch);
      }
      const bytes = await src.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "-cropped.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Cropped PDF downloaded!");
    } catch {
      toast.error("Crop failed");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center p-16 gap-3">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        <span className="text-muted-foreground">Loading…</span>
      </div>
    );
  if (!pages.length) return <p className="text-center text-muted-foreground p-8">No pages.</p>;

  const pg = pages[currentPage];
  const selW = `${(sel.x2 - sel.x1) * 100}%`;
  const selH = `${(sel.y2 - sel.y1) * 100}%`;

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-background flex flex-col" : "space-y-3"}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 sm:px-4 py-2 shadow-soft shrink-0">
        <div className="flex items-center gap-1.5 text-sm">
          <Crop className="h-4 w-4 text-primary" />{" "}
          <span className="font-medium">Drag to select crop area</span>
        </div>
        <div className="flex-1" />
        {pages.length > 1 && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ←
            </Button>
            <span className="text-xs">
              {currentPage + 1}/{pages.length}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={currentPage === pages.length - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              →
            </Button>
          </div>
        )}
        <Button size="sm" variant="ghost" onClick={() => setFullscreen(!fullscreen)}>
          {fullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button
          size="sm"
          onClick={handleDownload}
          className="bg-gradient-emerald text-primary-foreground hover:opacity-90"
        >
          <Download className="h-4 w-4 mr-1" /> Crop & Save
        </Button>
      </div>

      <div className="flex-1 overflow-auto bg-neutral-800/50 flex items-center justify-center p-4">
        <div className="relative inline-block shadow-2xl" style={{ maxHeight: "65vh" }}>
          <img
            ref={imgRef}
            src={pg.dataUrl}
            alt=""
            className="block max-h-[65vh] object-contain"
            draggable={false}
          />
          {/* Selection overlay */}
          <div
            ref={overlayRef}
            className="absolute inset-0 cursor-crosshair"
            onMouseDown={handleMouseDown}
          >
            {/* Dark overlay areas */}
            <div
              className="absolute bg-black/50"
              style={{ top: 0, left: 0, right: 0, height: `${sel.y1 * 100}%` }}
            />
            <div
              className="absolute bg-black/50"
              style={{ bottom: 0, left: 0, right: 0, height: `${(1 - sel.y2) * 100}%` }}
            />
            <div
              className="absolute bg-black/50"
              style={{ top: `${sel.y1 * 100}%`, left: 0, width: `${sel.x1 * 100}%`, height: selH }}
            />
            <div
              className="absolute bg-black/50"
              style={{
                top: `${sel.y1 * 100}%`,
                right: 0,
                width: `${(1 - sel.x2) * 100}%`,
                height: selH,
              }}
            />
            {/* Selection border */}
            <div
              className="absolute border-2 border-primary border-dashed"
              style={{
                left: `${sel.x1 * 100}%`,
                top: `${sel.y1 * 100}%`,
                width: selW,
                height: selH,
              }}
            />
            {/* Corner handles */}
            {[
              { l: `${sel.x1 * 100}%`, t: `${sel.y1 * 100}%` },
              { l: `${sel.x2 * 100}%`, t: `${sel.y1 * 100}%` },
              { l: `${sel.x1 * 100}%`, t: `${sel.y2 * 100}%` },
              { l: `${sel.x2 * 100}%`, t: `${sel.y2 * 100}%` },
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-primary rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2"
                style={{ left: pos.l, top: pos.t }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-1.5 shrink-0 bg-card border-t border-border">
        <Lock className="h-3 w-3" /> Crop applies to all pages
      </div>
    </div>
  );
}
