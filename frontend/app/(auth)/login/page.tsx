"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { useGoogleLogin } from "@react-oauth/google";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { SecurityTips } from "@/components/auth/SecurityTips";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";
  const redirectTo = searchParams.get("redirect") || "/";
  const { login, loginWithGoogle: authenticateWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({ email: "", password: "" });

    let hasErrors = false;
    const newErrors = { email: "", password: "" };

    if (!email.trim()) {
      newErrors.email = "Email Address is required";
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
      hasErrors = true;
    }

    if (!password) {
      newErrors.password = "Password is required";
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.push(redirectTo);
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setError("");
    setLoading(true);
    try {
      await authenticateWithGoogle(tokenResponse.access_token);
      router.push(redirectTo);
    } catch (err: any) {
      toast.error(err.message || "Google Sign-In failed");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogleAction = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error("Google Authentication failed"),
  });

  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Sign in to your OctoSight account"
      icon={<Lock className="h-5 md:h-7 w-5 md:w-7" />}
      success={isRegistered ? "Registration link sent! Please check your email inbox and spam folder to verify your account." : undefined}
      footerText="Don't have an account?"
      footerLinkText="Create Account"
      footerLinkHref="/register"
    >
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5" noValidate>
        <AuthInput
          id="login-email"
          label="Email Address"
          type="email"
          placeholder="name@gmail.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: "" }));
          }}
          autoComplete="email"
          hasError={!!fieldErrors.email}
          errorText={fieldErrors.email || undefined}
          disabled={loading}
        />

        <AuthInput
          id="login-password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: "" }));
          }}
          autoComplete="current-password"
          hasError={!!fieldErrors.password}
          errorText={fieldErrors.password || undefined}
          disabled={loading}
        />

        <div className="text-right -mt-3 md:-mt-4">
          <Link
            href="/forgot-password"
            className="text-xs font-bold text-primary hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-4 md:my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-border"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-neutral-page px-1.5 md:px-2 text-secondary/60">
            Or continue with
          </span>
        </div>
      </div>

      <GoogleAuthButton onClick={() => loginWithGoogleAction()} loading={loading} type="login" />

      <SecurityTips />
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
