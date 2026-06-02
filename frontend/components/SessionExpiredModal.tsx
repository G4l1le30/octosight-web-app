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
      <div className="mx-4 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-neutral-border">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg
              className="h-8 w-8"
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
          <h2 className="text-xl font-bold text-secondary">Session Expired</h2>
          <p className="mt-2 text-sm text-secondary/70">
            Your session has expired. Please log in again to continue.
          </p>
        </div>
        <button
          onClick={handleLogin}
          className="w-full rounded-xl bg-primary text-white font-bold text-sm px-5 py-3 hover:opacity-90 transition-all"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
