import React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="text-sm font-bold text-secondary block">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full bg-white border-2 border-neutral-border rounded-lg outline-none transition-all font-medium placeholder:text-secondary/30",
            "focus:border-primary focus:ring-4 focus:ring-primary/5",
            error ? "border-risk-high focus:border-risk-high focus:ring-risk-high/5" : "border-neutral-border",
            "p-4 min-h-[120px] resize-none",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-bold text-risk-high mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
