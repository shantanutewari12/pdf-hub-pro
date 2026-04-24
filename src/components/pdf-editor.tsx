import { useCallback, useEffect, useRef, useState } from "react";
import { Type, ImagePlus, Trash2, Download, ZoomIn, ZoomOut, Lock, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type TextAnnotation = {
  id: string; type: "text";
  x: number; y: number;
  text: string; fontSize: number; color: string; editing: boolean;
};
type ImageAnnotation = {
  id: string; type: "image";
  x: number; y: number; width: number; height: number; dataUrl: string;
};
type Annotation = TextAnnotation | ImageAnnotation;
type PageState = {
  pageNum: number; canvasDataUrl: string;
  width: number; height: number; annotations: Annotation[];
};

export function PdfEditor({ file }: { file: File }) {
  const [pages, setPages] = useState<PageState[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tool, setTool] = useState<"select" | "text">("select");
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(true); // default fullscreen
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0, annX: 0, annY: 0 });

  // Resize state
  const [resizingId, setResizingId] = useState<string | null>(null);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const pdfjs = await import("pdfjs-dist");
        try {
          const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
          pdfjs.GlobalWorkerOptions.workerSrc = (worker as { default: string }).default;
        } catch {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        }
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const ps: PageState[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width; canvas.height = vp.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, canvas, viewport: vp }).promise;
          ps.push({ pageNum: i, canvasDataUrl: canvas.toDataURL("image/png"), width: vp.width, height: vp.height, annotations: [] });
        }
        if (!cancelled) { setPages(ps); setLoading(false); }
      } catch (err) {
        if (!cancelled) { toast.error("Failed to load PDF", { description: err instanceof Error ? err.message : "" }); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  useEffect(() => {
    if (!pages.length || !canvasRef.current) return;
    const pg = pages[currentPage]; if (!pg) return;
    const c = canvasRef.current;
    c.width = pg.width * zoom; c.height = pg.height * zoom;
    const ctx = c.getContext("2d")!;
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height);
    img.src = pg.canvasDataUrl;
  }, [pages, currentPage, zoom]);

  const updatePage = (fn: (p: PageState) => PageState) =>
    setPages((prev) => prev.map((p, i) => i === currentPage ? fn(p) : p));

  const addAnnotation = (a: Annotation) => updatePage((p) => ({ ...p, annotations: [...p.annotations, a] }));
  const updateAnnotation = (id: string, u: Partial<Annotation>) =>
    updatePage((p) => ({ ...p, annotations: p.annotations.map((a) => a.id === id ? { ...a, ...u } as Annotation : a) }));
  const removeAnnotation = (id: string) => updatePage((p) => ({ ...p, annotations: p.annotations.filter((a) => a.id !== id) }));

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== "text" || draggingId) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    addAnnotation({ id: crypto.randomUUID(), type: "text", x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom, text: "", fontSize: 16, color: "#000000", editing: true });
    setTool("select");
  }, [tool, zoom, currentPage, draggingId]);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = () => {
      const f = input.files?.[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxW = 300, scale = img.width > maxW ? maxW / img.width : 1;
          addAnnotation({ id: crypto.randomUUID(), type: "image", x: 50, y: 50, width: img.width * scale, height: img.height * scale, dataUrl: reader.result as string });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(f);
    };
    input.click();
  }, [currentPage]);

  // Drag handlers
  const startDrag = (e: React.MouseEvent | React.TouchEvent, ann: Annotation) => {
    if (tool === "text") return;
    e.preventDefault(); e.stopPropagation();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX, y: clientY, annX: ann.x, annY: ann.y };
    setDraggingId(ann.id);
  };

  useEffect(() => {
    if (!draggingId) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const dx = (clientX - dragStart.current.x) / zoom;
      const dy = (clientY - dragStart.current.y) / zoom;
      updateAnnotation(draggingId, { x: dragStart.current.annX + dx, y: dragStart.current.annY + dy });
    };
    const onUp = () => setDraggingId(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onUp); };
  }, [draggingId, zoom]);

  // Resize handlers
  const startResize = (e: React.MouseEvent | React.TouchEvent, ann: ImageAnnotation) => {
    e.preventDefault(); e.stopPropagation();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    resizeStart.current = { x: clientX, y: clientY, w: ann.width, h: ann.height };
    setResizingId(ann.id);
  };

  useEffect(() => {
    if (!resizingId) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const dx = (clientX - resizeStart.current.x) / zoom;
      const dy = (clientY - resizeStart.current.y) / zoom;
      const aspect = resizeStart.current.w / resizeStart.current.h;
      const newW = Math.max(30, resizeStart.current.w + dx);
      updateAnnotation(resizingId, { width: newW, height: newW / aspect });
    };
    const onUp = () => setResizingId(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onUp); };
  }, [resizingId, zoom]);

  const handleDownload = async () => {
    try {
      const { PDFDocument } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer());
      for (let i = 0; i < pages.length; i++) {
        const page = src.getPage(i);
        const { height } = page.getSize();
        const sx = page.getSize().width / pages[i].width;
        const sy = height / pages[i].height;
        for (const ann of pages[i].annotations) {
          if (ann.type === "text") {
            const { StandardFonts, rgb } = await import("pdf-lib");
            const font = await src.embedFont(StandardFonts.Helvetica);
            const hex = ann.color;
            const cr = parseInt(hex.slice(1, 3), 16) / 255;
            const cg = parseInt(hex.slice(3, 5), 16) / 255;
            const cb = parseInt(hex.slice(5, 7), 16) / 255;
            page.drawText(ann.text, { x: ann.x * sx, y: height - ann.y * sy - ann.fontSize * sy, size: ann.fontSize * sy, font, color: rgb(cr, cg, cb) });
          } else if (ann.type === "image") {
            const imgBytes = await fetch(ann.dataUrl).then((r) => r.arrayBuffer());
            const emb = ann.dataUrl.includes("png")
              ? await src.embedPng(new Uint8Array(imgBytes))
              : await src.embedJpg(new Uint8Array(imgBytes));
            page.drawImage(emb, { x: ann.x * sx, y: height - ann.y * sy - ann.height * sy, width: ann.width * sx, height: ann.height * sy });
          }
        }
      }
      const bytes = await src.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "-edited.pdf";
      a.click(); URL.revokeObjectURL(url);
      toast.success("Edited PDF downloaded!");
    } catch (err) {
      toast.error("Download failed", { description: err instanceof Error ? err.message : "" });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-16 gap-3">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      <span className="text-muted-foreground">Loading PDF…</span>
    </div>
  );
  if (!pages.length) return <p className="text-center text-muted-foreground p-8">No pages found.</p>;

  const pg = pages[currentPage];
  const wrapperClass = fullscreen
    ? "fixed inset-0 z-50 bg-background flex flex-col"
    : "space-y-3";

  return (
    <div className={wrapperClass}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 border-b border-border bg-card px-2 sm:px-4 py-2 shadow-soft shrink-0">
        <Button size="sm" variant={tool === "text" ? "default" : "outline"} onClick={() => setTool(tool === "text" ? "select" : "text")}
          className={tool === "text" ? "bg-gradient-emerald text-primary-foreground" : ""}>
          <Type className="h-4 w-4 mr-1" /> Text
        </Button>
        <Button size="sm" variant="outline" onClick={handleImageUpload}>
          <ImagePlus className="h-4 w-4 mr-1" /> Image
        </Button>

        <div className="h-5 w-px bg-border mx-0.5 hidden sm:block" />

        <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}><ZoomOut className="h-4 w-4" /></Button>
        <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
        <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.min(3, z + 0.15))}><ZoomIn className="h-4 w-4" /></Button>

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

      {tool === "text" && (
        <div className="text-xs text-center text-muted-foreground bg-primary/5 py-1.5 px-3 shrink-0">
          👆 Click on the page to place text
        </div>
      )}

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-neutral-800/50 flex items-start justify-center p-4" style={fullscreen ? {} : { maxHeight: "70vh" }}>
        <div className="relative inline-block shadow-2xl" style={{ width: pg.width * zoom, height: pg.height * zoom }}>
          <canvas ref={canvasRef} onClick={handleCanvasClick} className={`block ${tool === "text" ? "cursor-crosshair" : "cursor-default"}`} />

          {pg.annotations.map((ann) => {
            if (ann.type === "text") {
              return (
                <div key={ann.id} className="absolute group"
                  style={{ left: ann.x * zoom, top: ann.y * zoom, transform: `scale(${zoom})`, transformOrigin: "top left" }}
                  onMouseDown={(e) => !ann.editing && startDrag(e, ann)}
                  onTouchStart={(e) => !ann.editing && startDrag(e, ann)}
                >
                  {ann.editing ? (
                    <div className="flex flex-col gap-1 bg-card border border-primary rounded-lg p-2 shadow-xl" style={{ minWidth: 180 }}>
                      <textarea autoFocus defaultValue={ann.text} placeholder="Type here..."
                        className="text-sm bg-transparent border-none outline-none resize-none min-h-[36px]"
                        style={{ fontSize: ann.fontSize, color: ann.color }}
                        onBlur={(e) => { const v = e.target.value.trim(); if (!v) { removeAnnotation(ann.id); return; } updateAnnotation(ann.id, { text: v, editing: false }); }}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
                      />
                      <div className="flex items-center gap-2">
                        <input type="color" value={ann.color} onChange={(e) => updateAnnotation(ann.id, { color: e.target.value })} className="h-5 w-5 cursor-pointer rounded border-0" />
                        <select value={ann.fontSize} onChange={(e) => updateAnnotation(ann.id, { fontSize: Number(e.target.value) })} className="text-xs bg-muted rounded px-1">
                          {[10, 12, 14, 16, 20, 24, 28, 36, 48].map((s) => <option key={s} value={s}>{s}px</option>)}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className={`px-1 rounded cursor-move select-none ${draggingId === ann.id ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/50"}`}
                      style={{ fontSize: ann.fontSize, color: ann.color, whiteSpace: "pre-wrap" }}
                      onDoubleClick={() => updateAnnotation(ann.id, { editing: true })}
                    >
                      {ann.text}
                      <button onClick={(e) => { e.stopPropagation(); removeAnnotation(ann.id); }}
                        className="absolute -top-2 -right-2 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            }
            if (ann.type === "image") {
              return (
                <div key={ann.id} className={`absolute group cursor-move ${draggingId === ann.id ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/40"}`}
                  style={{ left: ann.x * zoom, top: ann.y * zoom, width: ann.width * zoom, height: ann.height * zoom }}
                  onMouseDown={(e) => startDrag(e, ann)}
                  onTouchStart={(e) => startDrag(e, ann)}
                >
                  <img src={ann.dataUrl} alt="" className="w-full h-full object-contain pointer-events-none rounded" draggable={false} />
                  {/* Resize handle */}
                  <div className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize bg-primary/80 rounded-tl-md"
                    onMouseDown={(e) => startResize(e, ann as ImageAnnotation)}
                    onTouchStart={(e) => startResize(e, ann as ImageAnnotation)}
                  >
                    <svg viewBox="0 0 10 10" className="w-3 h-3 m-1 text-white"><path d="M0 10L10 0M4 10L10 4M8 10L10 8" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeAnnotation(ann.id); }}
                    className="absolute -top-2 -right-2 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-1.5 shrink-0 bg-card border-t border-border">
        <Lock className="h-3 w-3" /> All editing happens in your browser
      </div>
    </div>
  );
}
