"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  errorText?: string;
  hasError?: boolean;
}

export function AuthInput({
  label,
  id,
  type = "text",
  errorText,
  hasError,
  className,
  ...props
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1 md:space-y-1.5 w-full">
      <label htmlFor={id} className="text-xs font-bold text-secondary/60">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          className={`w-full p-3 bg-neutral-page border rounded-lg outline-none transition-all text-sm ${
            isPassword ? "pr-12" : ""
          } ${
            hasError || errorText
              ? "border-risk-high focus:border-risk-high"
              : "border-neutral-border focus:border-primary"
          } ${className || ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/60 hover:text-secondary transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <Eye className="h-4 md:h-5 w-4 md:w-5 animate-in fade-in duration-200" />
            ) : (
              <EyeOff className="h-4 md:h-5 w-4 md:w-5 animate-in fade-in duration-200" />
            )}
          </button>
        )}
      </div>
      {errorText && (
        <p className="text-xs text-risk-high font-bold mt-0.5 md:mt-1 animate-in fade-in duration-200">
          {errorText}
        </p>
      )}
    </div>
  );
}
