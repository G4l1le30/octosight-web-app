"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const processingSteps = [
  "Scanning evidence for indicators...",
  "Verifying metadata with CIMB Core...",
  "Analyzing language patterns with AI...",
  "Cross-referencing Global Blacklist...",
  "Finalizing security assessment...",
];

export const ProcessingAnimation: React.FC<{ title?: string }> = ({ title = "Processing Security Report" }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < processingSteps.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-10 animate-in fade-in duration-500">
      {/* Sleek Enterprise Loader */}
      <div className="relative size-16 flex items-center justify-center">
        <Loader2 className="size-10 text-primary animate-spin" strokeWidth={2} />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-secondary tracking-tight">{title}</h2>
        <p className="text-sm text-secondary/60 font-medium tracking-wide">
          {processingSteps[step]}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs h-1 bg-neutral-border/50 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${((step + 1) / processingSteps.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

