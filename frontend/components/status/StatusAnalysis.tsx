import React from "react";
import { Ticket } from "@/types/ticket";
import { ShieldCheck, Info } from "lucide-react";

interface StatusAnalysisProps {
  result: Ticket;
}

export const StatusAnalysis: React.FC<StatusAnalysisProps> = ({ result }) => {
  let ruleWeight = 35;
  let mlWeight = 65;
  let isScamOverride = false;
  let details: any = {
    typosquatting: "Safe",
    keywords: "Clean",
    attachments: result.attachment_paths ? "Detected" : "Clean",
    ocr: result.extracted_text ? "Complete" : "N/A",
  };

  try {
    if (result.analysis_results) {
      const parsed = JSON.parse(result.analysis_results);
      details = { ...details, ...parsed };
      if (parsed.hybrid_scoring) {
        ruleWeight = parsed.hybrid_scoring.rule_weight ?? 35;
        mlWeight = parsed.hybrid_scoring.ml_weight ?? 65;
        if (ruleWeight === 100 || ruleWeight === 0) isScamOverride = true;
      }
    }
  } catch (e) {
    console.error("Failed to parse analysis results", e);
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Hybrid Score Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-secondary tracking-wide">
            Hybrid Score Breakdown
          </h3>
          {result.flags?.includes("BLACKLISTED") && (
            <span className="px-2.5 py-1 rounded-md bg-secondary text-white text-xs font-bold tracking-wide">
              Blacklist
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-neutral-page/50 p-4 rounded-xl border border-neutral-border/50">
            <div className="flex justify-between text-sm font-bold text-secondary mb-2">
              <span>Rule-based ({ruleWeight}%)</span>
              <span>{Number(result.rule_score)} / 100</span>
            </div>
            <div className="w-full bg-neutral-border/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-1000"
                style={{ width: `${result.rule_score}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-neutral-page/50 p-4 rounded-xl border border-neutral-border/50">
            <div className="flex justify-between text-sm font-bold text-secondary mb-2">
              <span>ML Engine ({mlWeight}%)</span>
              <span>{Number(result.ml_score)} / 100</span>
            </div>
            <div className="w-full bg-neutral-border/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-1000"
                style={{ width: `${result.ml_score}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2.5">
              {result.flags?.includes("ml_prediction:") && (
                <p className="text-xs font-bold text-secondary">
                  Prediction:{" "}
                  <span className="text-secondary/80">
                    {result.flags.split("ml_prediction:")[1].split(",")[0]}
                  </span>
                </p>
              )}
              {isScamOverride && (
                <p className="text-[10px] text-primary/60 font-bold">
                  Context Optimized
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Analysis Result */}
      {details.detected_scam_type && details.detected_scam_type !== "General Phishing" && (
        <div className="bg-neutral-page/30 rounded-2xl p-6 border border-neutral-border animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm text-secondary">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-secondary/60 tracking-wide leading-tight">
                Fraud Scenario Analysis
              </h3>
              <p className="text-base font-bold text-secondary">
                {details.detected_scam_type}
              </p>
            </div>
          </div>

          {details.transaction_validation && details.transaction_validation !== "N/A" && (
            <div className="bg-white/80 p-4 rounded-xl border border-neutral-border/50">
              <p className="text-sm font-bold text-secondary/80 leading-relaxed">
                {'"' + details.transaction_validation + '"'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Analysis Detail */}
      <div className="bg-neutral-page/30 p-6 rounded-xl border border-neutral-border shadow-sm">
        <h3 className="text-base font-bold text-secondary mb-5 flex items-center gap-2">
          <Info className="size-5 text-secondary" />
          Analysis Detail
        </h3>
        <ul className="text-sm space-y-2 font-bold opacity-90">
          <li className="flex justify-between items-center">
            <span className="text-secondary">Typosquatting Rules:</span>
            <span
              className={
                details.typosquatting !== "Safe" &&
                  details.typosquatting !== "Verified Domain"
                  ? "text-risk-high"
                  : "text-green-600"
              }
            >
              {details.typosquatting}
            </span>
          </li>
          <li className="flex justify-between items-center pt-2">
            <span className="text-secondary">OCR Evidence Analysis:</span>
            <span className={details.ocr === "Complete" ? "text-green-600" : ""}>
              {details.ocr}
            </span>
          </li>
          <li className="flex justify-between items-center pt-2">
            <span className="text-secondary">Keyword Analysis:</span>
            <span
              className={
                details.keywords !== "Clean"
                  ? "text-risk-high"
                  : "text-green-600"
              }
            >
              {details.keywords}
            </span>
          </li>
          <li className="flex justify-between items-center pt-2">
            <span className="text-secondary">Malicious Attachment:</span>
            <span
              className={
                details.attachments !== "Clean"
                  ? "text-risk-high"
                  : "text-green-600"
              }
            >
              {details.attachments}
            </span>
          </li>
        </ul>
      </div>

      {result.investigation_notes && (
        <div className="bg-neutral-page/30 p-6 rounded-xl border border-neutral-border shadow-sm">
          <h3 className="text-sm font-bold text-secondary mb-3 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-secondary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Investigation Notes
          </h3>
          <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-sm font-medium text-secondary leading-relaxed">
              {'"' + result.investigation_notes + '"'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
