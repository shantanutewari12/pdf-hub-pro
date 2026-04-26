import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  HardDrive,
  Sparkles,
  ArrowUpRight,
  Crown,
  Loader2,
  Brain,
  Trash2,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToolCard } from "@/components/tool-card";
import { useAuth } from "@/lib/auth-context";
import { popularTools } from "@/lib/tools";
import { Button } from "@/components/ui/button";
import { getActivities, clearActivities, type Activity } from "@/lib/activity";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PDF Master" }] }),
  component: DashboardPage,
});

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    setActivities(getActivities());
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { icon: FileText, label: "Files processed", value: String(activities.length) },
    {
      icon: Clock,
      label: "Last activity",
      value: activities.length ? timeAgo(activities[0].timestamp) : "N/A",
    },
    { icon: HardDrive, label: "Storage used", value: "0 MB" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl md:text-4xl font-bold">
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
                className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <div className="mt-3 font-display text-xl sm:text-2xl font-bold">{s.value}</div>
              </motion.div>
            ))}
          </div>

          {/* AI tools banner */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border border-primary/20 p-5 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-emerald shadow-soft shrink-0">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-gold" /> AI-Powered Tools
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Summarize, translate, and chat with any PDF using AI
                </p>
              </div>
              <Link to="/tools">
                <Button className="bg-gradient-emerald text-primary-foreground hover:opacity-90 whitespace-nowrap">
                  Try AI tools <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Pro upsell */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-emerald p-6 sm:p-8 shadow-elevated"
          >
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-gold px-3 py-1 text-xs font-bold text-emerald-deep shadow-gold">
                  <Crown className="h-3 w-3" /> UPGRADE
                </div>
                <h3 className="mt-3 font-display text-xl sm:text-2xl font-bold text-primary-foreground">
                  Unlock AI tools & unlimited processing
                </h3>
                <p className="mt-1 text-sm text-primary-foreground/80">
                  Just ₹50/month — summarize, translate, batch process
                </p>
              </div>
              <Link to="/pricing">
                <Button
                  size="lg"
                  className="bg-gradient-gold text-emerald-deep hover:opacity-95 shadow-gold font-semibold whitespace-nowrap"
                >
                  See plans <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Quick tools */}
          <div>
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold">Quick start</h2>
                <p className="text-sm text-muted-foreground">Your most-used tools</p>
              </div>
              <Link to="/tools" className="text-sm font-semibold text-primary hover:underline">
                All tools →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularTools.map((t, i) => (
                <ToolCard key={t.slug} tool={t} index={i} />
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg sm:text-xl font-bold">Recent activity</h2>
              {activities.length > 0 && (
                <button
                  onClick={() => {
                    clearActivities();
                    setActivities([]);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
            {activities.length > 0 ? (
              <div className="space-y-2">
                {activities.slice(0, 10).map((a) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 shadow-soft hover:bg-card/80 transition"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.filename}</p>
                      <p className="text-xs text-muted-foreground">{a.tool}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(a.timestamp)}
                    </span>
                    <Link to="/tools/$slug" params={{ slug: a.toolSlug }}>
                      <Button size="sm" variant="ghost" className="text-xs">
                        Open →
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-card/40 p-8 sm:p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="font-display text-lg font-semibold">No activity yet</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                  Your processed files will appear here. Pick a tool above to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
