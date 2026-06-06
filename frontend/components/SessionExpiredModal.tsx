"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function SessionExpiredModal() {
  const { sessionExpired, dismissSessionExpired } = useAuth();
  const router = useRouter();

  if (!sessionExpired) return null;

  const handleLogin = () => {
    dismissSessionExpired();
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-3 md:mx-4 w-full max-w-md rounded-2xl md:rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-neutral-border">
        <div className="mb-4 md:mb-6 text-center">
          <div className="mx-auto mb-3 md:mb-4 flex h-12 md:h-16 w-12 md:w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg
              className="h-6 md:h-8 w-6 md:w-8"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-secondary">Session Expired</h2>
          <p className="mt-1.5 md:mt-2 text-xs md:text-sm text-secondary/80">
            Your session has expired. Please log in again to continue.
          </p>
        </div>
        <button
          onClick={handleLogin}
          className="w-full rounded-lg md:rounded-xl bg-primary text-white font-bold text-xs md:text-sm px-4 md:px-5 py-2 md:py-3 hover:opacity-90 transition-all"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
