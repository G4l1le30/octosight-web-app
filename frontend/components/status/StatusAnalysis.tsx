import React from "react";
import { Ticket } from "@/types/ticket";
import { ShieldCheck, Info, ShieldAlert, Shield, ExternalLink } from "lucide-react";

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

  const rawMlPrediction = result.flags?.split("ml_prediction:")[1]?.split(",")[0] ?? null;
  const normalizedMlPrediction = rawMlPrediction === "ham"
    ? "not phishing"
    : rawMlPrediction?.replace(/_/g, " ") ?? null;

  const vtAnalysis = details.virustotal_analysis || [];

  return (
    <div className="space-y-4 md:space-y-6 pt-1.5 md:pt-2">
      {/* Hybrid Score Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="text-xs md:text-sm font-bold text-secondary tracking-wide">
            Hybrid Score Breakdown
          </h3>
          {result.flags?.includes("BLACKLISTED") && (
            <span className="px-2 md:px-2.5 py-0.5 md:py-1 rounded-sm md:rounded-md bg-secondary text-white text-xs font-bold tracking-wide">
              Blacklist
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          <div className="bg-neutral-page/50 p-3 md:p-4 rounded-lg md:rounded-xl border border-neutral-border/50">
            <div className="flex justify-between text-xs md:text-sm font-bold text-secondary mb-1.5 md:mb-2">
              <span>Rule-based ({ruleWeight}%)</span>
              <span>{Number(result.rule_score)} / 100</span>
            </div>
            <div className="w-full bg-neutral-border/60 rounded-full h-1.5 md:h-2 overflow-hidden">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-1000"
                style={{ width: `${result.rule_score}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-neutral-page/50 p-3 md:p-4 rounded-lg md:rounded-xl border border-neutral-border/50">
            <div className="flex justify-between text-xs md:text-sm font-bold text-secondary mb-1.5 md:mb-2">
              <span>ML Engine ({mlWeight}%)</span>
              <span>{Number(result.ml_score)} / 100</span>
            </div>
            <div className="w-full bg-neutral-border/60 rounded-full h-1.5 md:h-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-1000"
                style={{ width: `${result.ml_score}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2 md:mt-2.5">
              {normalizedMlPrediction && (
                <p className="text-xs font-bold text-secondary">
                  ML prediction:{" "}
                  <span className="text-secondary/80">
                    {normalizedMlPrediction}
                  </span>
                </p>
              )}
              {isScamOverride && (
                <p className="text-xs text-secondary font-bold">
                  Context Optimized
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VirusTotal Analysis (External Attachment) */}
      {vtAnalysis.length > 0 && (
        <div className="bg-neutral-page/30 p-4 md:p-6 rounded-lg md:rounded-xl border border-neutral-border shadow-sm animate-in fade-in slide-in-from-right-4 duration-700">
          <h3 className="text-sm md:text-base font-bold text-secondary mb-4 md:mb-5 flex items-center gap-1.5 md:gap-2">
            <Shield className="size-5 text-secondary" />
            External Attachment
          </h3>
          
          <div className="space-y-3">
            {vtAnalysis.map((item: any, idx: number) => {
              const malicious = item.report?.malicious || 0;
              const suspicious = item.report?.suspicious || 0;
              
              let statusColor = "text-green-600";
              let statusText = "Clean / Safe";
              let accentColor = "bg-green-500";
              let Icon = ShieldCheck;

              if (malicious > 10) {
                statusColor = "text-risk-high";
                statusText = "Threat Detected";
                accentColor = "bg-risk-high";
                Icon = ShieldAlert;
              } else if (malicious > 0 || suspicious > 0) {
                statusColor = "text-risk-medium";
                statusText = "Potential Risk";
                accentColor = "bg-risk-medium";
                Icon = ShieldAlert;
              }

              return (
                <div key={idx} className="bg-white border border-neutral-border rounded-lg md:rounded-xl p-3 md:p-4 transition-all hover:shadow-md group relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${accentColor} opacity-70`} />
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${statusColor}`}>
                        <Icon className="size-4 md:size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-bold text-secondary truncate max-w-[180px] sm:max-w-[300px]" title={item.filename}>
                          {item.filename}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] md:text-xs font-bold ${statusColor}`}>
                            {statusText}
                          </span>
                          <span className="text-[10px] md:text-xs font-bold text-secondary/40">
                            {malicious} mal • {suspicious} susp
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {item.report?.vt_link && (
                      <a 
                        href={item.report.vt_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 text-secondary/40 hover:text-primary transition-colors"
                        title="View Analysis on VirusTotal"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <p className="mt-4 text-[10px] md:text-xs text-secondary/80 font-medium">
            * VirusTotal analysis is based on global antivirus vendor signatures. 1-10 detections may indicate a false positive or new threat.
          </p>
        </div>
      )}

      {/* Scenario Analysis Result */}
      {details.detected_scam_type && details.detected_scam_type !== "General Phishing" && (
        <div className="bg-neutral-page/30 rounded-xl md:rounded-2xl p-4 md:p-6 border border-neutral-border animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-white rounded-lg md:rounded-xl shadow-sm text-secondary">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-secondary/60 tracking-wide leading-tight">
                Fraud Scenario Analysis
              </h3>
              <p className="text-sm md:text-base font-bold text-secondary">
                {details.detected_scam_type}
              </p>
            </div>
          </div>

          {details.transaction_validation && details.transaction_validation !== "N/A" && (
            <div className="bg-white/80 p-3 md:p-4 rounded-lg md:rounded-xl border border-neutral-border/50">
              <p className="text-xs md:text-sm font-bold text-secondary/80 leading-relaxed">
                {'"' + details.transaction_validation + '"'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Analysis Detail */}
      <div className="bg-neutral-page/30 p-4 md:p-6 rounded-lg md:rounded-xl border border-neutral-border shadow-sm">
        <h3 className="text-sm md:text-base font-bold text-secondary mb-4 md:mb-5 flex items-center gap-1.5 md:gap-2">
          <Info className="size-5 text-secondary" />
          Analysis Detail
        </h3>
        <ul className="text-xs md:text-sm space-y-1.5 md:space-y-2 font-bold opacity-90">
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
          <li className="flex justify-between items-center pt-1.5 md:pt-2">
            <span className="text-secondary">OCR Evidence Analysis:</span>
            <span className={details.ocr === "Complete" ? "text-green-600" : ""}>
              {details.ocr}
            </span>
          </li>
          <li className="flex justify-between items-center pt-1.5 md:pt-2">
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
        </ul>
      </div>

      {result.investigation_notes && (
        <div className="bg-neutral-page/30 p-4 md:p-6 rounded-lg md:rounded-xl border border-neutral-border shadow-sm">
          <h3 className="text-xs md:text-sm font-bold text-secondary mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 md:h-4 w-3 md:w-4 text-secondary"
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
          <div className="max-h-32 md:max-h-40 overflow-y-auto pr-1.5 md:pr-2 custom-scrollbar">
            <p className="text-xs md:text-sm font-medium text-secondary leading-relaxed">
              {'"' + result.investigation_notes + '"'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

