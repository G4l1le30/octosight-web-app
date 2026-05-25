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
import { AlertTriangle, CheckCircle, ShieldCheck, CreditCard, Search, MessageSquare, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProcessingAnimation } from "@/components/ui/ProcessingAnimation";

export default function FraudCheckPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [screenshots, setScreenshots] = useState<File[]>([]);
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
    setError("");
    setResult(null);

    try {
      const payload = new FormData();
      payload.append("report_type", "Transaction");
      payload.append("bank_name", data.bankName || "");
      payload.append("sender_numbers", data.senderNumbers || "");
      payload.append("summary", data.summary || "");
      payload.append("url", data.url || "");

      screenshots.forEach((file) => payload.append("screenshots", file));

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) throw new Error("Check failed. Please try again.");
      const analysis = await response.json();
      setResult(analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-secondary mb-4 flex items-center justify-center gap-3">
          Fraud & Transaction Check
        </h1>
        <p className="text-secondary/70 text-md max-w-2xl mx-auto">
          Verify suspicious accounts or validate receipts against our secure CIMB NIAGA database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Input Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card p-6 bg-white border border-neutral-border shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-secondary">
              <Search className="text-primary size-5" />
              Quick Check
            </h2>

            <form onSubmit={form.handleSubmit(onCheck)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Target Bank"
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
                  error={form.formState.errors.senderNumbers?.message as string}
                  {...form.register("senderNumbers")}
                />
              </div>

              <Textarea
                label="Scam Modus / Message Received"
                placeholder="Paste the message here (e.g., 'Saya salah transfer...')"
                error={form.formState.errors.summary?.message as string}
                {...form.register("summary")}
                className="min-h-[100px]"
              />

              <div className="space-y-2">
                <EvidenceUpload
                  id="receipt-upload"
                  label="Scan receipt for validation"
                  files={screenshots}
                  onFilesChange={setScreenshots}
                  accept="image/*"
                  multiple={false}
                />
                <p className="text-xs text-secondary/60 italic">
                  *Our AI will cross-verify the reference number with the bank's core records.
                </p>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full py-6 text-lg"
                size="lg"
              >
                Verify Now
              </Button>
            </form>
          </div>

          {error && (
            <div className="p-4 bg-risk-high/10 border border-risk-high/20 text-risk-high rounded-xl font-bold flex items-center gap-3">
              <AlertTriangle className="size-5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Right Side: Results */}
        <div className="lg:col-span-5">
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center p-10 border-2 border-dashed border-neutral-border rounded-2xl opacity-50 text-center">
              <CreditCard className="size-16 mb-4 text-neutral-border" />
              <p className="font-medium text-secondary/60">
                Enter account details or upload a receipt to see the result.
              </p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-white border border-neutral-border rounded-3xl shadow-sm">
              <ProcessingAnimation title="Analyzing Fraud Probability" />
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className={cn(
                "p-6 rounded-2xl border-2 flex flex-col items-center text-center",
                result.score >= 75 ? "bg-risk-high/5 border-risk-high/20" :
                  result.score >= 35 ? "bg-risk-medium/5 border-risk-medium/20" :
                    "bg-risk-low/5 border-risk-low/20"
              )}>
                <div className="mb-4">
                  <RiskScoreCard score={result.score} />
                </div>
                <h3 className={cn(
                  "text-2xl font-bold mb-2",
                  result.score >= 75 ? "text-risk-high" :
                    result.score >= 35 ? "text-risk-medium" :
                      "text-risk-low"
                )}>
                  {result.score >= 75 ? "Verified High Risk!" :
                    result.score >= 35 ? "Suspicious Activity" :
                      "Clean / Verified"}
                </h3>
              </div>

              <div className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
                {/* Scenario Analysis Result */}
                {result.details.detected_scam_type && result.details.detected_scam_type !== "General Phishing" && (
                  <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-xs font-bold text-secondary/40 tracking-wide mb-1">Detected Pattern</p>
                    <p className="text-sm font-bold text-primary flex items-center gap-2">
                      <ShieldCheck className="size-4" />
                      {result.details.detected_scam_type}
                    </p>
                  </div>
                )}

                <h4 className="font-bold text-secondary mb-4 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-primary" />
                  Security Flags
                </h4>
                <div className="space-y-3">
                  {result.flags.map((flag: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-page rounded-lg border border-neutral-border/50">
                      <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span className="text-sm font-bold text-secondary capitalize">
                        {flag.replace(/_/g, " ").replace(/:/g, ": ")}
                      </span>
                    </div>
                  ))}
                  {result.flags.length === 0 && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg border border-green-100 font-bold text-sm">
                      <CheckCircle className="size-4" />
                      No threats detected.
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-border">
                  <h4 className="font-bold text-secondary mb-2">Validation Result:</h4>
                  <p className="text-sm font-medium text-secondary/70 bg-neutral-page p-3 rounded-lg border border-neutral-border/50">
                    {result.details.transaction_validation}
                  </p>
                  {result.hybrid_formula && (
                    <p className="text-xs text-secondary/40 mt-2 font-mono tracking-tighter">
                      {result.hybrid_formula}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setResult(null);
                  setScreenshots([]);
                  form.reset();
                }}
              >
                Check Another
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-16 bg-primary/5 rounded-3xl p-8 border border-primary/10">
        <h3 className="text-2xl font-bold text-secondary mb-4 flex items-center gap-3">
          <Landmark className="size-6 text-primary" />
          CIMB NIAGA Verification Logic
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="size-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold shadow-md">OS</div>
            <h4 className="font-bold">Reputation Engine</h4>
            <p className="text-sm text-secondary/70 font-medium">Instantly cross-checks account numbers against OctoSight's global scammer database.</p>
          </div>
          <div className="space-y-2">
            <div className="size-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold shadow-md">OCR</div>
            <h4 className="font-bold">Heuristic Scan</h4>
            <p className="text-sm text-secondary/70 font-medium">Extracts reference codes and scans for Photoshop manipulation or font inconsistencies.</p>
          </div>
          <div className="space-y-2">
            <div className="size-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold shadow-md">API</div>
            <h4 className="font-bold">Bank Core Sync</h4>
            <p className="text-sm text-secondary/70 font-medium">Validates the transaction against real CIMB Core Banking records (Simulated).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
