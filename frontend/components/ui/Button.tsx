"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Slot: React.FC<React.HTMLAttributes<HTMLElement>> = ({ children }) => <>{children}</>;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "google";
  loading?: boolean;
  asChild?: boolean;
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
};

const variants: Record<string, string> = {
  primary: "bg-primary text-white hover:bg-primary/90",
  secondary: "bg-secondary text-white hover:bg-secondary/90",
  outline: "border border-neutral-border bg-white text-secondary hover:bg-neutral-page",
  ghost: "text-secondary hover:bg-neutral-page",
  danger: "bg-risk-high text-white hover:bg-risk-high/90",
  google: "bg-[#4285F4] text-white hover:bg-[#3367D6]",
};

const sizeVariants = {
  sm: "h-9 px-3",
  md: "h-10 px-4",
  lg: "px-5 py-2 md:py-3",

};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading = false, asChild = false, size = "md", leftIcon, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
          variants[variant as keyof typeof variants],
          sizeVariants[size],
          loading && "opacity-50 cursor-wait",
          className
        )}
        disabled={props.disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {leftIcon && !loading && <span className="mr-2 flex items-center">{leftIcon}</span>}
        {props.children}
      </Component>
    );
  }
);
Button.displayName = "Button";
