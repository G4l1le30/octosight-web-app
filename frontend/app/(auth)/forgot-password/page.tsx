"use client";

import { useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { Button } from "@/components/ui/Button";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Something went wrong");
      }
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Forgot Password"
      subtitle="Enter your email to receive a password reset link"
      icon={<Mail className="h-5 md:h-7 w-5 md:w-7" />}
      footerText="Remember your password?"
      footerLinkText="Sign In"
      footerLinkHref="/login"
    >
      {sent ? (
        <div className="space-y-4 md:space-y-5 text-center">
          <div className="bg-risk-low/10 text-risk-low p-3 md:p-4 rounded-md md:rounded-lg text-xs md:text-sm font-bold border border-risk-low/20">
            If an account with that email exists, a password reset link has been sent. Please check your inbox and spam folder.
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          <AuthInput
            id="forgot-email"
            label="Email Address"
            type="email"
            placeholder="name@gmail.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
            }}
            autoComplete="email"
            hasError={!!emailError}
            errorText={emailError || undefined}
            disabled={loading}
          />
          <Button type="submit" loading={loading} className="w-full">
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
