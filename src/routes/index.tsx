import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Sparkles, Shield, Zap, FileCheck, Star, ChevronDown,
  UploadCloud, Brain, X,
} from "lucide-react";
import { useState, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToolCard } from "@/components/tool-card";
import { popularTools, tools } from "@/lib/tools";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PDF Master — The premium PDF toolkit" },
      { name: "description", content: "28+ premium PDF tools: convert, merge, split, compress, sign, OCR, AI summarize. Beautifully simple, secure by design." },
      { property: "og:title", content: "PDF Master — The premium PDF toolkit" },
      { property: "og:description", content: "28+ premium PDF tools, beautifully simple and secure by design." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Stats />
        <PopularTools />
        <Features />
        <HowItWorks />
        <Testimonials />
        <AiShowcase />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");

  const handleFiles = useCallback((list: FileList | null) => {
    if (!list || !list.length) return;
    setUploadedFiles(Array.from(list));
    setPickerOpen(true);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const filteredTools = tools.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="relative overflow-hidden grain">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-24 pb-10 sm:pb-12">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 sm:px-4 py-1.5 text-xs font-medium shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>New: AI summarize, translate & chat with any PDF</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-5 sm:mt-6 font-display text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
            Every PDF tool you need.<br />
            <span className="text-gradient-emerald">Beautifully simple.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-4 sm:mt-6 text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Convert, merge, split, compress, edit, sign, and unlock PDFs with a toolkit that feels effortless.
            Encrypted in transit. Files auto-delete after processing.
          </motion.p>
        </div>

        {/* Smart Upload Area */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-8 sm:mt-12 max-w-3xl mx-auto">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-6 sm:p-10 md:p-14 text-center transition-all ${
              dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border bg-card/60 hover:border-primary/40 hover:bg-card"
            }`}>
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <motion.div animate={{ y: dragOver ? -6 : 0 }}
                className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-emerald shadow-elevated">
                <UploadCloud className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" strokeWidth={2} />
              </motion.div>
              <div>
                <h3 className="font-display text-lg sm:text-xl font-semibold">Drop any file here</h3>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Upload a file and choose what you want to do</p>
              </div>
              <label>
                <input type="file" className="hidden" multiple onChange={(e) => handleFiles(e.target.files)} />
                <span className="inline-flex h-10 sm:h-11 cursor-pointer items-center justify-center rounded-xl bg-gradient-emerald px-5 sm:px-6 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition">
                  Select files
                </span>
              </label>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tool Picker Popup */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPickerOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card border border-border rounded-3xl shadow-elevated w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-display text-lg sm:text-xl font-bold">What do you want to do?</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">File: {uploadedFiles[0]?.name}</p>
                </div>
                <button onClick={() => setPickerOpen(false)} className="p-2 rounded-xl hover:bg-muted transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-4 sm:px-6 py-3 border-b border-border">
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tools..."
                  className="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredTools.map((t) => {
                    const Icon = t.icon;
                    const isAI = t.category === "ai";
                    return (
                      <button key={t.slug} onClick={() => { setPickerOpen(false); navigate({ to: "/tools/$slug", params: { slug: t.slug } }); }}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition hover:bg-primary/5 hover:border-primary/30 ${
                          isAI ? "border-primary/20 bg-primary/5" : "border-border"
                        }`}>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isAI ? "bg-gradient-to-br from-primary via-emerald-500 to-teal-500" : "bg-primary/10"
                        }`}>
                          <Icon className={`h-4 w-4 ${isAI ? "text-primary-foreground" : "text-primary"}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate flex items-center gap-1">
                            {t.name}
                            {isAI && <Sparkles className="h-3 w-3 text-gold" />}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
    </section>
  );
}

