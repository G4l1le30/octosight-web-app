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
      <div className="mx-4 w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-2xl ring-1 ring-slate-700">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20">
            <svg className="h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white">Session Expired</h2>
          <p className="mt-2 text-sm text-slate-400">
            Your session has expired. Please log in again to continue.
          </p>
        </div>
        <button
          onClick={handleLogin}
          className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-400"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
