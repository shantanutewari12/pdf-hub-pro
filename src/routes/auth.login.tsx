import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileText, AlertTriangle } from "lucide-react";
import { SignIn } from "@clerk/clerk-react";

const CLERK_KEY = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  (typeof process !== "undefined" ? process.env.VITE_CLERK_PUBLISHABLE_KEY : undefined)) as
  | string
  | undefined;
const hasClerk = Boolean(CLERK_KEY && !CLERK_KEY.startsWith("pk_test_REPLACE"));

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Log in — PDF Master" }] }),
  component: LoginPage,
});

function LoginPage() {
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

        {hasClerk ? (
          <div className="flex justify-center">
            <SignIn
              routing="hash"
              signUpUrl="/auth/register"
              fallbackRedirectUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "rounded-3xl border border-border bg-card shadow-elevated",
                  headerTitle: "font-display text-2xl font-bold",
                  headerSubtitle: "text-muted-foreground text-sm",
                  formButtonPrimary: "bg-gradient-emerald hover:opacity-90 transition rounded-xl",
                  formFieldInput:
                    "rounded-xl border-border bg-background focus:ring-2 focus:ring-ring",
                  footerActionLink: "text-primary font-semibold hover:underline",
                  identityPreviewEditButton: "text-primary",
                  formFieldLabel: "text-sm font-medium",
                },
              }}
            />
          </div>
        ) : (
          <ClerkNotConfigured />
        )}
      </motion.div>
    </div>
  );
}

function ClerkNotConfigured() {
  return (
    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-8 text-center shadow-elevated">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 mx-auto mb-4">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
      </div>
      <h2 className="font-display text-xl font-bold mb-2">Auth not configured</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Add your Clerk publishable key to{" "}
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.env</code> to enable login.
      </p>
      <ol className="text-left text-sm text-muted-foreground space-y-2 bg-muted/40 rounded-xl p-4">
        <li>
          1. Go to{" "}
          <a
            href="https://dashboard.clerk.com"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            dashboard.clerk.com
          </a>
        </li>
        <li>
          2. Create an app → copy the <strong>Publishable key</strong>
        </li>
        <li className="font-mono text-xs bg-background rounded p-2 mt-1">
          VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
        </li>
        <li>
          3. Add it to your <code className="text-xs bg-muted px-1 rounded">.env</code> file and
          restart the dev server
        </li>
      </ol>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-emerald px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition"
      >
        Back to home
      </Link>
    </div>
  );
}
