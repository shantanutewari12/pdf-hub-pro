import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — PDF Master" },
      { name: "description", content: "Get in touch with the PDF Master team." },
      { property: "og:title", content: "Contact — PDF Master" },
      { property: "og:description", content: "Get in touch with the PDF Master team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent", { description: "We'll get back to you within 24 hours." });
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-sm font-semibold text-accent uppercase tracking-wider">Contact</p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold">
              Let's <span className="text-gradient-emerald">talk</span>
            </h1>
            <p className="mt-4 text-muted-foreground">
              Have a question, idea, or partnership in mind? We'd love to hear from you.
            </p>
            <div className="mt-8 space-y-5">
              {[
                { icon: Mail, label: "Email", value: "hello@pdfmaster.app" },
                { icon: MessageCircle, label: "Live chat", value: "Available Mon–Fri, 9–6 GMT" },
                { icon: MapPin, label: "Office", value: "Remote-first · Worldwide" },
              ].map((it) => (
                <div key={it.label} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <it.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{it.label}</div>
                    <div className="text-sm text-muted-foreground">{it.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-8 shadow-soft space-y-4">
            <Field label="Your name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Field label="Message">
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </Field>
            <Button type="submit" size="lg" className="w-full bg-gradient-emerald text-primary-foreground hover:opacity-90">
              Send message
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
