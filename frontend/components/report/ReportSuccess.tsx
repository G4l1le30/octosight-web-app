"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Copy, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Ticket } from "@/types/ticket";

interface ReportSuccessProps {
  ticketData: Ticket;
  onReset: () => void;
}

export default function ReportSuccess({
  ticketData,
  onReset,
}: ReportSuccessProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ticketData.ticket_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 sm:px-6 md:px-8 animate-in fade-in zoom-in duration-500">
      {/* Main Success Card */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-neutral-border flex flex-col items-center p-8 sm:p-10 md:p-12 relative overflow-hidden">
        {/* Success Icon Group */}
        <div className="mb-8 relative">
          <div className="size-24 rounded-full bg-green-50 flex items-center justify-center">
            <div className="size-16 rounded-full bg-green-600 flex items-center justify-center shadow-lg shadow-green-600/20">
              <Check className="size-8 text-white" strokeWidth={4} />
            </div>
          </div>
        </div>

        {/* Header Text */}
        <div className="text-center space-y-4 mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary">
            Report Submitted Successfully!
          </h1>
          <p className="text-secondary/70 text-base md:text-lg max-w-[480px] mx-auto leading-relaxed font-medium">
            Our team will review your report within 24 hours. You will receive a
            notification if there's a status update.
          </p>
        </div>

        {/* Ticket Reference Card */}
        <div className="w-full border-2 border-neutral-border rounded-3xl p-6 md:p-8 mb-10 relative group">
          <p className="text-md font-bold text-secondary/60 mb-4 text-center">
            Ticket Reference
          </p>
          <div className="relative flex flex-col items-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4 w-full">
              <h2 className="text-lg md:text-xl font-semibold text-secondary text-center">
                Ticket ID:
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl md:text-2xl font-bold text-primary break-all">
                  {ticketData.ticket_id}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2.5 bg-white hover:bg-neutral-page border border-neutral-border rounded-xl transition-all group/copy cursor-pointer shrink-0 shadow-sm"
                  title="Copy Ticket ID"
                >
                  {copied ? (
                    <CheckCircle2 className="size-5 text-green-600" />
                  ) : (
                    <Copy className="size-5 text-secondary/40 group-hover/copy:text-secondary" />
                  )}
                </button>
              </div>
            </div>

            {/* Copy Success Label */}
            <div
              className={`absolute -bottom-14 left-1/2 -translate-x-1/2 transition-all duration-300 ${copied ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
            >
              <span className="text-green-600 text-xs font-bold flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full whitespace-nowrap shadow-sm border border-green-200">
                <Check className="size-3" strokeWidth={3} />
                ID copied successfully
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-lg">
          <Button
            size="md"
            className="flex-1 text-base shadow-xl shadow-primary/10 transition-all active:scale-[0.98]"
            onClick={() => router.push(`/report/${ticketData.ticket_id}`)}
          >
            View Report Status
          </Button>
          <Button
            variant="outline"
            size="md"
            className="flex-1 text-base border-neutral-border text-secondary hover:bg-neutral-page transition-all active:scale-[0.98]"
            onClick={onReset}
          >
            Report Another Incident
          </Button>
        </div>

        {/* Footer Divider */}
        <div className="w-full h-px bg-neutral-border my-10" />

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          <div className="flex items-center gap-2 text-secondary/60 font-semibold text-sm">
            <Lock className="size-4 text-green-600" />
            <span>AES-256 Encryption</span>
          </div>
          <div className="flex items-center gap-2 text-secondary/60 font-semibold text-sm">
            <ShieldCheck className="size-4 text-green-600" />
            <span>Secure Submission</span>
          </div>
        </div>
      </div>
    </div>
  );
}
