import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Log in — PDF Master" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        // Handle common Supabase errors with friendly messages
        const msg = error.message?.toLowerCase() ?? "";
        if (msg.includes("email not confirmed")) {
          toast.error("Email not verified", { description: "Check your inbox for a verification link, or sign up again." });
        } else if (msg.includes("invalid login")) {
          toast.error("Invalid credentials", { description: "Check your email and password, then try again." });
        } else {
          toast.error("Sign in failed", { description: error.message });
        }
      } else {
        toast.success("Welcome back! 🎉");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error("Connection error", { description: "Check your internet and try again." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-emerald shadow-soft">
            <FileText className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold">
            PDF<span className="text-gradient-gold">Master</span>
          </span>
        </Link>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-elevated">
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email">
              <input
                type="email" required value={email} autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} required value={password} autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 rounded-xl border border-border bg-background px-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button" tabIndex={-1}
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Button type="submit" size="lg" disabled={loading} className="w-full bg-gradient-emerald text-primary-foreground hover:opacity-90">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/auth/register" className="font-semibold text-primary hover:underline">Sign up</Link>
          </p>
        </div>
      </motion.div>
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
