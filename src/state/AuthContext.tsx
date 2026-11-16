import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getProfile, logout as apiLogout, type UserProfile } from "@/api/auth";
import { setUnauthenticatedHandler } from "@/lib/http";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<UserProfile | null>(null);
  const queryClient = useQueryClient();

  const clearSession = () => {
    setUser(null);
    setStatus("unauthenticated");
    queryClient.clear();
  };

  const refreshUser = async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
      setStatus("authenticated");
    } catch {
      clearSession();
    }
  };

  // Runs once on mount only — this is a session bootstrap, not something
  // that should re-run if clearSession/refreshUser identities change.
  useEffect(() => {
    setUnauthenticatedHandler(clearSession);
    refreshUser();
  }, []);

  const signOut = async () => {
    try {
      await apiLogout();
    } catch {
      // Best-effort — cookies get cleared server-side when it succeeds; if
      // the network call fails there's nothing more the client can do
      // beyond dropping local session state, which happens regardless.
    }
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ status, user, setUser, refreshUser, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
