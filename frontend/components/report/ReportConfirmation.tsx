"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import {
  MessageSquare,
  Link as LinkIcon,
  Calendar,
  Info,
  Send,
  AlertTriangle,
  Mail,
  Globe,
  Loader2,
  User,
  FileText,
  CreditCard,
  Hash,
  ShieldCheck,
  Flag,
  Brain,
} from "lucide-react";
import { RiskScoreCard } from "./RiskScoreCard";
import { ReportFormData } from "@/types/ticket";

interface ReportConfirmationProps {
  formData: ReportFormData;
  analysisResult: {
    score: number;
    priority: string;
    rule_score?: number;
    ml_score?: number;
    rule_weight?: number;
    ml_weight?: number;
    ml_category?: string;
    flags?: string[];
    extracted_ocr_text?: string;
    is_blacklisted?: boolean;
    details?: {
      detected_scam_type?: string;
      transaction_validation?: string;
    };
  } | null;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

const REPORT_TYPE_LABELS: Record<
  string,
  { label: string; icon: any; identifierLabel: string }
> = {
  SMS: { label: "SMS Message", icon: MessageSquare, identifierLabel: "Sender" },
  WhatsApp: {
    label: "WhatsApp Message",
    icon: MessageSquare,
    identifierLabel: "Sender",
  },
  Email: {
    label: "Phishing Email",
    icon: Mail,
    identifierLabel: "Sender Email",
  },
  Website: { label: "Fake Website", icon: Globe, identifierLabel: "URL" },
};

const getRiskStatus = (score: number): string => {
  if (score >= 70) return "High Risk";
  if (score >= 40) return "Medium Risk";
  return "Low Risk";
};

export const ReportConfirmation = ({
  formData,
  analysisResult,
  onBack,
  onSubmit,
  isSubmitting,
}: ReportConfirmationProps) => {
  const [aiExplanation, setAiExplanation] = React.useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = React.useState(false);
  const explanationFetchedRef = React.useRef(false);

  React.useEffect(() => {
    if (!analysisResult || explanationFetchedRef.current) return;
    explanationFetchedRef.current = true;
    const fetchExplanation = async () => {
      setExplanationLoading(true);
      try {
        const res = await fetch("/api/analyze/explain", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            report_type: formData.type,
            url: formData.url || "",
            summary: formData.summary || "",
            score: analysisResult.score,
            priority: analysisResult.priority,
            ml_category: analysisResult.ml_category,
            flags: analysisResult.flags ?? [],
            detected_scam_type: analysisResult.details?.detected_scam_type,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setAiExplanation(data.explanation);
        }
      } catch {
        // Non-critical — explanation is purely cosmetic
      } finally {
        setExplanationLoading(false);
      }
    };
    fetchExplanation();
  }, [analysisResult, formData.type, formData.url, formData.summary]);

  const initialRiskScore = analysisResult?.score || 0;
  const initialRiskStatus = analysisResult?.priority
    ? `${analysisResult.priority} Risk`
    : "Low Risk";
  const isScanning = false;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      const datePart = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const timePart = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${datePart} at ${timePart}`;
    } catch {
      return dateStr;
    }
  };

  const isScamScenario =
    analysisResult?.details?.detected_scam_type &&
    analysisResult.details.detected_scam_type !== "General Phishing";
  const isNoUrlScam = !formData.url?.trim() && isScamScenario;

  const flags = analysisResult?.flags ?? [];

  const typeConfig = REPORT_TYPE_LABELS[formData.type] || {
    label: formData.type || "Laporan",
    icon: AlertTriangle,
    identifierLabel: "Detail",
  };
  const TypeIcon = typeConfig.icon;

  const getIdentifierValue = () => {
    if (formData.type === "Website") return formData.url;
    return formData.senderNumbers || formData.url || "-";
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 md:mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-secondary">
          Report Phishing Incident
        </h1>
        <p className="text-secondary opacity-70 font-medium">
          Help us protect the community by reporting suspicious activities.
        </p>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl border border-neutral-border shadow-xl overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-start">
            {/* Left Side: Summary Details */}
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-secondary mb-6 md:mb-8">
                Review Your Report
              </h2>
              {/* Report Type */}
              <div className="flex items-center gap-4 md:gap-5">
                <div className="p-3 md:p-3.5 rounded-xl md:rounded-2xl bg-primary/5 text-primary">
                  <TypeIcon className="size-6" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-secondary/60 mb-0.5 md:mb-1">
                    Report Type
                  </p>
                  <p className="text-base md:text-lg font-semibold text-secondary">
                    {typeConfig.label}
                  </p>
                </div>
              </div>

              {/* Sender Info */}
              {formData.senderNumbers && (
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="p-3 md:p-3.5 rounded-xl md:rounded-2xl bg-primary/5 text-primary">
                    <User className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-secondary/60 mb-0.5 md:mb-1">
                      {formData.type === "Email"
                        ? "Sender Email"
                        : "Sender Number"}
                    </p>
                    <p className="text-base md:text-lg font-semibold text-secondary truncate">
                      {formData.senderNumbers}
                    </p>
                  </div>
                </div>
              )}

              {/* URL */}
              {formData.url && (
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="p-3 md:p-3.5 rounded-xl md:rounded-2xl bg-primary/5 text-primary">
                    <LinkIcon className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-secondary/60 mb-0.5 md:mb-1">
                      Suspicious URL
                    </p>
                    <p className="text-base md:text-lg font-semibold text-secondary truncate">
                      {formData.url}
                    </p>
                  </div>
                </div>
              )}

              {/* Bank Info (If present) */}
              {formData.bankAccount && (
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="p-3 md:p-3.5 rounded-xl md:rounded-2xl bg-primary/5 text-primary">
                    <CreditCard className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-secondary/60 mb-0.5 md:mb-1">
                      {formData.bankName || "Reported Bank Account"}
                    </p>
                    <p className="text-base md:text-lg font-semibold text-secondary truncate">
                      {formData.bankAccount}
                    </p>
                  </div>
                </div>
              )}

              {/* Reference Number (If present) */}
              {formData.referenceNumber && (
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="p-3 md:p-3.5 rounded-xl md:rounded-2xl bg-primary/5 text-primary">
                    <Hash className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-secondary/60 mb-0.5 md:mb-1">
                      Reference Number
                    </p>
                    <p className="text-base md:text-lg font-semibold text-secondary truncate">
                      {formData.referenceNumber}
                    </p>
                  </div>
                </div>
              )}

              {/* Incident Time */}
              <div className="flex items-center gap-4 md:gap-5">
                <div className="p-3 md:p-3.5 rounded-xl md:rounded-2xl bg-primary/5 text-primary">
                  <Calendar className="size-6" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-secondary/60 mb-0.5 md:mb-1">
                    Incident Time
                  </p>
                  <p className="text-base md:text-lg font-semibold text-secondary">
                    {formatDate(formData.incidentDate)}
                  </p>
                </div>
              </div>

              {/* Detection Engine Flags */}
              {flags.length > 0 && (
                <div className="flex items-start gap-4 md:gap-5">
                  <div className="p-3 md:p-3.5 rounded-xl md:rounded-2xl bg-primary/5 text-primary shrink-0">
                    <Flag className="size-6" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-secondary/60 mb-1.5 md:mb-2">
                      Detection Engine Flags
                    </p>
                    <div className="flex flex-wrap gap-1 md:gap-1.5">
                      {flags.slice(0, 3).map((flag, i) => (
                        <span
                          key={i}
                          className="bg-secondary text-white text-xs font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-full"
                        >
                          {flag.toLowerCase().replace(/_/g, " ")}
                        </span>
                      ))}
                      {flags.length > 3 && (
                        <span className="bg-secondary text-white text-xs font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                          +{flags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Risk Score Card */}
            {isScanning ? (
              <div className="bg-neutral-page rounded-2xl md:rounded-3xl p-6 md:p-8 border-2 border-dashed border-neutral-border flex flex-col items-center justify-center text-center h-full min-h-[200px] md:min-h-[260px] gap-3 md:gap-4">
                <Loader2 className="size-12 animate-spin text-primary" />
                <p className="text-xs md:text-sm font-semibold text-secondary/60 animate-pulse">
                  Analyzing potential risks...
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 md:gap-4">
                <RiskScoreCard
                  score={initialRiskScore}
                  status={initialRiskStatus}
                />

                {/* Hybrid Score Breakdown */}
                {analysisResult?.ml_score !== undefined && (
                  <div className="bg-transparent rounded-xl md:rounded-2xl p-3 md:p-4 border border-neutral-border">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <h3 className="text-xs md:text-sm font-bold text-secondary">
                        {isNoUrlScam
                          ? "Scam Analysis Weights"
                          : "Hybrid Score Breakdown"}
                      </h3>
                      {analysisResult?.is_blacklisted && (
                        <span className="px-1.5 md:px-2 py-0.5 rounded-sm md:rounded-md bg-secondary text-white text-xs font-bold tracking-wide">
                          Blacklist
                        </span>
                      )}
                    </div>
                    <div className="space-y-3 md:space-y-4">
                      {analysisResult.rule_score !== undefined && (
                        <div>
                          <div className="flex justify-between text-xs md:text-sm font-semibold mb-1 md:mb-1.5">
                            <span className="text-secondary/70">
                              Rule-based ({analysisResult.rule_weight ?? 35}%)
                            </span>
                            <span className="text-secondary">
                              {Number(analysisResult.rule_score).toLocaleString(
                                "en-US",
                                { maximumFractionDigits: 2 },
                              )}{" "}
                              / 100
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                            <div
                              className="bg-secondary h-1.5 md:h-2 rounded-full"
                              style={{ width: `${analysisResult.rule_score}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="flex justify-between text-xs md:text-sm font-semibold mb-1 md:mb-1.5">
                          <span className="text-secondary/70">
                            ML Engine ({analysisResult.ml_weight ?? 65}%)
                          </span>
                          <span className="text-secondary">
                            {Number(analysisResult.ml_score).toLocaleString(
                              "en-US",
                              { maximumFractionDigits: 2 },
                            )}{" "}
                            / 100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                          <div
                            className="bg-primary h-1.5 md:h-2 rounded-full"
                            style={{ width: `${analysisResult.ml_score}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center mt-1 md:mt-1.5">
                          {analysisResult.ml_category && (
                            <p className="text-xs text-secondary/60 font-medium">
                              Prediction:{" "}
                              <span className="text-secondary">
                                {analysisResult.ml_category}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      {isNoUrlScam && (
                        <div className="pt-1.5 md:pt-2 mt-1.5 md:mt-2 border-t border-dashed border-neutral-border">
                          <p className="text-xs text-secondary/60 font-medium leading-tight">
                            *Rule-based detection is prioritized (100%) for
                            social engineering scams without URLs. Phishing AI
                            remains as language context.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Specific Scam Analysis Result */}
                {analysisResult?.details?.detected_scam_type && (
                  <div className="bg-transparent rounded-xl md:rounded-2xl p-3 md:p-4 border border-neutral-border">
                    <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                      <ShieldCheck className="size-4 text-secondary" />
                      <h3 className="text-xs md:text-sm font-bold text-secondary tracking-wide">
                        Scenario Analysis
                      </h3>
                    </div>
                    <p className="text-xs md:text-sm font-semibold text-secondary">
                      Detected:{" "}
                      <span className="text-secondary">
                        {analysisResult.details.detected_scam_type}
                      </span>
                    </p>
                    {analysisResult.details.transaction_validation !==
                      "N/A" && (
                      <p className="text-xs text-secondary/70 mt-0.5 md:mt-1">
                        {analysisResult.details.transaction_validation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Analysis — full width */}
          {(aiExplanation || explanationLoading) && (
            <div className="mt-3 md:mt-4 rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-neutral-border">
              <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                <Brain className="size-4 text-secondary" />
                <h3 className="text-xs md:text-sm font-bold text-secondary tracking-wide">
                  AI Analysis
                </h3>
              </div>
              {explanationLoading ? (
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-secondary/60">
                  <Loader2 className="size-4 animate-spin" />
                  Generating explanation...
                </div>
              ) : (
                <p className="text-xs md:text-sm font-medium text-secondary leading-relaxed">
                  {aiExplanation}
                </p>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="my-8 md:my-10 h-px bg-neutral-border" />

          {/* Disclaimer Section */}
          <div className="flex items-start gap-3 md:gap-4 px-1.5 md:px-2 mb-8 md:mb-12">
            <div className="shrink-0 mt-0.5">
              <Info className="size-5 text-primary" />
            </div>
            <p className="text-secondary/60 text-xs md:text-sm leading-relaxed font-medium">
              By submitting this report, I confirm the information is accurate
              and understand it will be used by OctoSight for phishing security
              review.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 max-w-2xl mx-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full text-base md:text-lg"
              onClick={onBack}
            >
              Back to Previous Step
            </Button>
            <Button
              size="lg"
              className="w-full text-base md:text-lg"
              onClick={onSubmit}
              loading={isSubmitting}
              disabled={isScanning}
            >
              {isSubmitting ? "Submitting Report..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
