import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  Sparkles,
  Zap,
  Brain,
  PartyPopper,
  X,
  CreditCard,
  Lock,
  ShieldCheck,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { useProStatus } from "@/lib/pro-store";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — PDF Master" },
      {
        name: "description",
        content: "Simple, transparent pricing in INR. Free forever or unlock everything with Pro.",
      },
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { isPro } = useProStatus();

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
                <p className="text-xs text-muted-foreground">
                  Summarize, translate, chat with any PDF using AI
                </p>
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
                  <p
                    className={`mt-1 text-sm ${p.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                  >
                    {p.desc}
                  </p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-display text-4xl sm:text-5xl font-bold">{p.price}</span>
                    <span
                      className={`text-sm ${p.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {p.period}
                    </span>
                  </div>
                  <ul className="mt-6 space-y-3 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check
                          className={`h-4 w-4 mt-0.5 shrink-0 ${p.featured ? "text-accent" : "text-primary"}`}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {p.name === "Free" ? (
                    <Link to={p.href} className="mt-8 block w-full">
                      <Button
                        className="w-full bg-gradient-emerald text-primary-foreground hover:opacity-90"
                        size="lg"
                      >
                        {p.cta}
                      </Button>
                    </Link>
                  ) : p.name === "Pro" ? (
                    <div className="mt-8 w-full">
                      <Button
                        onClick={() => setShowPaymentModal(true)}
                        disabled={isPro}
                        className={`w-full ${
                          p.featured
                            ? "bg-gradient-gold text-emerald-deep hover:opacity-95 shadow-gold font-semibold"
                            : "bg-gradient-emerald text-primary-foreground hover:opacity-90"
                        }`}
                        size="lg"
                      >
                        {isPro ? "Active Pro Plan" : p.cta}
                      </Button>
                    </div>
                  ) : (
                    <Link to={p.href} className="mt-8 block w-full">
                      <Button
                        className="w-full bg-gradient-emerald text-primary-foreground hover:opacity-90"
                        size="lg"
                      >
                        {p.cta}
                      </Button>
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Premium Dummy Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

function PaymentModal({ onClose }: { onClose: () => void }) {
  const { upgradeToPro } = useProStatus();
  const [step, setStep] = useState<"checkout" | "processing" | "success">("checkout");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/29");
  const [cvv, setCvv] = useState("123");
  const [name, setName] = useState("Amit Sharma");

  const [processingMsg, setProcessingMsg] = useState("Initiating secure gateway...");

  const [particles] = useState(() =>
    Array.from({ length: 70 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.5 + Math.random() * 2,
      color: ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"][i % 6],
      size: 4 + Math.random() * 8,
    })),
  );

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvv || !name) {
      toast.error("Please enter all card details!");
      return;
    }

    setStep("processing");

    const messages = [
      "Securing connection...",
      "Authorizing amount ₹50.00...",
      "Verifying card and CVV safety...",
      "Issuing token and confirming transaction...",
      "Activating PDF Master Pro membership...",
    ];

    let currentMsgIdx = 0;
    const interval = setInterval(() => {
      if (currentMsgIdx < messages.length - 1) {
        currentMsgIdx++;
        setProcessingMsg(messages[currentMsgIdx]);
      } else {
        clearInterval(interval);
        setStep("success");
      }
    }, 900);
  };

  const handleFinish = () => {
    upgradeToPro();
    toast.success("Welcome to Pro! Premium features are unlocked. 🎉");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md overflow-hidden bg-card rounded-3xl p-6 sm:p-8 shadow-elevated border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground transition z-30"
          disabled={step === "processing"}
        >
          <X className="h-5 w-5" />
        </button>

        {step === "checkout" && (
          <div>
            <div className="flex items-center gap-2 mb-4 text-accent">
              <CreditCard className="h-5 w-5" />
              <span className="font-semibold text-sm tracking-wide uppercase">Secure Checkout</span>
            </div>

            <h3 className="font-display text-2xl font-bold mb-1">Upgrade to Pro</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Get unlimited access to all 30+ premium PDF tools and AI features.
            </p>

            {/* Plan Card */}
            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 mb-6 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Plan Details
                </p>
                <p className="text-base font-semibold mt-0.5">PDF Master Pro Subscription</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gradient-emerald">₹50</p>
                <p className="text-[10px] text-muted-foreground">/ month</p>
              </div>
            </div>

            {/* Dummy Payment Form */}
            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                  placeholder="e.g. Amit Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition font-mono"
                    placeholder="4242 4242 4242 4242"
                  />
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition font-mono"
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                    CVV
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition font-mono"
                    placeholder="•••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-gold text-emerald-deep font-semibold shadow-gold hover:opacity-95 py-6 rounded-xl flex justify-center items-center gap-1.5"
                >
                  <Lock className="h-4 w-4" /> Pay ₹50.00
                </Button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground pt-1">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Dummy Payment. No real bank details are shared or charged.</span>
              </div>
            </form>
          </div>
        )}

        {step === "processing" && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-6" />
            <h4 className="font-display text-xl font-bold mb-2">Processing Payment</h4>
            <p className="text-sm text-muted-foreground max-w-xs">{processingMsg}</p>
          </div>
        )}

        {step === "success" && (
          <div className="relative text-center py-4">
            {/* Confetti */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, y: -20, x: `${p.x}%` }}
                animate={{ opacity: 0, y: 350, rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
                transition={{ delay: p.delay, duration: p.duration, ease: "easeOut" }}
                className="absolute top-0 rounded-sm pointer-events-none z-10"
                style={{ left: `${p.x}%`, width: p.size, height: p.size, backgroundColor: p.color }}
              />
            ))}

            <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-gradient-gold shadow-gold text-emerald-deep">
              <CheckCircle2 className="h-12 w-12" strokeWidth={2.5} />
            </div>

            <h3 className="font-display text-2xl font-bold text-gradient-emerald mb-2">
              Payment Successful!
            </h3>
            <p className="text-foreground text-sm font-medium mb-1">
              You are now a <span className="font-bold text-accent">PRO</span> Member
            </p>
            <p className="text-xs text-muted-foreground mb-4 font-mono">
              TXN ID: TXN_{Math.floor(100000 + Math.random() * 900000)}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto mb-6">
              Thank you! Your transaction completed successfully. Unlimited conversions, large file
              support, and all AI features have been enabled.
            </p>

            <Button
              onClick={handleFinish}
              size="lg"
              className="w-full bg-gradient-emerald text-primary-foreground hover:opacity-90 shadow-soft font-semibold py-6 rounded-xl"
            >
              Let's Start! 🚀
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
