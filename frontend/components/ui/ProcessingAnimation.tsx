"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Zap, Search, Database, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";

const processingSteps = [
  { text: "Scanning evidence for indicators...", icon: Search, color: "text-blue-500" },
  { text: "Verifying metadata with CIMB Core...", icon: Database, color: "text-primary" },
  { text: "Analyzing language patterns with AI...", icon: Zap, color: "text-amber-500" },
  { text: "Cross-referencing Global Blacklist...", icon: Fingerprint, color: "text-red-500" },
  { text: "Finalizing security assessment...", icon: ShieldCheck, color: "text-green-500" },
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
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in duration-700">
      {/* Central Pulsing Shield */}
      <div className="relative size-32 flex items-center justify-center">
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
        <div className="absolute inset-2 bg-primary/10 rounded-full animate-pulse" />
        <div className="relative z-10 bg-white p-6 rounded-3xl shadow-xl border border-primary/20 transform hover:scale-110 transition-transform duration-500">
          <ShieldAlert className="size-16 text-primary animate-bounce" />
        </div>
        
        {/* Orbital Icons */}
        <div className="absolute inset-0 animate-spin-slow">
            <Zap className="absolute -top-4 left-1/2 -translate-x-1/2 size-6 text-amber-400 opacity-60" />
            <Search className="absolute -bottom-4 left-1/2 -translate-x-1/2 size-6 text-blue-400 opacity-60" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-secondary tracking-tight">{title}</h2>
        <p className="text-sm font-bold text-secondary/40 uppercase tracking-widest">OctoSight Security protocols active</p>
      </div>

      {/* Steps List */}
      <div className="w-full max-w-xs space-y-3">
        {processingSteps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isCompleted = i < step;

          return (
            <div 
              key={i} 
              className={cn(
                "flex items-center gap-4 p-3 rounded-2xl border transition-all duration-500",
                isActive ? "bg-white border-primary shadow-md scale-105 translate-x-2" : 
                isCompleted ? "bg-green-50/50 border-green-100 opacity-50" : 
                "bg-transparent border-transparent opacity-20"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                isActive ? "bg-primary text-white animate-pulse" : 
                isCompleted ? "bg-green-500 text-white" : "bg-neutral-page text-secondary/40"
              )}>
                <Icon className="size-4" />
              </div>
              <span className={cn(
                "text-sm font-black text-left",
                isActive ? "text-secondary" : isCompleted ? "text-green-700" : "text-secondary/40"
              )}>
                {s.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-sm h-1.5 bg-neutral-border rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(var(--color-primary),0.5)]"
          style={{ width: `${((step + 1) / processingSteps.length) * 100}%` }}
        />
      </div>
    </div>
  );
};
