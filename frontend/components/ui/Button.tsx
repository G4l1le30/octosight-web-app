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
  outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  danger: "bg-destructive text-white hover:bg-destructive/90",
  google: "bg-[#4285F4] text-white hover:bg-[#3367D6]",
};

const sizeVariants = {
  sm: "h-9 px-3",
  md: "h-10 px-4",
    lg: "px-5 py-2 md:py-4",
  
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading = false, asChild = false, size = "md", leftIcon, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
          variants[variant as keyof typeof variants],
          sizeVariants[size],
          loading && "opacity-50 cursor-wait",
          className
        )}
        disabled={props.disabled || loading}
        ref={ref}
        {...props}
      >
        {leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}
        {props.children}
      </Component>
    );
  }
);
Button.displayName = "Button";
