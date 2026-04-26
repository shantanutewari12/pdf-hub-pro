import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ToolCard } from "@/components/tool-card";
import { categories, tools, type ToolCategory } from "@/lib/tools";

export const Route = createFileRoute("/tools/")({
  head: () => ({
    meta: [
      { title: "All Tools — PDF Master" },
      {
        name: "description",
        content:
          "Explore 28+ premium PDF tools: convert, merge, split, edit, OCR, AI summarize and more.",
      },
      { property: "og:title", content: "All Tools — PDF Master" },
      { property: "og:description", content: "28+ premium PDF tools, beautifully organized." },
    ],
  }),
  component: ToolsIndexPage,
});

function ToolsIndexPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ToolCategory | "all">("all");

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      const matchesCat = cat === "all" || t.category === cat;
      const matchesQ =
        !q ||
        t.name.toLowerCase().includes(q.toLowerCase()) ||
        t.description.toLowerCase().includes(q.toLowerCase());
      return matchesCat && matchesQ;
    });
  }, [q, cat]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border/60 bg-card/40 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <p className="text-sm font-semibold text-accent uppercase tracking-wider">
                All tools
              </p>
              <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold">
                Every <span className="text-gradient-emerald">PDF tool</span> in one place
              </h1>
              <p className="mt-4 text-muted-foreground">
                {tools.length} thoughtfully designed tools, organized by what you want to
                accomplish.
              </p>
            </motion.div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search tools…"
                  className="w-full h-11 rounded-xl border border-border bg-card pl-9 pr-4 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <CatPill active={cat === "all"} onClick={() => setCat("all")}>
                All
              </CatPill>
              {(Object.keys(categories) as ToolCategory[]).map((c) => (
                <CatPill key={c} active={cat === c} onClick={() => setCat(c)}>
                  {categories[c].label}
                </CatPill>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                No tools match "{q}". Try a different search.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((t, i) => (
                  <ToolCard key={t.slug} tool={t} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function CatPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-4 rounded-full text-sm font-medium transition-all ${
        active
          ? "bg-gradient-emerald text-primary-foreground shadow-soft"
          : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
      }`}
    >
      {children}
    </button>
  );
}
