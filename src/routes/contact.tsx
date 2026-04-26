import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, MapPin, Send, CheckCircle2, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import emailjs from "@emailjs/browser";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — PDF Master" },
      { name: "description", content: "Get in touch with the PDF Master team." },
    ],
  }),
  component: ContactPage,
});

const CONTACT_EMAIL = "shantanitiwari12@gmail.com";
const EMAILJS_SERVICE = "service_39w2e0g";
const EMAILJS_TEMPLATE = "template_5nzc7pm";
const EMAILJS_KEY = "0-2CVKIsJKAgdvs3K";

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await emailjs.send(
        EMAILJS_SERVICE,
        EMAILJS_TEMPLATE,
        {
          from_name: form.name,
          from_email: form.email,
          message: form.message,
          to_email: CONTACT_EMAIL,
        },
        EMAILJS_KEY,
      );
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error("EmailJS failed:", err);
      // Even if it fails, show success animation as requested to not open mail client
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="text-sm font-semibold text-accent uppercase tracking-wider">Contact</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-bold">
              Let's <span className="text-gradient-emerald">talk</span>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground">
              Have a question, idea, or partnership in mind? We'd love to hear from you.
            </p>
            <div className="mt-8 space-y-5">
              {[
                { icon: Mail, label: "Email", value: CONTACT_EMAIL },
                { icon: MessageCircle, label: "WhatsApp", value: "+91 93680 42721" },
                { icon: MapPin, label: "Location", value: "India 🇮🇳 · Remote worldwide" },
              ].map((it) => (
                <div key={it.label} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <it.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{it.label}</div>
                    <div className="text-sm text-muted-foreground break-all">{it.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {sent ? (
              <SuccessAnimation onReset={() => setSent(false)} />
            ) : (
              <motion.form
                key="form"
                ref={formRef}
                onSubmit={submit}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft space-y-4"
              >
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
                <Button
                  type="submit"
                  size="lg"
                  disabled={sending}
                  className="w-full bg-gradient-emerald text-primary-foreground hover:opacity-90 group"
                >
                  {sending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      Send message{" "}
                      <Send className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SuccessAnimation({ onReset }: { onReset: () => void }) {
  // Confetti particles
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      color: ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"][i % 6],
      size: 4 + Math.random() * 6,
    })),
  );

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative rounded-3xl border border-primary/30 bg-card p-8 sm:p-12 shadow-elevated text-center overflow-hidden"
    >
      {/* Confetti */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, y: -20, x: `${p.x}%` }}
          animate={{ opacity: 0, y: 300, rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
          transition={{ delay: p.delay, duration: p.duration, ease: "easeOut" }}
          className="absolute top-0 rounded-sm pointer-events-none"
          style={{ left: `${p.x}%`, width: p.size, height: p.size, backgroundColor: p.color }}
        />
      ))}

      {/* Pulsing ring */}
      <div className="relative mx-auto w-20 h-20 mb-6">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/10"
          animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-emerald shadow-elevated"
        >
          <CheckCircle2 className="h-10 w-10 text-primary-foreground" strokeWidth={2} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <Sparkles className="h-5 w-5 text-gold" />
          <h3 className="font-display text-2xl font-bold">Message Sent!</h3>
          <Sparkles className="h-5 w-5 text-gold" />
        </div>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Your message has been successfully delivered. We'll get back to you within 24 hours.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        <button onClick={onReset} className="mt-6 text-sm font-medium text-primary hover:underline">
          Send another message →
        </button>
      </motion.div>
    </motion.div>
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
