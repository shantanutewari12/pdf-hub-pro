import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Menu, X, ChevronRight, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { to: "/", label: "Home" },
  { to: "/tools", label: "Tools" },
  { to: "/pricing", label: "Pricing" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });

    // iOS Detection
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    setIsIOS(checkIOS());

    // PWA Install Logic
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    const handleAppInstalled = () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);
    }

    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      alert("To install: Tap the 'Share' button at the bottom and then 'Add to Home Screen' 📱");
      return;
    }
    if (!deferredPrompt) {
      if (import.meta.env.DEV) {
        alert("PWA Install prompt only works in production or when the browser detects installability. In Dev Mode, this is just a preview of the button! 🚀");
      }
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-border/40 bg-background/60 backdrop-blur-2xl shadow-xl py-2"
          : "border-b border-transparent bg-transparent py-4"
      }`}
    >
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-emerald blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-emerald shadow-soft transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
              <FileText className="h-5.5 w-5.5 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <span className="font-display text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            PDF<span className="text-gradient-gold">Master</span>
          </span>
        </Link>

        <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground hover:bg-foreground/5 rounded-lg group"
              activeProps={{ className: "text-foreground bg-foreground/5" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
              <motion.span 
                layoutId="nav-underline"
                className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" 
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-3 pr-3 border-r border-border/40">
            <ThemeToggle />
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })} className="hover:bg-primary/5 rounded-xl px-5">Dashboard</Button>
                <Button variant="outline" className="border-border/60 hover:bg-primary/5 rounded-xl px-5" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>Sign out</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate({ to: "/auth/login" })} className="hover:bg-primary/5 rounded-xl px-5">Log in</Button>
                <Button
                  onClick={() => navigate({ to: "/auth/register" })}
                  className="bg-gradient-emerald text-white hover:opacity-90 shadow-soft group rounded-xl px-6"
                >
                  Get started
                  <ChevronRight className="h-4 w-4 ml-0.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 md:hidden">
             {(showInstallBtn || isIOS || import.meta.env.DEV) && (
               <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              >
                <Download className="h-4 w-4" />
                Install
              </button>
             )}
             <ThemeToggle />
             <button
              className="rounded-xl p-2 bg-foreground/5 hover:bg-foreground/10 transition-all"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-2xl overflow-hidden"
          >
            <div className="px-4 py-6 space-y-2">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3.5 text-base font-medium hover:bg-primary/5 transition-all border border-transparent hover:border-border/40"
                >
                  {l.label}
                </Link>
              ))}
              
              {(showInstallBtn || isIOS || import.meta.env.DEV) && (
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-base font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                >
                  <Download className="h-5 w-5" />
                  Install App
                </button>
              )}

              <div className="pt-4 mt-4 border-t border-border/40 flex flex-col gap-3">
                {user ? (
                  <>
                    <Button variant="outline" className="justify-center py-6 rounded-xl" onClick={() => { setOpen(false); navigate({ to: "/dashboard" }); }}>Dashboard</Button>
                    <Button variant="ghost" className="justify-center py-6 rounded-xl" onClick={async () => { await signOut(); setOpen(false); navigate({ to: "/" }); }}>Sign out</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="justify-center py-6 rounded-xl text-base" onClick={() => { setOpen(false); navigate({ to: "/auth/login" }); }}>Log in</Button>
                    <Button className="bg-gradient-emerald text-white justify-center py-6 rounded-xl text-base font-semibold" onClick={() => { setOpen(false); navigate({ to: "/auth/register" }); }}>
                      Get started <ChevronRight className="h-5 w-5 ml-1" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

