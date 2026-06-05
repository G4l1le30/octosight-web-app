"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { useGoogleLogin } from "@react-oauth/google";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { SecurityTips } from "@/components/auth/SecurityTips";
import { UserPlus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAccount, registerWithGoogle } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [showGoogleSuccess, setShowGoogleSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({ fullName: "", email: "", password: "", confirmPassword: "" });

    let hasErrors = false;
    const newErrors = { fullName: "", email: "", password: "", confirmPassword: "" };

    if (!fullName.trim()) {
      newErrors.fullName = "Full Name is required";
      hasErrors = true;
    }

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
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      hasErrors = true;
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
      hasErrors = true;
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Password must contain at least one lowercase letter";
      hasErrors = true;
    } else if (!/\d/.test(password)) {
      newErrors.password = "Password must contain at least one number";
      hasErrors = true;
    } else if (!/[@$!%*?&#^]/.test(password)) {
      newErrors.password = "Password must contain at least one special character";
      hasErrors = true;
    }

    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await registerAccount(fullName, email, password);
      toast.success("Registration link sent! Please check your email inbox and spam folder to verify your account.");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setLoading(true);
    try {
      await registerWithGoogle(tokenResponse.access_token);
      setShowGoogleSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Google Sign-Up failed");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogleAction = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error("Google Authentication failed"),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      <div className="relative hidden lg:block h-full w-full">
        <Image
          src="/auth-bg-family.png"
          alt="OctoSight Register"
          fill
          className="object-cover object-top"
          priority
        />
      </div>
      <div className="flex flex-col justify-center h-full">
        <AuthCard
          title="Create Account"
          subtitle="Join OctoSight to report phishing incidents"
          icon={<UserPlus className="h-5 md:h-7 w-5 md:w-7" />}
          iconBgClass="bg-risk-low/10 text-risk-low"
          footerText="Already have an account?"
          footerLinkText="Sign In"
          footerLinkHref="/login"
        >
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5" noValidate>
            <AuthInput
              id="register-name"
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: "" }));
              }}
              autoComplete="name"
              hasError={!!fieldErrors.fullName}
              errorText={fieldErrors.fullName || undefined}
              disabled={loading}
            />

            <AuthInput
              id="register-email"
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
              id="register-password"
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: "" }));
              }}
              autoComplete="new-password"
              hasError={!!fieldErrors.password}
              errorText={fieldErrors.password || undefined}
              disabled={loading}
            />

            <AuthInput
              id="register-confirm"
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
              }}
              autoComplete="new-password"
              hasError={!!fieldErrors.confirmPassword}
              errorText={fieldErrors.confirmPassword || undefined}
              disabled={loading}
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Create Account
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

          <GoogleAuthButton onClick={() => loginWithGoogleAction()} loading={loading} type="register" />

          <SecurityTips />

          {showGoogleSuccess && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <CheckCircle2 className="size-8 text-green-600" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-secondary mb-1.5 md:mb-2">
                  Registration Successful!
                </h2>
                <p className="text-xs md:text-sm text-secondary/70 mb-4 md:mb-6">
                  Your account has been created and verified. Welcome to OctoSight!
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="w-full px-4 md:px-6 py-2 md:py-3 bg-primary text-white font-bold text-xs md:text-sm rounded-lg md:rounded-xl hover:opacity-90 transition-all"
                >
                  Continue to Home
                </button>
              </div>
            </div>
          )}
        </AuthCard>
      </div>
    </div>
  );
}
