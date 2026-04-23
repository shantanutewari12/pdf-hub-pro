import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileText, Menu, X } from "lucide-react";
import { useState } from "react";
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

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-border/40 glass"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-emerald shadow-soft transition-transform group-hover:scale-105">
            <FileText className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            PDF<span className="text-gradient-gold">Master</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>
                Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate({ to: "/auth/login" })}>
                Log in
              </Button>
              <Button
                onClick={() => navigate({ to: "/auth/register" })}
                className="bg-gradient-emerald text-primary-foreground hover:opacity-90 shadow-soft"
              >
                Get started
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden rounded-lg p-2 hover:bg-muted"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur"
        >
          <div className="px-4 py-4 space-y-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border/40 flex flex-col gap-2">
              {user ? (
                <>
                  <Button variant="outline" onClick={() => { setOpen(false); navigate({ to: "/dashboard" }); }}>Dashboard</Button>
                  <Button onClick={async () => { await signOut(); setOpen(false); navigate({ to: "/" }); }}>Sign out</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { setOpen(false); navigate({ to: "/auth/login" }); }}>Log in</Button>
                  <Button className="bg-gradient-emerald text-primary-foreground" onClick={() => { setOpen(false); navigate({ to: "/auth/register" }); }}>
                    Get started
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
