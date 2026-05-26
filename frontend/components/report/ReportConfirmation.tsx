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

  const isScamScenario = analysisResult?.details?.detected_scam_type && analysisResult.details.detected_scam_type !== "General Phishing";
  const isNoUrlScam = !formData.url?.trim() && isScamScenario;

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
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4 text-secondary">
          Report Phishing Incident
        </h1>
        <p className="text-secondary opacity-70 font-medium">
          Help us protect the community by reporting suspicious activities.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-border shadow-xl overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left Side: Summary Details */}
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-secondary mb-8">
                Review Your Report
              </h2>
              {/* Report Type */}
              <div className="flex items-center gap-5">
                <div className="p-3.5 rounded-2xl bg-primary/5 text-primary">
                  <TypeIcon className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-secondary/60 mb-1">
                    Report Type
                  </p>
                  <p className="text-lg font-semibold text-secondary">
                    {typeConfig.label}
                  </p>
                </div>
              </div>

              {/* Sender Info */}
              {formData.senderNumbers && (
                <div className="flex items-center gap-5">
                  <div className="p-3.5 rounded-2xl bg-primary/5 text-primary">
                    <User className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-secondary/60 mb-1">
                      {formData.type === "Email"
                        ? "Sender Email"
                        : "Sender Number"}
                    </p>
                    <p className="text-lg font-semibold text-secondary truncate">
                      {formData.senderNumbers}
                    </p>
                  </div>
                </div>
              )}

              {/* URL */}
              {formData.url && (
                <div className="flex items-center gap-5">
                  <div className="p-3.5 rounded-2xl bg-primary/5 text-primary">
                    <LinkIcon className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-secondary/60 mb-1">
                      Suspicious URL
                    </p>
                    <p className="text-lg font-semibold text-secondary truncate">
                      {formData.url}
                    </p>
                  </div>
                </div>
              )}

              {/* Bank Info (If present) */}
              {formData.bankAccount && (
                <div className="flex items-center gap-5">
                  <div className="p-3.5 rounded-2xl bg-primary/5 text-primary">
                    <CreditCard className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-secondary/60 mb-1">
                      {formData.bankName || "Reported Bank Account"}
                    </p>
                    <p className="text-lg font-semibold text-secondary truncate">
                      {formData.bankAccount}
                    </p>
                  </div>
                </div>
              )}

              {/* Reference Number (If present) */}
              {formData.referenceNumber && (
                <div className="flex items-center gap-5">
                  <div className="p-3.5 rounded-2xl bg-primary/5 text-primary">
                    <Hash className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-secondary/60 mb-1">
                      Reference Number
                    </p>
                    <p className="text-lg font-semibold text-secondary truncate">
                      {formData.referenceNumber}
                    </p>
                  </div>
                </div>
              )}

              {/* Incident Time */}
              <div className="flex items-center gap-5">
                <div className="p-3.5 rounded-2xl bg-primary/5 text-primary">
                  <Calendar className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-secondary/60 mb-1">
                    Incident Time
                  </p>
                  <p className="text-lg font-semibold text-secondary">
                    {formatDate(formData.incidentDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: Risk Score Card */}
            {isScanning ? (
              <div className="bg-neutral-page rounded-3xl p-8 border-2 border-dashed border-neutral-border flex flex-col items-center justify-center text-center h-full min-h-[260px] gap-4">
                <Loader2 className="size-12 animate-spin text-primary" />
                <p className="text-sm font-semibold text-secondary/60 animate-pulse">
                  Analyzing potential risks...
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <RiskScoreCard
                  score={initialRiskScore}
                  status={initialRiskStatus}
                />

                {/* Hybrid Score Breakdown */}
                {analysisResult?.ml_score !== undefined && (
                  <div className="bg-transparent rounded-2xl p-4 border border-neutral-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-secondary">
                        {isNoUrlScam ? "Scam Analysis Weights" : "Hybrid Score Breakdown"}
                      </h3>
                      {analysisResult?.is_blacklisted && (
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-white text-xs font-bold tracking-wide">
                          Blacklist
                        </span>
                      )}
                    </div>
                    <div className="space-y-4">
                      {analysisResult.rule_score !== undefined && (
                        <div>
                          <div className="flex justify-between text-sm font-semibold mb-1.5">
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
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-secondary h-2 rounded-full"
                              style={{ width: `${analysisResult.rule_score}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="flex justify-between text-sm font-semibold mb-1.5">
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
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${analysisResult.ml_score}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center mt-1.5">
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
                        <div className="pt-2 mt-2 border-t border-dashed border-neutral-border">
                          <p className="text-xs text-secondary/40 font-medium leading-tight">
                            *Rule-based detection is prioritized (100%) for social engineering scams without URLs. Phishing AI remains as language context.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Specific Scam Analysis Result */}
                {analysisResult?.details?.detected_scam_type && (
                  <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="size-4 text-primary" />
                      <h3 className="text-xs font-bold text-secondary tracking-wide">
                        Scenario Analysis
                      </h3>
                    </div>
                    <p className="text-sm font-bold text-secondary">
                      Detected: <span className="text-primary">{analysisResult.details.detected_scam_type}</span>
                    </p>
                    {analysisResult.details.transaction_validation !== "N/A" && (
                      <p className="text-xs text-secondary/70 mt-1">
                        {analysisResult.details.transaction_validation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="my-10 h-px bg-neutral-border" />

          {/* Disclaimer Section */}
          <div className="flex items-start gap-4 px-2 mb-12">
            <div className="shrink-0 mt-0.5">
              <Info className="size-5 text-primary" />
            </div>
            <p className="text-secondary/60 text-sm leading-relaxed font-medium">
              By submitting this report, I declare that the information provided
              is true and I understand that this report will be used for
              OctoSight network security purposes.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 max-w-2xl mx-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full text-lg"
              onClick={onBack}
            >
              Back to Previous Step
            </Button>
            <Button
              size="lg"
              className="w-full text-lg"
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
