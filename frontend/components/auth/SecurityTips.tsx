"use client";

import React, { useState, useEffect } from "react";
import { Shield } from "lucide-react";

const tips = [
  "Confirm unusual requests through official channels",
  "Scammers often create urgency to make you act without thinking",
  "Legitimate banks never ask for your OTP or password via email",
  "Check the sender address carefully — one character makes all the difference",
  "Hover over links before clicking to see the real destination URL",
  "Enable two-factor authentication on all your important accounts",
  "Always verify unexpected requests by calling the company directly",
  "Never share your PIN, password, or OTP with anyone, even if they claim to be from your bank",
];

export const SecurityTips: React.FC = () => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-start gap-2 md:gap-2.5 p-2.5 md:p-3 rounded-lg md:rounded-xl bg-primary/5 border border-primary/10 max-w-md mx-auto mt-3 md:mt-4 animate-fadeIn">
      <Shield className="size-3.5 md:size-4 text-primary shrink-0 mt-0.5" />
      <p className="text-[11px] md:text-xs text-secondary/70 leading-relaxed">
        {tips[tipIndex]}
      </p>
    </div>
  );
};
