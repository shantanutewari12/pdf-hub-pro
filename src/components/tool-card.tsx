import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, Lock, Sparkles } from "lucide-react";
import type { Tool } from "@/lib/tools";

export function ToolCard({ tool, index = 0 }: { tool: Tool; index?: number }) {
  const Icon = tool.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link
        to="/tools/$slug"
        params={{ slug: tool.slug }}
        className="group relative block h-full rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated hover:border-primary/30"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary transition-all group-hover:bg-gradient-emerald group-hover:text-primary-foreground group-hover:shadow-soft">
            <Icon className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div className="flex items-center gap-1.5">
            {tool.pro && (
              <span className="flex items-center gap-1 rounded-full bg-gradient-gold px-2 py-0.5 text-[10px] font-semibold text-emerald-deep shadow-gold">
                <Sparkles className="h-2.5 w-2.5" /> PRO
              </span>
            )}
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
        <h3 className="font-display font-semibold text-base text-foreground mb-1.5">
          {tool.name}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {tool.description}
        </p>
      </Link>
    </motion.div>
  );
}

export function LockedHint() {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Lock className="h-3 w-3" /> End-to-end encrypted
    </div>
  );
}
