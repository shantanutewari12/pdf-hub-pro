import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useNavigate,
} from "@tanstack/react-router";
import { Toaster, toast } from "sonner";
import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider, NoAuthProvider } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { useProStatus } from "@/lib/pro-store";
import { playAlertSound, playSuccessSound } from "@/lib/sounds";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Sparkles,
  Check,
  X,
  ShieldAlert,
  Zap,
  Loader2,
  Lock,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
// @ts-expect-error virtual module from vite-plugin-pwa
import { registerSW } from "virtual:pwa-register";

import appCss from "../styles.css?url";

const CLERK_KEY = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  (typeof process !== "undefined" ? process.env.VITE_CLERK_PUBLISHABLE_KEY : undefined)) as
  | string
  | undefined;
const hasClerk = Boolean(CLERK_KEY && !CLERK_KEY.startsWith("pk_test_REPLACE"));

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-gradient-emerald">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-emerald px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PDF Master — The premium PDF toolkit" },
      {
        name: "description",
        content:
          "Convert, edit, merge, split, compress, sign and protect PDFs. 30+ premium tools, beautifully simple.",
      },
      { name: "author", content: "PDF Master" },
      { property: "og:title", content: "PDF Master — The premium PDF toolkit" },
      {
        property: "og:description",
        content:
          "Convert, edit, merge, split, compress, sign and protect PDFs. Beautifully simple.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "PDFMaster" },
      { name: "theme-color", content: "#10b981" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ProNotificationManager() {
  const { isPro, upgradeToPro } = useProStatus();
  const [showBlocker, setShowBlocker] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [step, setStep] = useState<"blocker" | "checkout" | "processing" | "success">("blocker");

  // Checkout states
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/29");
  const [cvv, setCvv] = useState("123");
  const [name, setName] = useState("Amit Sharma");
  const [processingMsg, setProcessingMsg] = useState("Initiating secure connection...");

  const [particles] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.5 + Math.random() * 2,
      color: ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"][i % 6],
      size: 4 + Math.random() * 8,
    })),
  );

  useEffect(() => {
    if (isPro) {
      setShowBlocker(false);
      return;
    }

    // 2 minutes timer = 120,000 ms
    const timerDelay = 2 * 60 * 1000;

    const timer = setTimeout(() => {
      const currentPro = localStorage.getItem("pdf_master_pro") === "true";
      if (!currentPro) {
        setShowBlocker(true);
        setStep("blocker");
        playAlertSound();
      }
    }, timerDelay);

    return () => clearTimeout(timer);
  }, [isPro, resetKey]);

  const handleClose = () => {
    setShowBlocker(false);
    toast.info("Reminder will reappear in 2 minutes!", {
      duration: 4000,
    });
    setResetKey((prev) => prev + 1);
  };

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
      "Verifying card safety...",
      "Activating PDF Master Pro...",
    ];

    let currentMsgIdx = 0;
    const interval = setInterval(() => {
      if (currentMsgIdx < messages.length - 1) {
        currentMsgIdx++;
        setProcessingMsg(messages[currentMsgIdx]);
      } else {
        clearInterval(interval);
        playSuccessSound();
        setStep("success");
      }
    }, 850);
  };

  const handleFinish = () => {
    upgradeToPro();
    toast.success("Welcome to PDF Master Pro! Premium features are unlocked. 🎉");
    setShowBlocker(false);
  };

  return (
    <AnimatePresence>
      {showBlocker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden bg-background/80 dark:bg-card/75 backdrop-blur-lg rounded-3xl p-6 sm:p-7 shadow-elevated border border-primary/25"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground transition z-30"
              disabled={step === "processing"}
            >
              <X className="h-5 w-5" />
            </button>

            {step === "blocker" && (
              <div className="text-center">
                <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-gradient-gold shadow-gold text-emerald-deep animate-pulse">
                  <Crown className="h-10 w-10" strokeWidth={2.5} />
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80 mb-2">
                  Upgrade to <span className="text-gradient-gold">Pro Member</span> 👑
                </h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                  You've spent more than 2 minutes exploring the tools! Unlock the full potential of
                  PDF Master without constraints.
                </p>

                {/* Benefits List */}
                <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 mb-6 text-left space-y-3">
                  <div className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                    <span>
                      <strong>All 28+ tools</strong> completely unrestricted
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                    <span>
                      <strong>5 GB file size limit</strong> (free plan capped at 100 MB)
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                    <span>🤖 Premium AI Summarizer, Chat & Translation tools</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                    <span>High-priority processing with zero delays</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  <Button
                    onClick={() => setStep("checkout")}
                    className="w-full bg-gradient-gold text-emerald-deep font-bold py-6 rounded-xl shadow-gold hover:opacity-95 text-base flex justify-center items-center gap-1.5"
                  >
                    Unlock Pro now — Just ₹50/month
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    className="w-full py-5 rounded-xl hover:bg-muted/50 text-muted-foreground text-sm font-semibold"
                  >
                    Maybe later (Ask me again in 2 minutes)
                  </Button>
                </div>
              </div>
            )}

            {step === "checkout" && (
              <div>
                <div className="flex items-center gap-2 mb-4 text-accent">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-semibold text-sm tracking-wide uppercase">
                    Secure Checkout
                  </span>
                </div>

                <h3 className="font-display text-2xl font-bold mb-1 text-left">Upgrade to Pro</h3>
                <p className="text-muted-foreground text-sm mb-6 text-left">
                  Get unlimited access to all tools. No actual charges will apply.
                </p>

                {/* Plan Card */}
                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 mb-6 flex justify-between items-center text-left">
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
                <form onSubmit={handlePay} className="space-y-4 text-left">
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
                    <ShieldAlert className="h-4 w-4 text-emerald-500" />
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
                    style={{
                      left: `${p.x}%`,
                      width: p.size,
                      height: p.size,
                      backgroundColor: p.color,
                    }}
                  />
                ))}

                <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-gradient-gold shadow-gold text-emerald-deep">
                  <Check className="h-10 w-10" strokeWidth={3} />
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
                  Thank you! Your transaction completed successfully. All Pro features are now
                  unlocked.
                </p>

                <Button
                  onClick={handleFinish}
                  size="lg"
                  className="w-full bg-gradient-emerald text-primary-foreground hover:opacity-90 shadow-soft font-semibold py-6 rounded-xl"
                >
                  Awesome, let's go! 🚀
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AppContent() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      registerSW({ immediate: true });
    }
  }, []);

  return (
    <AuthProvider>
      <Outlet />
      <ProNotificationManager />
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}

function RootComponent() {
  if (hasClerk) {
    return (
      <ClerkProvider publishableKey={CLERK_KEY!} afterSignOutUrl="/">
        <AppContent />
      </ClerkProvider>
    );
  }
  // No Clerk key — PDF tools still fully work, auth is just disabled
  return (
    <NoAuthProvider>
      <Outlet />
      <ProNotificationManager />
      <Toaster position="top-right" richColors closeButton />
    </NoAuthProvider>
  );
}
