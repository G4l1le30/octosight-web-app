"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReportSuccess from "@/components/report/ReportSuccess";
import { ReportConfirmation } from "@/components/report/ReportConfirmation";
import { Ticket, ReportFormData, IncidentType } from "@/types/ticket";
import { IncidentSchemas } from "@/modules/report/schemas";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/auth/AuthRequired";
import { IncidentTypeCard } from "@/components/report/IncidentTypeCard";
import { EvidenceUpload } from "@/components/report/EvidenceUpload";

const getLocalISOString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

const DYNAMIC_CONTENT = {
  SMS: {
    urlLabel: "Link in SMS",
    urlPlaceholder: "https://bit.ly/claim-prize",
    senderLabel: "Sender Phone Number",
    senderPlaceholder: "e.g., +62 812..., 0812...",
    summaryLabel: "Full Message Content",
    summaryPlaceholder: "Paste the exact SMS text you received here...",
    fileLabel: "SMS Screenshot",
  },
  WhatsApp: {
    urlLabel: "Link in WhatsApp",
    urlPlaceholder: "https://wa.me/message/...",
    senderLabel: "WhatsApp Number / Group",
    senderPlaceholder: "e.g., +62 812... or Phishing Group Name",
    summaryLabel: "Full Message Content",
    summaryPlaceholder: "Paste the exact WhatsApp message here...",
    fileLabel: "Chat Screenshot",
  },
  Email: {
    urlLabel: "Link in Email",
    urlPlaceholder: "https://cimb-security-update.com",
    senderLabel: "Sender Email Address",
    senderPlaceholder: "e.g., support@secure-cimb.xyz",
    summaryLabel: "Full Message Content",
    summaryPlaceholder: "Paste the email body or sub-headers here...",
    fileLabel: "Email Screenshot",
  },
  Website: {
    urlLabel: "Suspicious URL / Link",
    urlPlaceholder: "https://clmbniaga.com/login",
    senderLabel: "Sender Information",
    senderPlaceholder: "Optional info about the sender",
    summaryLabel: "Full Message Content",
    summaryPlaceholder: "Describe how you found this website or paste the referring message...",
    fileLabel: "Evidence Screenshot",
  },
};

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ticketData, setTicketData] = useState<Ticket | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedData, setConfirmedData] = useState<ReportFormData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const [incidentType, setIncidentType] = useState<IncidentType>("Website");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotError, setScreenshotError] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const dynamic = DYNAMIC_CONTENT[incidentType];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [isConfirming, submitted]);

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    setError: setFormError,
  } = useForm<ReportFormData>({
    resolver: (values, context, options) => {
      const schema = IncidentSchemas[incidentType];
      return zodResolver(schema)(values, context, options);
    },
    defaultValues: {
      type: incidentType,
      url: "",
      summary: "",
      senderNumbers: "",
      incidentDate: getLocalISOString(),
    } as any,
  });

  const onSubmit = async (data: ReportFormData) => {
    if (!data.summary?.trim() && screenshots.length === 0) {
      setFormError("summary", { 
        type: "manual", 
        message: "Required: Please provide message text or upload a screenshot." 
      });
      setScreenshotError(true);
      return;
    }

    setScreenshotError(false);
    setLoading(true);
    setError("");
    try {
      const payload = new FormData();
      payload.append("report_type", incidentType);
      payload.append("url", data.url || "");
      payload.append("summary", data.summary || "");
      payload.append("sender_numbers", data.senderNumbers || "");
      payload.append("attachment_names", JSON.stringify(attachments.map((a) => a.name)));
      // Include screenshots so OCR is factored into the preview score.
      // Uses /api/analyze (Next.js proxy route) to correctly forward binary files.
      screenshots.forEach((file) => payload.append("screenshots", file));

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) throw new Error("Pre-analysis failed");
      const analysis = await response.json();

      setAnalysisResult(analysis);
      setConfirmedData(data);
      setIsConfirming(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!confirmedData) return;
    setLoading(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("report_type", incidentType);
      payload.append("url", confirmedData.url ?? "");
      payload.append("summary", confirmedData.summary ?? "");
      payload.append("sender_numbers", confirmedData.senderNumbers ?? "");
      payload.append("incident_date", confirmedData.incidentDate);

      screenshots.forEach((file) => payload.append("screenshots", file));
      attachments.forEach((file) => payload.append("attachments", file));

      const response = await fetch("/api/v1/report", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) throw new Error("Failed to submit report");

      const result = await response.json();
      setTicketData(result);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return (
    <div className="container mx-auto px-4 py-32 text-center">
      <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-secondary font-medium">Loading...</p>
    </div>
  );

  if (!user) return (
    <AuthRequired description="Please log in to your account to submit a phishing report and track its progress." />
  );

  if (submitted && ticketData) return (
    <ReportSuccess
      ticketData={ticketData}
      onReset={() => {
        setSubmitted(false);
        setTicketData(null);
        setIsConfirming(false);
        setConfirmedData(null);
        reset();
      }}
    />
  );

  if (isConfirming && confirmedData) return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {error && <div className="bg-risk-high/10 text-risk-high p-4 rounded-lg mb-6 font-bold text-sm text-center border border-risk-high/20">Error: {error}</div>}
      <ReportConfirmation
        formData={confirmedData}
        analysisResult={analysisResult}
        onBack={() => setIsConfirming(false)}
        onSubmit={handleFinalSubmit}
        isSubmitting={loading}
      />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4 text-secondary">Report Phishing Incident</h1>
        <p className="text-secondary opacity-70 font-medium">Help us protect the community by reporting suspicious activities.</p>
      </div>

      {error && <div className="bg-risk-high/10 text-risk-high p-4 rounded-lg mb-6 font-bold text-sm text-center border border-risk-high/20">Error: {error}. Is the backend running?</div>}

      <div className="card p-8 bg-white border border-neutral-border overflow-visible">
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
          <div className="space-y-4">
            <label className="text-base font-bold text-secondary">Incident Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(["Website", "SMS", "WhatsApp", "Email"] as IncidentType[]).map((type) => (
                <IncidentTypeCard 
                  key={type} 
                  type={type} 
                  selected={incidentType === type} 
                  onClick={() => {
                    setIncidentType(type);
                    reset({ type, url: "", summary: "", senderNumbers: "", incidentDate: getLocalISOString() } as any);
                  }} 
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={incidentType === "Website" ? "md:col-span-2" : ""}>
              <Input 
                label={dynamic.urlLabel} 
                placeholder={dynamic.urlPlaceholder} 
                error={errors.url?.message} 
                {...register("url")} 
              />
            </div>
            {incidentType !== "Website" && (
              <Input 
                label={dynamic.senderLabel} 
                placeholder={dynamic.senderPlaceholder} 
                error={errors.senderNumbers?.message} 
                {...register("senderNumbers")} 
              />
            )}
          </div>

          <Textarea label={dynamic.summaryLabel} placeholder={dynamic.summaryPlaceholder} error={errors.summary?.message} {...register("summary")} className="min-h-[150px]" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EvidenceUpload 
              id="screenshots-upload" 
              label={dynamic.fileLabel} 
              files={screenshots} 
              onFilesChange={(files) => { setScreenshots(files); if (files.length > 0) setScreenshotError(false); }} 
              error={screenshotError} 
              errorMessage="Required: Please upload a screenshot if message text is empty." 
              accept="image/*" 
              multiple 
            />
            <EvidenceUpload 
              id="attachments-upload" 
              label="Phishing Attachments" 
              files={attachments} 
              onFilesChange={setAttachments} 
              accept="*" 
            />
          </div>

          <Button type="submit" loading={loading} className="w-full text-lg">Analyze Report</Button>
        </form>
      </div>
    </div>
  );
}
