import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/register")({
  head: () => ({ meta: [{ title: "Create account — PDF Master" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      toast.error("Sign up failed", { description: error.message });
    } else {
      toast.success("Account created", { description: "Welcome to PDF Master!" });
      navigate({ to: "/dashboard" });
    }
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

        <div className="rounded-3xl border border-border bg-card p-8 shadow-elevated">
          <h1 className="font-display text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Free forever. No credit card required.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email">
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Field label="Password">
              <input
                type="password" required value={password} minLength={6}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-xs text-muted-foreground mt-1 block">At least 6 characters</span>
            </Field>
            <Button type="submit" size="lg" disabled={loading} className="w-full bg-gradient-emerald text-primary-foreground hover:opacity-90">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
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
