"use client";

import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import React from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-page flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold text-secondary/40">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-page flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10 text-center">
          <div className="w-16 h-16 bg-risk-high/10 text-risk-high rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-secondary mb-2">Authentication Required</h1>
          <p className="text-secondary-light text-sm mb-6">You need to sign in to access the Admin Portal.</p>
          <Link href="/login" className="btn-primary px-8 py-3 text-sm">Sign In</Link>
          <div className="mt-4">
            <Link href="/" className="text-sm font-bold text-secondary/40 hover:text-primary transition-colors">Return to Public Site</Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated but NOT admin — access denied
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-neutral-page flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10 text-center">
          <div className="w-16 h-16 bg-risk-high/10 text-risk-high rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-secondary mb-2">Access Denied</h1>
          <p className="text-secondary-light text-sm mb-2">
            You are signed in as <span className="font-bold text-secondary">{user.full_name}</span>, but your account does not have admin privileges.
          </p>
          <p className="text-xs text-secondary/40 mb-6">Contact your system administrator if you believe this is an error.</p>
          <Link href="/" className="btn-primary px-8 py-3 text-sm">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-page flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
