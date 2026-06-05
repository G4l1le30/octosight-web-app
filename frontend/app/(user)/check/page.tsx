"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IncidentSchemas } from "@/modules/report/schemas";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { EvidenceUpload } from "@/components/report/EvidenceUpload";
import { RiskScoreCard } from "@/components/report/RiskScoreCard";
import {
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  CreditCard,
  Search,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProcessingAnimation } from "@/components/ui/ProcessingAnimation";
import { toast } from "sonner";
import { sanitizeText } from "@/lib/sanitize";

export default function FraudCheckPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [screenshots, setScreenshots] = useState<File | null>(null);
  const [error, setError] = useState("");

  const form = useForm({
    resolver: zodResolver(IncidentSchemas.Transaction),
    defaultValues: {
      type: "Transaction",
      bankName: "CIMB NIAGA",
      senderNumbers: "",
      summary: "",
      incidentDate: new Date().toISOString().slice(0, 16),
      url: "",
    },
  });

  const onCheck = async (data: any) => {
    setLoading(true);
    setResult(null);

    if (!data.summary?.trim() || data.summary.trim().length < 50) {
      form.setError("summary", {
        type: "manual",
        message: "Please provide at least 50 characters for accurate analysis.",
      });
      setLoading(false);
      return;
    }

    try {
      const payload = new FormData();
      payload.append("report_type", "Transaction");
      payload.append("bank_name", sanitizeText(data.bankName || ""));
      payload.append("sender_numbers", sanitizeText(data.senderNumbers || ""));
      payload.append("summary", sanitizeText(data.summary || ""));
      payload.append("url", sanitizeText(data.url || ""));

      if (screenshots)
        payload.append("screenshots", screenshots, screenshots.name);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) throw new Error("Check failed. Please try again.");
      const analysis = await response.json();
      if (analysis.ml_available === false) {
        toast.warning("ML analysis unavailable — results are rule-based only");
      }
      setResult(analysis);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-3 md:px-4 py-8 md:py-12 max-w-6xl">
      <div className="text-center mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-3 md:mb-4 flex items-center justify-center gap-2 md:gap-3">
          Fraud & Transaction Check
        </h1>
        <p className="text-secondary/70 text-md max-w-2xl mx-auto">
          Verify suspicious accounts or validate receipts against our secure
          CIMB NIAGA database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left Side: Input Form */}
        <div className="lg:col-span-7 space-y-4 md:space-y-6">
          <div className="card p-4 md:p-6 bg-white border border-neutral-border shadow-sm">
            <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-1.5 md:gap-2 text-secondary">
              <Search className="text-primary size-5" />
              Quick Check
            </h2>

            <form onSubmit={form.handleSubmit(onCheck)} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <Select
                  label="Target Bank"
                  className="py-3 md:py-3.5"
                  options={[
                    { label: "CIMB NIAGA", value: "CIMB NIAGA" },
                    { label: "OCTO Pay / Digital", value: "OCTO Pay" },
                    { label: "Other / External", value: "Other Bank" },
                  ]}
                  {...form.register("bankName")}
                />
                <Input
                  label="Account Number"
                  placeholder="e.g., 706123456789"
                  type="number"
                  inputMode="numeric"
                  error={form.formState.errors.senderNumbers?.message as string}
                  {...form.register("senderNumbers")}
                />
              </div>

              <Textarea
                label="Scam Modus / Message Received (min 50 characters)"
                placeholder="Paste the suspicious message here (e.g., 'Please transfer funds to...')"
                error={form.formState.errors.summary?.message as string}
                {...form.register("summary")}
                className="min-h-[100px]"
              />

              <div className="space-y-1.5 md:space-y-2">
                <EvidenceUpload
                  id="receipt-upload"
                  label="Scan receipt for validation"
                  mode="screenshot"
                  accept="image/*"
                  onFileChange={setScreenshots}
                  disabled={loading}
                />
                <p className="text-xs text-secondary/60">
                  *Our AI will cross-check the account number and report details
                  with CIMB NIAGA data.
                </p>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full text-base md:text-lg"
                size="lg"
              >
                Verify Now
              </Button>
            </form>
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="lg:col-span-5">
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center p-8 md:p-10 border-2 border-dashed border-neutral-border rounded-xl md:rounded-2xl opacity-50 text-center">
              <CreditCard className="size-16 mb-3 md:mb-4 text-secondary/80" />
              <p className="font-medium text-secondary/80">
                Enter account details or upload a receipt to see the result.
              </p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center p-4 md:p-6 bg-white border border-neutral-border rounded-2xl md:rounded-3xl shadow-sm">
              <ProcessingAnimation title="Analyzing Fraud Probability" />
            </div>
          )}

          {result && (
            <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div
                className={cn(
                  "p-4 md:p-6 rounded-xl md:rounded-2xl border-2 flex flex-col items-center text-center",
                  result.score >= 75
                    ? "bg-risk-high/5 border-risk-high/20"
                    : result.score >= 35
                      ? "bg-risk-medium/5 border-risk-medium/20"
                      : "bg-risk-low/5 border-risk-low/20",
                )}
              >
                <div className="mb-3 md:mb-4">
                  <RiskScoreCard score={result.score} />
                </div>
                <h3 className={cn("text-lg md:text-xl font-bold mb-1.5 md:mb-2")}>
                  {result.score >= 75
                    ? "Verified High Risk!"
                    : result.score >= 35
                      ? "Suspicious Activity"
                      : "Clean / Verified"}
                </h3>
              </div>

              <div className="bg-white border border-neutral-border rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
                {/* Scenario Analysis Result */}
                {result.details.detected_scam_type &&
                  result.details.detected_scam_type !== "General Phishing" && (
                    <div className="mb-4 md:mb-6 p-3 md:p-4 bg-primary/5 rounded-lg md:rounded-xl border border-primary/10">
                      <p className="text-xs font-bold text-secondary/60 tracking-wide mb-0.5 md:mb-1">
                        Detected Pattern
                      </p>
                      <p className="text-xs md:text-sm font-bold text-primary flex items-center gap-1.5 md:gap-2">
                        <ShieldCheck className="size-4" />
                        {result.details.detected_scam_type}
                      </p>
                    </div>
                  )}

                <h4 className="font-bold text-secondary mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2">
                  <AlertTriangle className="size-4 text-primary" />
                  Security Flags
                </h4>
                <div className="space-y-2 md:space-y-3">
                  {result.flags.map((flag: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-neutral-page rounded-md md:rounded-lg border border-neutral-border/50"
                    >
                      <div className="size-2 rounded-full bg-primary mt-1 md:mt-1.5 shrink-0" />
                      <span className="text-xs md:text-sm font-bold text-secondary capitalize">
                        {flag.replace(/_/g, " ").replace(/:/g, ": ")}
                      </span>
                    </div>
                  ))}
                  {result.flags.length === 0 && (
                    <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-green-50 text-green-700 rounded-md md:rounded-lg border border-green-100 font-bold text-xs md:text-sm">
                      <CheckCircle className="size-4" />
                      No threats detected.
                    </div>
                  )}
                </div>

                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-neutral-border">
                  <h4 className="font-bold text-secondary mb-1.5 md:mb-2">
                    Validation Result
                  </h4>
                  <p className="text-xs md:text-sm font-medium text-secondary/70 bg-neutral-page p-2 md:p-3 rounded-md md:rounded-lg border border-neutral-border/50">
                    {result.details.transaction_validation}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setResult(null);
                  setScreenshots(null);
                  form.reset();
                }}
              >
                Check Another
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
