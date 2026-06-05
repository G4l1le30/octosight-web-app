"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { AuthUser } from "@/types/auth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  sessionExpired: boolean;
  dismissSessionExpired: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  registerWithGoogle: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const getRequestPath = useCallback((input: RequestInfo | URL) => {
    if (typeof input === "string") {
      return input;
    }

    if (input instanceof URL) {
      return `${input.pathname}${input.search}`;
    }

    try {
      return new URL(input.url).pathname + new URL(input.url).search;
    } catch {
      return input.url;
    }
  }, []);

  const isManagedApiRequest = useCallback((input: RequestInfo | URL) => {
    if (typeof window === "undefined") {
      return false;
    }

    if (typeof input === "string") {
      if (input.startsWith("/")) {
        return input.startsWith("/api/");
      }

      try {
        const url = new URL(input, window.location.origin);
        return (
          url.origin === window.location.origin && url.pathname.startsWith("/api/")
        );
      } catch {
        return false;
      }
    }

    const url =
      input instanceof URL ? input : new URL(input.url, window.location.origin);
    return url.origin === window.location.origin && url.pathname.startsWith("/api/");
  }, []);

  const shouldRetryAfterUnauthorized = useCallback((path: string) => {
    if (!path.startsWith("/api/v1/")) {
      return false;
    }

    return ![
      "/api/v1/auth/login",
      "/api/v1/auth/register",
      "/api/v1/auth/google/login",
      "/api/v1/auth/google/register",
      "/api/v1/auth/logout",
      "/api/v1/auth/refresh",
    ].includes(path);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = fetch("/api/v1/auth/refresh", {
        method: "POST",
        credentials: "include",
      })
        .then((response) => response.ok)
        .catch(() => false)
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }

    return refreshPromiseRef.current;
  }, []);

  const performAuthenticatedFetch = useCallback(
    async (nativeFetch: typeof window.fetch, input: RequestInfo | URL, init?: RequestInit) => {
      if (!isManagedApiRequest(input)) {
        return nativeFetch(input, init);
      }

      const path = getRequestPath(input);
      const requestInit: RequestInit = {
        ...init,
        credentials: "include",
      };

      const response = await nativeFetch(input, requestInit);
      if (response.status !== 401 || !shouldRetryAfterUnauthorized(path)) {
        return response;
      }

      const refreshed = await refreshSession();
      if (!refreshed) {
        if (user !== null) {
          setUser(null);
          setSessionExpired(true);
        }
        return response;
      }

      const retryResponse = await nativeFetch(input, requestInit);
      return retryResponse;
    },
    [getRequestPath, isManagedApiRequest, refreshSession, shouldRetryAfterUnauthorized, user]
  );

  useEffect(() => {
    const nativeFetch = window.fetch.bind(window);

    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
      performAuthenticatedFetch(nativeFetch, input, init)) as typeof window.fetch;

    return () => {
      window.fetch = nativeFetch;
    };
  }, [performAuthenticatedFetch]);

  const fetchMe = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const response = await fetch("/api/v1/auth/me", {
        credentials: "include",
        headers: { "Accept": "application/json" },
      });

      if (response.ok) {
        const data: AuthUser = await response.json();
        const permRes = await fetch("/api/v1/auth/my-permissions", {
          credentials: "include",
          headers: { "Accept": "application/json" },
        });
        if (permRes.ok) {
          const permData = await permRes.json();
          data.permissions = permData.permissions;
        }
        setUser(data);
        return data;
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      setUser(null);
    }
    return null;
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const currentUser = await fetchMe();
        if (!active) return;
        setUser(currentUser);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let errorMessage = "Login failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        if (response.status >= 500) {
          errorMessage = "Internal Server Error. Backend might be unreachable.";
        } else if (response.status === 404) {
          errorMessage = "API Endpoint not found. Please check backend connection.";
        } else {
          errorMessage = `Unexpected error: ${response.statusText || response.status}`;
        }
      }
      throw new Error(errorMessage);
    }

    await response.json();

    const currentUser = await fetchMe();
    if (!currentUser) {
      throw new Error("Login succeeded but the session could not be established.");
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    const response = await fetch("/api/v1/auth/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, password }),
    });

    if (!response.ok) {
      let errorMessage = "Registration failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        if (response.status >= 500) {
          errorMessage = "Internal Server Error. Backend might be unreachable.";
        } else if (response.status === 404) {
          errorMessage = "API Endpoint not found. Please check backend connection.";
        } else {
          errorMessage = `Unexpected error: ${response.statusText || response.status}`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.requires_verification) {
      return;
    }

    const currentUser = await fetchMe();
    if (!currentUser) {
      throw new Error("Registration succeeded but the session could not be established.");
    }
  };

  const loginWithGoogle = async (accessToken: string) => {
    const response = await fetch("/api/v1/auth/google/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: accessToken }),
    });

    if (!response.ok) {
      let errorMessage = "Google Sign-In failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {}
      throw new Error(errorMessage);
    }

    await response.json();

    const currentUser = await fetchMe();
    if (!currentUser) {
      throw new Error("Google sign-in succeeded but the session could not be established.");
    }
  };

  const registerWithGoogle = async (accessToken: string) => {
    const response = await fetch("/api/v1/auth/google/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: accessToken }),
    });

    if (!response.ok) {
      let errorMessage = "Google Sign-Up failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {}
      throw new Error(errorMessage);
    }

    const currentUser = await fetchMe();
    if (!currentUser) {
      throw new Error("Registration succeeded but the session could not be established.");
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, sessionExpired, dismissSessionExpired, login, register, loginWithGoogle, registerWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
