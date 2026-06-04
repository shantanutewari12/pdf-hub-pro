import { createContext, useContext, type ReactNode } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";

// ─── Auth context type ────────────────────────────────────────────────────────
export type AuthCtx = {
  user: { email: string | undefined; id: string } | null;
  session: null;
  loading: boolean;
  signOut: () => Promise<void>;
};

export const AuthCtxInternal = createContext<AuthCtx | undefined>(undefined);

// ── Provider when Clerk IS available (wrapped inside <ClerkProvider>) ─────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const value: AuthCtx = {
    user: user ? { id: user.id, email: user.primaryEmailAddress?.emailAddress } : null,
    session: null,
    loading: !isLoaded,
    signOut: async () => {
      await clerkSignOut();
    },
  };

  return <AuthCtxInternal.Provider value={value}>{children}</AuthCtxInternal.Provider>;
}

// ── Fallback provider when Clerk key is NOT set ───────────────────────────────
export function NoAuthProvider({ children }: { children: ReactNode }) {
  const value: AuthCtx = {
    user: null,
    session: null,
    loading: false,
    signOut: async () => {},
  };
  return <AuthCtxInternal.Provider value={value}>{children}</AuthCtxInternal.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const v = useContext(AuthCtxInternal);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
