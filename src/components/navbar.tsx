import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Menu, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-lg"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-emerald blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-emerald shadow-soft transition-transform group-hover:scale-110">
              <FileText className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            PDF<span className="text-gradient-gold">Master</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground group"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-gradient-emerald rounded-full transition-all group-hover:w-6" />
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })} className="hover:bg-primary/5">Dashboard</Button>
              <Button variant="outline" className="border-border/60 hover:bg-primary/5" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>Sign out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate({ to: "/auth/login" })} className="hover:bg-primary/5">Log in</Button>
              <Button
                onClick={() => navigate({ to: "/auth/register" })}
                className="bg-gradient-emerald text-primary-foreground hover:opacity-90 shadow-soft group"
              >
                Get started
                <ChevronRight className="h-4 w-4 ml-0.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden rounded-lg p-2 hover:bg-muted transition"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-primary/5 transition"
                >
                  {l.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-border/40 flex flex-col gap-2">
                {user ? (
                  <>
                    <Button variant="outline" className="justify-start" onClick={() => { setOpen(false); navigate({ to: "/dashboard" }); }}>Dashboard</Button>
                    <Button variant="ghost" onClick={async () => { await signOut(); setOpen(false); navigate({ to: "/" }); }}>Sign out</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="justify-start" onClick={() => { setOpen(false); navigate({ to: "/auth/login" }); }}>Log in</Button>
                    <Button className="bg-gradient-emerald text-primary-foreground justify-start" onClick={() => { setOpen(false); navigate({ to: "/auth/register" }); }}>
                      Get started <ChevronRight className="h-4 w-4 ml-1" />
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
