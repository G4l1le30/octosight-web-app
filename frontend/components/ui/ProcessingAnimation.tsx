"use client";

import React, { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const processingSteps = [
  "Scanning evidence for indicators...",
  "Verifying metadata with CIMB Core...",
  "Analyzing language patterns with AI...",
  "Cross-referencing Global Blacklist...",
  "Finalizing security assessment...",
];

const loadingTips = [
  "Always verify the sender before sharing sensitive details.",
  "Never click links in unexpected messages.",
  "Check the URL carefully for misspellings.",
  "Banks never ask for passwords by message.",
  "Use unique passwords for different accounts.",
  "Report suspicious activity to your bank immediately.",
  "Avoid sharing OTP codes with anyone.",
  "Secure your device with a screen lock.",
  "Review messages for urgency or pressure tactics.",
  "Confirm unusual requests through official channels.",
];

export const ProcessingAnimation: React.FC<{
  title?: string;
  onCancel?: () => void;
}> = ({ title = "Processing Security Report", onCancel }) => {
  const [step, setStep] = useState(0);
  const [tip] = useState(
    () => loadingTips[Math.floor(Math.random() * loadingTips.length)],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < processingSteps.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center p-12 text-center space-y-10 animate-in fade-in duration-500">
      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-0 right-0 p-2 rounded-full text-secondary/60 hover:text-secondary hover:bg-neutral-border/30 transition-colors"
          aria-label="Cancel"
        >
          <X className="size-5" />
        </button>
      )}
      {/* Sleek Enterprise Loader */}
      <div className="relative size-16 flex items-center justify-center">
        <Loader2
          className="size-10 text-primary animate-spin"
          strokeWidth={2}
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg md:text-xl font-bold text-secondary tracking-tight">
          {title}
        </h2>
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
      <p className="text-xs text-secondary/50 italic tracking-wide max-w-xs">
        Tip: {tip}
      </p>
    </div>
  );
};
