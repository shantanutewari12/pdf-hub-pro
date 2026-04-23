import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToolCard } from "@/components/tool-card";
import { getTool, tools } from "@/lib/tools";

const UploadDropzone = lazy(() =>
  import("@/components/upload-dropzone").then((m) => ({ default: m.UploadDropzone }))
);

export const Route = createFileRoute("/tools/$slug")({
  loader: ({ params }) => {
    const tool = getTool(params.slug);
    if (!tool) throw notFound();
    return {
      tool: {
        slug: tool.slug,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        pro: tool.pro ?? false,
      },
    };
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
            <p className="mt-3 text-muted-foreground">{error.message || "Something went wrong while loading this tool."}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  router.invalidate();
                  reset();
                }}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-emerald px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition"
              >
                Try again
              </button>
              <Link to="/tools" className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-card">
                Back to tools
              </Link>
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-10 sm:py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Link to="/tools" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="h-4 w-4" /> All tools
            </Link>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-emerald shadow-elevated mb-5">
                <Icon className="h-8 w-8 text-primary-foreground" strokeWidth={2} />
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
                {tool.name}
                {tool.pro && (
                  <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-gradient-gold px-2.5 py-1 text-xs font-semibold text-emerald-deep align-middle shadow-gold">
                    <Sparkles className="h-3 w-3" /> PRO
                  </span>
                )}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">{tool.description}</p>
            </motion.div>

            <ClientOnly>
              <Suspense fallback={<DropzoneFallback />}>
                <UploadDropzone toolName={tool.name.toLowerCase()} toolSlug={tool.slug} />
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

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <DropzoneFallback />;
  return <>{children}</>;
}

function DropzoneFallback() {
  return (
    <div className="flex items-center justify-center rounded-3xl border-2 border-dashed border-border bg-card/60 p-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
