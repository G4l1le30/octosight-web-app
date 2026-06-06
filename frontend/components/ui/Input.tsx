import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, showPasswordToggle, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password" && showPasswordToggle;
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="space-y-1.5 md:space-y-2 w-full">
        {label && (
          <label className="text-xs md:text-sm font-bold text-black block">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 group-focus-within:text-primary transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full bg-white border-2 border-neutral-border rounded-md md:rounded-lg outline-none transition-all font-medium placeholder:text-secondary/60",
              "focus:border-primary focus:ring-4 focus:ring-primary/5",
              error
                ? "border-risk-high focus:border-risk-high focus:ring-risk-high/5"
                : "border-neutral-border",
              leftIcon ? "pl-8 md:pl-11" : "px-3 md:px-4",
              isPassword || rightIcon ? "pr-8 md:pr-11" : "px-3 md:px-4",
              "py-3 md:py-3.5",
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/60 hover:text-secondary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <Eye className="h-4 md:h-5 w-4 md:w-5" /> : <EyeOff className="h-4 md:h-5 w-4 md:w-5" />}
            </button>
          )}
          {!isPassword && rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/60 group-focus-within:text-primary transition-colors">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs font-bold text-risk-high mt-0.5 md:mt-1 animate-in fadein slide-in-from-top-1 duration-200">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
