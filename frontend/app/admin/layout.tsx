"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if already logged in (using session storage)
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === btoa("admin:admin1234")) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const token = btoa(`${username}:${password}`);
    if (username === "admin" && password === "admin1234") {
      sessionStorage.setItem("admin_auth", token);
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Invalid admin credentials");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-page flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-secondary">Admin Portal</h1>
            <p className="text-secondary-light text-sm mt-2">Restricted Access - Authorization Required</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-risk-high/10 text-risk-high p-3 rounded-lg text-xs font-bold text-center">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40">Username</label>
              <input 
                type="text" 
                className="w-full p-3 bg-neutral-page border border-neutral-border rounded-lg outline-none focus:border-primary transition-all font-bold text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40">Password</label>
              <input 
                type="password" 
                className="w-full p-3 bg-neutral-page border border-neutral-border rounded-lg outline-none focus:border-primary transition-all font-bold text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="w-full btn-primary py-3 text-sm">
              Authorize Access
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <Link href="/" className="text-xs font-bold text-secondary/40 hover:text-primary transition-colors">← Return to Public Site</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-page">
      <nav className="bg-white border-b border-neutral-border py-4 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary px-3 py-1 rounded font-black text-sm tracking-tighter text-white">OCTO</div>
          <span className="font-bold text-xs uppercase tracking-widest opacity-60 text-secondary">Admin Dashboard</span>
        </div>
        <button 
          onClick={() => {
            sessionStorage.removeItem("admin_auth");
            window.location.reload();
          }}
          className="text-xs font-black text-secondary hover:text-primary transition-colors uppercase"
        >
          Logout
        </button>
      </nav>
      {children}
    </div>
  );
}
