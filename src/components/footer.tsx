import { Link } from "@tanstack/react-router";
import { FileText, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-emerald-deep text-cream mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                <FileText className="h-5 w-5 text-emerald-deep" strokeWidth={2.5} />
              </div>
              <span className="font-display text-xl font-bold">
                PDF<span className="text-gold">Master</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-cream/70 max-w-xs">
              The premium document toolkit. Fast, secure, and beautifully simple.
            </p>
            <div className="mt-6 flex gap-3">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Product" links={[
            { to: "/tools", label: "All tools" },
            { to: "/pricing", label: "Pricing" },
            { to: "/dashboard", label: "Dashboard" },
          ]} />
          <FooterCol title="Company" links={[
            { to: "/contact", label: "Contact" },
            { to: "/privacy", label: "Privacy" },
          ]} />
          <FooterCol title="Account" links={[
            { to: "/auth/login", label: "Log in" },
            { to: "/auth/register", label: "Sign up" },
          ]} />
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cream/60">
          <p>© {new Date().getFullYear()} PDF Master. All rights reserved.</p>
          <p>Files auto-delete after processing · Encrypted in transit</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold mb-4 text-gold">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-sm text-cream/70 hover:text-cream transition">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
