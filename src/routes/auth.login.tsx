import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2 } from "lucide-react";
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
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error("Sign in failed", { description: error.message });
    } else {
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-emerald shadow-soft">
            <FileText className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold">
            PDF<span className="text-gradient-gold">Master</span>
          </span>
        </Link>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-elevated">
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>

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
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Button
              type="submit" size="lg" disabled={loading}
              className="w-full bg-gradient-emerald text-primary-foreground hover:opacity-90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/auth/register" className="font-semibold text-primary hover:underline">
              Sign up
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
