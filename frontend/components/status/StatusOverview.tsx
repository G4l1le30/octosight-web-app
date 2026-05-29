import React from "react";
import { Ticket } from "@/types/ticket";
import { CreditCard, Hash, Flag } from "lucide-react";

interface StatusOverviewProps {
  result: Ticket;
}

export const StatusOverview: React.FC<StatusOverviewProps> = ({ result }) => {
  const flags: string[] = React.useMemo(() => {
    if (!result.flags) return [];
    return result.flags.split(",").map((f) => f.trim());
  }, [result.flags]);

  return (
    <div className="space-y-8">
      {/* Risk Score */}
      <div>
        <p className="text-sm font-bold text-secondary tracking-wide">
          Automated Risk Score
        </p>
        <div className="flex items-center gap-3 md:gap-4 mt-2">
          <span
            className={`text-3xl md:text-4xl font-bold ${result.risk_score >= 70 ? "text-risk-high" : result.risk_score >= 40 ? "text-risk-medium" : "text-risk-low"}`}
          >
            {Number(result.risk_score)}
            <span className="text-xl md:text-2xl text-secondary/40">/100</span>
          </span>
          <div className="flex-1 h-3 bg-neutral-border/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${result.risk_score}%`,
                backgroundColor:
                  result.risk_score >= 70
                    ? "#e31e24"
                    : result.risk_score >= 40
                      ? "#f97316"
                      : "#00a651",
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Basic Details */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-bold text-secondary tracking-wide">
            Incident Type
          </p>
          <p className="text-base md:text-lg font-bold">{result.type}</p>
        </div>
        {result.url && (
          <div>
            <p className="text-sm font-bold text-secondary tracking-wide">
              Target URL
            </p>
            <p className="text-base font-bold break-all opacity-90">
              {result.url}
            </p>
          </div>
        )}
        {result.sender_numbers && (
          <div>
            <p className="text-sm font-bold text-secondary tracking-wide">
              Reported Sender
            </p>
            <p className="text-base font-bold truncate">
              {result.sender_numbers}
            </p>
          </div>
        )}
      </div>

      {/* Advanced Bank Details */}
      {result.bank_account && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 p-4 md:p-5 bg-neutral-page/50 rounded-2xl border border-neutral-border/50">
          <div className="min-w-0">
            <p className="text-xs font-bold text-secondary tracking-wide mb-1 flex items-center gap-1">
              <CreditCard className="size-4" />
              Reported Bank
            </p>
            <p className="text-base font-bold truncate">
              {result.bank_name || "CIMB NIAGA"}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-secondary tracking-wide mb-1 flex items-center gap-1">
              <Hash className="size-4" />
              Account Number
            </p>
            <p className="text-base font-bold truncate">
              {result.bank_account}
            </p>
          </div>
          {result.reference_number && (
            <div className="sm:col-span-2 min-w-0 pt-3 border-t border-neutral-border/50">
              <p className="text-xs font-bold text-secondary tracking-wide mb-1">
                Transaction Reference
              </p>
              <p className="text-base font-bold truncate">
                {result.reference_number}
              </p>
            </div>
          )}
        </div>
      )}

      {/* User Summary */}
      <div>
        <p className="text-sm font-bold text-secondary tracking-wide mb-2">
          User Summary
        </p>
        <div className="bg-neutral-page/30 p-4 rounded-xl border border-neutral-border/50">
          <p className="text-sm font-semibold text-secondary/80 leading-relaxed whitespace-pre-wrap">
            {'"' + (result.summary || "No summary provided.") + '"'}
          </p>
        </div>
      </div>

      {/* Extracted OCR Text */}
      {result.extracted_text && (
        <div>
          <p className="text-sm font-bold text-secondary tracking-wide mb-2">
            Extracted Text Evidence (OCR)
          </p>
          <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar bg-neutral-page/30 p-4 rounded-xl border border-neutral-border/50">
            <p className="text-sm font-semibold text-secondary/80 leading-relaxed whitespace-pre-wrap">
              {result.extracted_text}
            </p>
          </div>
        </div>
      )}

      {/* Detection Engine Flags */}
      {flags.length > 0 && (
        <div>
          <p className="text-sm font-bold text-secondary mb-2 flex items-center gap-1.5">
            Detection Engine Flags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {flags.map((flag, i) => (
              <span
                key={i}
                className="bg-secondary text-white text-xs font-bold px-3 py-1.5 rounded-full"
              >
                {flag.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
