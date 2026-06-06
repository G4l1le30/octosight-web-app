"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

function ConfirmDeletionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No confirmation token provided.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/v1/auth/confirm-deletion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Account deleted permanently.");
        } else {
          setStatus("error");
          setMessage(data.detail || "Failed to confirm deletion. The link may be expired.");
        }
      } catch {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md rounded-3xl border border-neutral-border bg-white shadow-xl p-8 text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-5 size-14 rounded-full bg-gray-100 flex items-center justify-center">
              <Loader2 className="size-7 text-secondary animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-secondary mb-2">Confirming Deletion</h1>
            <p className="text-sm text-secondary/80">Please wait while we process your request...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 size-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="size-7 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-secondary mb-2">Account Deleted</h1>
            <p className="text-sm text-secondary/80 mb-6">{message}</p>
            <Button onClick={() => router.push("/")} className="w-full">
              Back to Home
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-5 size-14 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="size-7 text-risk-high" />
            </div>
            <h1 className="text-xl font-bold text-secondary mb-2">Deletion Failed</h1>
            <p className="text-sm text-secondary/80 mb-6">{message}</p>
            <Button onClick={() => router.push("/")} className="w-full">
              Back to Home
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmDeletionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmDeletionContent />
    </Suspense>
  );
}
