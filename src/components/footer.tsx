import { Link } from "@tanstack/react-router";
import { FileText, Mail, Heart, Shield, Zap, Globe, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const EMAIL = "shantanitiwari12@gmail.com";

export function Footer() {
  const { user, signOut } = useAuth();
  return (
    <footer className="relative overflow-hidden border-t border-border/60 bg-emerald-deep text-cream mt-12 sm:mt-24">
      {/* Decorative gradient orbs */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="sm:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-gold blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold shadow-gold transition-transform group-hover:scale-110">
                  <FileText className="h-5 w-5 text-emerald-deep" strokeWidth={2.5} />
                </div>
              </div>
              <span className="font-display text-xl font-bold">
                PDF<span className="text-gold">Master</span>
              </span>
            </Link>

            <p className="mt-4 text-sm text-cream/70 max-w-xs leading-relaxed">
              The premium document toolkit trusted by thousands. Fast, secure, and beautifully crafted.
            </p>

            {/* Feature badges */}
            <div className="mt-5 space-y-2.5">
              {[
                { icon: Zap, text: "28+ premium PDF tools", color: "text-gold" },
                { icon: Shield, text: "256-bit encrypted & auto-delete", color: "text-emerald-300" },
                { icon: Globe, text: "100% browser-based — always private", color: "text-sky-300" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5 text-sm text-cream/80 group">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/10 transition">
                    <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                  </span>
                  {item.text}
                </div>
              ))}
            </div>

            {/* Social icons */}
            <div className="mt-6 flex gap-3">
              <a href={`mailto:${EMAIL}`} aria-label="Email us" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 hover:scale-110 transition-all">
                <Mail className="h-4 w-4" />
              </a>
              <a href="https://wa.me/919368042721" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 hover:bg-[#25d366]/20 hover:scale-110 transition-all">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          <FooterCol title="Product" links={[
            { to: "/tools", label: "All tools" },
            { to: "/pricing", label: "Pricing" },
            { to: "/dashboard", label: "Dashboard" },
          ]} />
          <FooterCol title="Company" links={[
            { to: "/contact", label: "Contact" },
            { to: "/privacy", label: "Privacy" },
          ]} />
          <div className="flex flex-col">
            <h4 className="font-display text-sm font-semibold mb-4 text-gold uppercase tracking-wider">Account</h4>
            <ul className="space-y-3">
              {user ? (
                <>
                  <li>
                    <Link to="/dashboard" className="text-sm text-cream/60 hover:text-cream transition-colors inline-flex items-center gap-1 group">
                      Dashboard
                      <ArrowUpRight className="h-3 w-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    </Link>
                  </li>
                  <li>
                    <button onClick={() => signOut()} className="text-sm text-cream/60 hover:text-cream transition-colors inline-flex items-center gap-1 group">
                      Log out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/auth/login" className="text-sm text-cream/60 hover:text-cream transition-colors inline-flex items-center gap-1 group">
                      Log in
                      <ArrowUpRight className="h-3 w-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    </Link>
                  </li>
                  <li>
                    <Link to="/auth/register" className="text-sm text-cream/60 hover:text-cream transition-colors inline-flex items-center gap-1 group">
                      Sign up free
                      <ArrowUpRight className="h-3 w-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 sm:mt-14 pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-cream/50">© {new Date().getFullYear()} PDF Master. All rights reserved.</p>
            <p className="flex items-center gap-1.5 text-xs text-cream/50">
              Crafted with <Heart className="h-3 w-3 text-gold fill-gold animate-pulse" /> by{" "}
              <span className="font-semibold text-gold hover:text-gold/80 transition">Shantanu Tiwari</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold mb-4 text-gold uppercase tracking-wider">{title}</h4>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-sm text-cream/60 hover:text-cream transition-colors inline-flex items-center gap-1 group">
              {l.label}
              <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
