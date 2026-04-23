import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText, Clock, HardDrive, Sparkles, ArrowUpRight, Crown, Loader2,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToolCard } from "@/components/tool-card";
import { useAuth } from "@/lib/auth-context";
import { popularTools } from "@/lib/tools";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PDF Master" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { icon: FileText, label: "Files processed", value: "0" },
    { icon: Clock, label: "Last activity", value: "Just now" },
    { icon: HardDrive, label: "Storage used", value: "0 MB" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold">
              Welcome back 👋
            </h1>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <div className="mt-3 font-display text-2xl font-bold">{s.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Pro upsell */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-emerald p-8 shadow-elevated"
          >
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-gold px-3 py-1 text-xs font-bold text-emerald-deep shadow-gold">
                  <Crown className="h-3 w-3" /> UPGRADE
                </div>
                <h3 className="mt-3 font-display text-2xl font-bold text-primary-foreground">
                  Unlock AI tools and unlimited processing
                </h3>
                <p className="mt-1 text-sm text-primary-foreground/80">
                  Summarize, chat with PDFs, batch process — and remove all limits.
                </p>
              </div>
              <Link to="/pricing">
                <Button size="lg" className="bg-gradient-gold text-emerald-deep hover:opacity-95 shadow-gold font-semibold whitespace-nowrap">
                  See plans <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Quick tools */}
          <div>
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="font-display text-xl font-bold">Quick start</h2>
                <p className="text-sm text-muted-foreground">Your most-used tools</p>
              </div>
              <Link to="/tools" className="text-sm font-semibold text-primary hover:underline">
                All tools →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularTools.map((t, i) => <ToolCard key={t.slug} tool={t} index={i} />)}
            </div>
          </div>

          {/* History empty state */}
          <div>
            <h2 className="font-display text-xl font-bold mb-5">Recent activity</h2>
            <div className="rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="font-display text-lg font-semibold">No activity yet</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                Your processed files will appear here. Pick a tool above to get started.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
