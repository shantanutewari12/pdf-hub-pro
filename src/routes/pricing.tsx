import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles, Zap, Brain, PartyPopper, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — PDF Master" },
      { name: "description", content: "Simple, transparent pricing in INR. Free forever or unlock everything with Pro." },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "Perfect for getting things done occasionally.",
    cta: "Start free",
    href: "/auth/register" as const,
    features: [
      "All 28+ tools",
      "Files up to 100 MB",
      "5 tasks per day",
      "Watermarked exports for some tools",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "₹50",
    period: "/ month",
    desc: "For professionals who work with PDFs daily.",
    cta: "Upgrade to Pro",
    href: "/auth/register" as const,
    featured: true,
    features: [
      "Everything in Free",
      "Files up to 5 GB",
      "Unlimited tasks",
      "Batch processing (50 files)",
      "🤖 AI summarize, chat & translate",
      "No watermarks",
      "Priority support",
    ],
  },
  {
    name: "Team",
    price: "₹250",
    period: "/ user / month",
    desc: "For teams that share documents.",
    cta: "Contact sales",
    href: "/contact" as const,
    features: [
      "Everything in Pro",
      "Shared workspace & history",
      "Admin controls & SSO",
      "Audit logs",
      "Dedicated success manager",
    ],
  },
];

function PricingPage() {
  const [showFreeModal, setShowFreeModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-sm font-semibold text-accent uppercase tracking-wider">Pricing</p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-bold">
                Simple, <span className="text-gradient-emerald">transparent</span> pricing
              </h1>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground">
                Start free. Upgrade when you need more. Cancel anytime.
              </p>
            </div>

            {/* AI banner */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-10 max-w-lg mx-auto rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border border-primary/20 p-4 flex items-center gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-emerald shadow-soft">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI-Powered Tools Included in Pro</p>
                <p className="text-xs text-muted-foreground">Summarize, translate, chat with any PDF using AI</p>
              </div>
            </motion.div>

            <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto">
              {plans.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative rounded-3xl border p-6 sm:p-8 shadow-soft flex flex-col ${
                    p.featured
                      ? "bg-gradient-emerald text-primary-foreground border-transparent shadow-elevated md:scale-105"
                      : "bg-card border-border"
                  }`}
                >
                  {p.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-gold px-3 py-1 text-xs font-bold text-emerald-deep shadow-gold">
                      <Sparkles className="h-3 w-3" /> Most popular
                    </div>
                  )}
                  <h3 className="font-display text-2xl font-bold">{p.name}</h3>
                  <p className={`mt-1 text-sm ${p.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{p.desc}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-display text-4xl sm:text-5xl font-bold">{p.price}</span>
                    <span className={`text-sm ${p.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{p.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className={`h-4 w-4 mt-0.5 shrink-0 ${p.featured ? "text-accent" : "text-primary"}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {p.name === "Free" ? (
                    <Link to={p.href} className="mt-8 block w-full">
                      <Button className="w-full bg-gradient-emerald text-primary-foreground hover:opacity-90" size="lg">
                        {p.cta}
                      </Button>
                    </Link>
                  ) : (
                    <div className="mt-8 w-full">
                      <Button
                        onClick={() => setShowFreeModal(true)}
                        className={`w-full ${
                          p.featured
                            ? "bg-gradient-gold text-emerald-deep hover:opacity-95 shadow-gold font-semibold"
                            : "bg-gradient-emerald text-primary-foreground hover:opacity-90"
                        }`}
                        size="lg"
                      >
                        {p.cta}
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Free Animation Modal */}
      <AnimatePresence>
        {showFreeModal && <FreeAnimationModal onClose={() => setShowFreeModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

function FreeAnimationModal({ onClose }: { onClose: () => void }) {
  const [particles] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 2,
      color: ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"][i % 6],
      size: 4 + Math.random() * 8,
    }))
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        className="relative w-full max-w-md overflow-hidden text-center bg-card rounded-3xl p-8 sm:p-12 shadow-elevated border border-primary/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: -20, x: `${p.x}%` }}
            animate={{ opacity: 0, y: 400, rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
            transition={{ delay: p.delay, duration: p.duration, ease: "easeOut" }}
            className="absolute top-0 rounded-sm pointer-events-none z-10"
            style={{ left: `${p.x}%`, width: p.size, height: p.size, backgroundColor: p.color }}
          />
        ))}

        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground transition z-30">
          <X className="h-5 w-5" />
        </button>

        <div className="relative mx-auto w-24 h-24 mb-6 z-20">
          <motion.div className="absolute inset-0 rounded-full bg-primary/20" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} />
          <motion.div className="absolute inset-0 rounded-full bg-primary/10" animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }} transition={{ repeat: Infinity, duration: 2, delay: 0.3 }} />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2, stiffness: 200 }} className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
            <PartyPopper className="h-12 w-12 text-emerald-deep" strokeWidth={2} />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="z-20 relative">
          <h3 className="font-display text-3xl sm:text-4xl font-bold text-gradient-emerald mb-4 uppercase tracking-wide">
            Chill!
          </h3>
          <p className="text-foreground text-lg sm:text-xl font-medium mb-3">
            Abhi ke lie sab <span className="font-bold text-primary px-1">FREE</span> hain!
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Abhi chlaao bindaass free. No credit card, no subscription needed right now. Enjoy all pro features on the house! 🎉
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 z-20 relative">
          <Button onClick={onClose} size="lg" className="w-full bg-gradient-emerald text-primary-foreground hover:opacity-90 shadow-soft">
            Awesome, thanks!
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
