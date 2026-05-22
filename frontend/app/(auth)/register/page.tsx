"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { useGoogleLogin } from "@react-oauth/google";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { UserPlus } from "lucide-react";

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

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setError("");
    setLoading(true);
    try {
      await registerWithGoogle(tokenResponse.access_token);
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "Google Sign-Up failed");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogleAction = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError("Google Authentication failed"),
  });

  return (
    <AuthCard
      title="Create Account"
      subtitle="Join OctoSight to report phishing incidents"
      icon={<UserPlus className="h-7 w-7" />}
      iconBgClass="bg-risk-low/10 text-risk-low"
      error={error}
      footerText="Already have an account?"
      footerLinkText="Sign In"
      footerLinkHref="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-border"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-neutral-page px-2 text-secondary/60">
            Or continue with
          </span>
        </div>
      </div>

      <GoogleAuthButton onClick={() => loginWithGoogleAction()} loading={loading} type="register" />
    </AuthCard>
  );
}
