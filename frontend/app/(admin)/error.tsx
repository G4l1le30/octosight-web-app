"use client";

import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-risk-high/10 text-risk-high rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-secondary mb-2">Admin Error</h1>
        <p className="text-secondary/60 text-sm leading-relaxed mb-8">
          An unexpected error occurred in the admin panel. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all"
          >
            Try Again
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-neutral-border rounded-xl font-bold text-sm text-secondary hover:border-secondary/40 transition-all"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
