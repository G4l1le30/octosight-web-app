"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validatePassword = (pw: string): string | null => {
    if (!pw) return "New password is required";
    if (pw.length < 8) return "Must be at least 8 characters";
    if (!/[A-Z]/.test(pw)) return "Must contain an uppercase letter";
    if (!/[a-z]/.test(pw)) return "Must contain a lowercase letter";
    if (!/\d/.test(pw)) return "Must contain a number";
    if (!/[@$!%*?&#^]/.test(pw)) return "Must contain a special character";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({ password: "", confirm: "" });

    if (!token) {
      toast.error("Reset link is invalid or has expired.");
      return;
    }

    const pwError = validatePassword(password);
    if (pwError) {
      setFieldErrors((prev) => ({ ...prev, password: pwError }));
      return;
    }
    if (password !== confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirm: "Passwords do not match" }));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Reset link is invalid or has expired");
      }
      setSuccess(true);
      toast.success("Password has been reset successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthCard
        title="Invalid Link"
        subtitle="This password reset link is invalid or has expired."
        icon={<ShieldCheck className="h-5 md:h-7 w-5 md:w-7" />}
        footerText=""
        footerLinkText=""
        footerLinkHref=""
      >
        <div className="text-center space-y-3 md:space-y-4">
          <p className="text-xs md:text-sm text-secondary/80">
            Please request a new password reset link.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Request New Link
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={success ? "Password Reset" : "Reset Password"}
      subtitle={
        success
          ? "Your password has been updated successfully."
          : "Enter your new password below."
      }
      icon={<ShieldCheck className="h-5 md:h-7 w-5 md:w-7" />}
      footerText={success ? "Go to" : "Remember your password?"}
      footerLinkText={success ? "Sign In" : "Sign In"}
      footerLinkHref="/login"
    >
      {success ? (
        <Button onClick={() => router.push("/login")} className="w-full">
          Sign In with New Password
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          <AuthInput
            id="reset-password"
            label="New Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
            }}
            autoComplete="new-password"
            hasError={!!fieldErrors.password}
            errorText={fieldErrors.password || undefined}
            disabled={loading}
          />
          <AuthInput
            id="reset-confirm"
            label="Confirm Password"
            type="password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirm) setFieldErrors((prev) => ({ ...prev, confirm: "" }));
            }}
            autoComplete="new-password"
            hasError={!!fieldErrors.confirm}
            errorText={fieldErrors.confirm || undefined}
            disabled={loading}
          />
          <Button type="submit" loading={loading} className="w-full">
            Reset Password
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
