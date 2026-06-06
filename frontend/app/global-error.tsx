"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex flex-col items-center justify-center px-3 md:px-4 py-10 md:py-12 bg-neutral-page">
        <div className="max-w-md w-full text-center">
          <div className="w-12 md:w-16 h-12 md:h-16 bg-risk-high/10 text-risk-high rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-secondary mb-1.5 md:mb-2">Critical Error</h1>
          <p className="text-secondary text-xs md:text-sm leading-relaxed mb-6 md:mb-8">
            A critical error occurred. Please refresh the page or try again later.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-4 md:px-6 py-2 md:py-3 bg-red-600 text-white rounded-lg md:rounded-xl font-bold text-xs md:text-sm hover:opacity-90 transition-all"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 md:px-6 py-2 md:py-3 border-2 border-gray-200 rounded-lg md:rounded-xl font-bold text-xs md:text-sm text-secondary hover:border-gray-400 transition-all"
            >
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
