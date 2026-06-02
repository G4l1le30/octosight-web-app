"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import React, { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";

function RedirectToHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <div className="min-h-screen bg-neutral-page flex items-center justify-center">
      <p className="text-sm font-bold text-secondary/60">Redirecting...</p>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { can } = usePermissions();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-page flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold text-secondary/60">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-page flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10 text-center">
          <div className="w-8 h-8 md:w-16 md:h-16 bg-risk-high/10 text-risk-high rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-secondary mb-2">
            Authentication Required
          </h1>
          <p className="text-secondary-light text-sm mb-4 md:mb-6">
            You need to sign in to access the Admin Portal.
          </p>
          <Link href="/login" className="btn-primary px-6 md:px-8 py-3 text-sm">
            Sign In
          </Link>
          <div className="mt-4">
            <Link
              href="/"
              className="text-sm font-semibold text-secondary/60 hover:text-primary transition-colors"
            >
              Return to Public Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated but no dashboard access — redirect to home
  if (!can("dashboard.view")) {
    return <RedirectToHome />;
  }

  return (
    <div className="min-h-screen bg-neutral-page flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
