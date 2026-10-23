import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setUnauthorizedHandler, tokenStore } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  // If there's a saved token we must check it before deciding logged-in vs logged-out.
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setTenant(null);
  }, []);

  // api.js calls this whenever the server says our token is no longer valid.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  // Restore the session on page load / refresh.
  useEffect(() => {
    if (!tokenStore.get()) return;
    let cancelled = false;

    api("/auth/me")
      .then((data) => {
        if (cancelled) return;
        setUser(data.user);
        setTenant(data.tenant);
      })
      .catch(() => {
        // 401 is handled by api.js (clears the session). For other errors, such
        // as the API being down, keep the token and just show the login page.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const startSession = useCallback((data) => {
    tokenStore.set(data.token);
    setUser(data.user);
    setTenant(data.tenant);
  }, []);

  const login = useCallback(
    async (credentials) => {
      startSession(await api("/auth/login", { method: "POST", body: credentials }));
    },
    [startSession]
  );

  const registerCompany = useCallback(
    async (details) => {
      startSession(await api("/auth/register-tenant", { method: "POST", body: details }));
    },
    [startSession]
  );

  const value = useMemo(
    () => ({ user, tenant, loading, login, registerCompany, logout: clearSession }),
    [user, tenant, loading, login, registerCompany, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