function Stats() {
  const stats = [
    { v: "28+", l: "Premium tools" },
    { v: "12M+", l: "Files processed" },
    { v: "256-bit", l: "Encryption" },
    { v: "4.9/5", l: "User rating" },
  ];
  return (
    <section className="border-y border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="text-center"
            >
              <div className="font-display text-3xl sm:text-4xl font-bold text-gradient-emerald">{s.v}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularTools() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="text-sm font-semibold text-accent uppercase tracking-wider">Most loved</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">Popular tools</h2>
          </div>
          <Link to="/tools" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2 transition-all">
            Explore all {tools.length} tools <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularTools.map((t, i) => <ToolCard key={t.slug} tool={t} index={i} />)}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: Zap, title: "Lightning fast", desc: "Optimized engine processes most documents in under 5 seconds." },
    { icon: Shield, title: "Secure by design", desc: "256-bit encryption. Files auto-delete after 30 minutes." },
    { icon: Sparkles, title: "AI-powered", desc: "Summarize, translate, and chat with any document instantly." },
    { icon: FileCheck, title: "Pixel-perfect", desc: "Advanced rendering preserves layout, fonts, and formatting." },
  ];
  return (
    <section className="py-20 bg-card/40 border-y border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider">Why PDF Master</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">Built for professionals</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-elevated transition"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-emerald shadow-soft mb-4">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Upload", d: "Drag & drop your file or pick from your device. We support files up to 100 MB on the free plan." },
    { n: "02", t: "Process", d: "Pick any of 28+ tools. Watch real-time progress as we work our magic securely." },
    { n: "03", t: "Download", d: "Get your perfect file in seconds. Files auto-delete after 30 minutes for your privacy." },
  ];
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider">How it works</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">Three simple steps</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative rounded-2xl border border-border bg-card p-8 shadow-soft"
            >
              <div className="font-display text-5xl font-bold text-gradient-gold opacity-90">{s.n}</div>
              <h3 className="mt-3 font-display text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { q: "Replaced three different tools we were paying for. The interface is just chef's kiss.", a: "Sarah K.", r: "Operations Lead" },
    { q: "AI summarize alone is worth the subscription. We process 200+ contracts a week.", a: "Marcus T.", r: "Legal Counsel" },
    { q: "Beautifully designed, blazingly fast. Feels like the Linear of PDF tools.", a: "Priya N.", r: "Product Designer" },
  ];
  return (
    <section className="py-20 bg-card/40 border-y border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider">Loved by teams</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">What people say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((it, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft flex flex-col"
            >
              <div className="flex gap-0.5 text-accent mb-3">
                {Array.from({ length: 5 }).map((_, x) => <Star key={x} className="h-4 w-4 fill-current" />)}
              </div>
              <blockquote className="text-foreground leading-relaxed flex-1">"{it.q}"</blockquote>
              <figcaption className="mt-4 pt-4 border-t border-border">
                <div className="font-semibold text-sm">{it.a}</div>
                <div className="text-xs text-muted-foreground">{it.r}</div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "Is PDF Master really free?", a: "Yes. The free plan includes all 28+ tools with sensible daily limits. Upgrade to Pro for unlimited use, larger files, batch processing, and AI features." },
    { q: "Are my files secure?", a: "Absolutely. Files are encrypted in transit with 256-bit SSL and automatically deleted after 30 minutes of processing. We never look at your documents." },
    { q: "What's the maximum file size?", a: "Free plan: 100 MB per file. Pro plan: 5 GB per file with batch uploads of up to 50 files at once." },
    { q: "Do you support Word, Excel, PowerPoint?", a: "Yes — convert to and from all Microsoft Office formats, plus images, HTML, and more." },
    { q: "Can I cancel anytime?", a: "Of course. Cancel with one click from your dashboard. No questions asked." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider">FAQ</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">Questions, answered</h2>
        </div>
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-display font-semibold">{it.q}</span>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed"
                >
                  {it.a}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiShowcase() {
  const aiTools = tools.filter((t) => t.category === "ai");
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-3">
            <Brain className="h-3.5 w-3.5" /> AI-POWERED
          </div>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold">
            Smart tools powered by <span className="text-gradient-emerald">AI</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Summarize documents, translate to any language, and chat with your PDFs — all in seconds
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {aiTools.map((t, i) => (
            <motion.div key={t.slug} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Link to="/tools/$slug" params={{ slug: t.slug }}
                className="block rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-5 sm:p-6 shadow-soft hover:shadow-elevated hover:border-primary/40 transition group">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-emerald-500 to-teal-500 shadow-soft mb-4 group-hover:scale-110 transition-transform">
                  <t.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold flex items-center gap-1.5">
                  {t.name} <Sparkles className="h-3.5 w-3.5 text-gold" />
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-emerald p-8 sm:p-12 md:p-16 text-center shadow-elevated">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-primary-foreground">
              Ready to work with PDFs the right way?
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-primary-foreground/80 max-w-xl mx-auto">
              Join 12 million professionals who trust PDF Master for their document workflow.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth/register">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-gold text-emerald-deep hover:opacity-95 shadow-gold font-semibold">
                  Start free <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link to="/tools">
                <Button size="lg" className="w-full sm:w-auto bg-white/15 border-2 border-white text-white hover:bg-white/25 font-semibold">
                  Browse tools
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

