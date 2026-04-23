import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — PDF Master" },
      { name: "description", content: "Simple, transparent pricing. Free forever or unlock everything with Pro." },
      { property: "og:title", content: "Pricing — PDF Master" },
      { property: "og:description", content: "Free forever or unlock everything with Pro." },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Free",
    price: "$0",
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
    price: "$8",
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
      "AI summarize, chat & translate",
      "No watermarks",
      "Priority support",
    ],
  },
  {
    name: "Team",
    price: "$24",
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
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-sm font-semibold text-accent uppercase tracking-wider">Pricing</p>
              <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold">
                Simple, <span className="text-gradient-emerald">transparent</span> pricing
              </h1>
              <p className="mt-4 text-muted-foreground">
                Start free. Upgrade when you need more. Cancel anytime.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {plans.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative rounded-3xl border p-8 shadow-soft flex flex-col ${
                    p.featured
                      ? "bg-gradient-emerald text-primary-foreground border-transparent shadow-elevated scale-105"
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
                    <span className="font-display text-5xl font-bold">{p.price}</span>
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
                  <Link to={p.href} className="mt-8">
                    <Button
                      className={`w-full ${
                        p.featured
                          ? "bg-gradient-gold text-emerald-deep hover:opacity-95 shadow-gold font-semibold"
                          : "bg-gradient-emerald text-primary-foreground hover:opacity-90"
                      }`}
                      size="lg"
                    >
                      {p.cta}
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
