"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser } from "@/types/auth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
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

  const fetchMe = useCallback(async () => {
    try {
      let response = await fetch("/api/v1/auth/me", {
        headers: { "Accept": "application/json" },
      });
      
      // If unauthorized, attempt to refresh token
      if (response.status === 401) {
        const refreshRes = await fetch("/api/v1/auth/refresh", { method: "POST" });
        if (refreshRes.ok) {
          // Retry original request if refresh succeeded
          response = await fetch("/api/v1/auth/me", {
            headers: { "Accept": "application/json" },
          });
        }
      }

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
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

    const userData = await response.json();
    setUser(userData);
  };

  const register = async (fullName: string, email: string, password: string) => {
    const response = await fetch("/api/v1/auth/register", {
      method: "POST",
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

    const userData = await response.json();
    setUser(userData);
  };

  const loginWithGoogle = async (accessToken: string) => {
    const response = await fetch("/api/v1/auth/google/login", {
      method: "POST",
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

    const userData = await response.json();
    setUser(userData);
  };

  const registerWithGoogle = async (accessToken: string) => {
    const response = await fetch("/api/v1/auth/google/register", {
      method: "POST",
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
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, registerWithGoogle, logout }}>
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
