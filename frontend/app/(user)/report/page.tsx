"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReportSuccess from "@/components/report/ReportSuccess";
import { ReportConfirmation } from "@/components/report/ReportConfirmation";
import { Ticket, ReportFormData, IncidentType } from "@/types/ticket";
import { IncidentSchemas } from "@/modules/report/schemas";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/auth/AuthRequired";
import { ReportForm } from "@/components/report/ReportForm";
import { ProcessingAnimation } from "@/components/ui/ProcessingAnimation";
import { toast } from "sonner";

const getLocalISOString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

const DYNAMIC_CONTENT = {
  SMS: {
    urlLabel: "Link in SMS (Optional)",
    urlPlaceholder: "https://bit.ly/claim-prize",
    senderLabel: "Sender Phone Number (Required)",
    senderPlaceholder: "e.g., +62 812..., 0812...",
    summaryLabel: "Full Message Content (Required if no screenshot)",
    summaryPlaceholder: "Paste the exact SMS text you received here...",
    fileLabel: "SMS Screenshots",
  },
  WhatsApp: {
    urlLabel: "Link in WhatsApp (Optional)",
    urlPlaceholder: "https://wa.me/message/...",
    senderLabel: "WhatsApp Number / Group (Required)",
    senderPlaceholder: "e.g., +62 812... or Phishing Group Name",
    summaryLabel: "Full Message Content (Required if no screenshot)",
    summaryPlaceholder: "Paste the exact WhatsApp message here...",
    fileLabel: "Chat Screenshots",
  },
  Email: {
    urlLabel: "Link in Email (Optional)",
    urlPlaceholder: "https://cimb-security-update.com",
    senderLabel: "Sender Email Address (Required)",
    senderPlaceholder: "e.g., support@secure-cimb.xyz",
    summaryLabel: "Full Message Content (Required if no screenshot)",
    summaryPlaceholder: "Paste the email body or sub-headers here...",
    fileLabel: "Email Screenshots",
  },
  Website: {
    urlLabel: "Suspicious URL / Link (Required)",
    urlPlaceholder: "https://clmbniaga.com/login",
    senderLabel: "Source Information (Optional)",
    senderPlaceholder: "e.g., Found on Facebook ad, pop-up, etc.",
    summaryLabel: "Additional Context (Optional)",
    summaryPlaceholder: "Describe how you found this website...",
    fileLabel: "Evidence Screenshots",
    urlRequired: true,
  },
  Transaction: {
    urlLabel: "Transaction URL / Link (Optional)",
    urlPlaceholder: "https://cimbniaga.co.id",
    senderLabel: "Target Account Number (Required)",
    senderPlaceholder: "e.g., 706123456789",
    summaryLabel: "Transaction Context (Required if no screenshot)",
    summaryPlaceholder: "Describe the transfer context here...",
    fileLabel: "Evidence / Receipts",
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

  // Store raw File objects — no upload until final submit
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [screenshotError, setScreenshotError] = useState(false);

  const dynamic = DYNAMIC_CONTENT[incidentType];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [isConfirming, submitted]);

  const form = useForm<ReportFormData>({
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

  /**
   * Step 1 — Pre-analysis (no DB write).
   * Sends files directly as multipart so the backend can OCR them.
   */
  const onSubmit = async (data: ReportFormData) => {
    if (!data.summary?.trim() && !screenshotFile) {
      form.setError("summary", {
        type: "manual",
        message: "Required: Please provide message text or upload a screenshot.",
      });
      setScreenshotError(true);
      return;
    }

    setScreenshotError(false);
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append("report_type", incidentType);
      payload.append("url", data.url || "");
      payload.append("summary", data.summary || "");
      payload.append("sender_numbers", data.senderNumbers || "");
      payload.append("bank_name", data.bankName || "");
      payload.append("bank_account", data.bankAccount || "");
      payload.append("reference_number", data.referenceNumber || "");

      // Attach raw files — backend receives them as UploadFile (no Supabase yet)
      if (screenshotFile) payload.append("screenshots", screenshotFile, screenshotFile.name);
      if (attachmentFile) payload.append("attachments", attachmentFile, attachmentFile.name);

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
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2 — Final submit (writes to DB + uploads files to Supabase on backend).
   * Files are sent as raw multipart; backend handles Supabase upload atomically.
   */
  const handleFinalSubmit = async () => {
    if (!confirmedData) return;
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append("report_type", incidentType);
      payload.append("url", confirmedData.url ?? "");
      payload.append("summary", confirmedData.summary ?? "");
      payload.append("sender_numbers", confirmedData.senderNumbers ?? "");
      payload.append("incident_date", confirmedData.incidentDate);
      payload.append("bank_name", confirmedData.bankName ?? "");
      payload.append("bank_account", confirmedData.bankAccount ?? "");
      payload.append("reference_number", confirmedData.referenceNumber ?? "");

      // Attach raw files — backend uploads to Supabase then saves paths to DB
      if (screenshotFile) payload.append("screenshots", screenshotFile, screenshotFile.name);
      if (attachmentFile) payload.append("attachments", attachmentFile, attachmentFile.name);

      const response = await fetch("/api/v1/report", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) throw new Error("Failed to submit report");

      const result = await response.json();
      setTicketData(result);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setTicketData(null);
    setIsConfirming(false);
    setConfirmedData(null);
    setScreenshotFile(null);
    setAttachmentFile(null);
    setScreenshotError(false);
    form.reset();
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
    <ReportSuccess ticketData={ticketData} onReset={handleReset} />
  );

  if (isConfirming && confirmedData) return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
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
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Loading Overlay for Pre-analysis */}
      {loading && !isConfirming && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <ProcessingAnimation title="Scanning Evidence" />
          </div>
        </div>
      )}

      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-secondary mb-3 flex items-center justify-center gap-3 tracking-tight">
          Report Phishing Incident
        </h1>
        <p className="text-secondary opacity-70 font-medium">Help us protect the community by reporting suspicious activities.</p>
      </div>

      <ReportForm
        form={form}
        onSubmit={onSubmit}
        loading={loading}
        incidentType={incidentType}
        setIncidentType={setIncidentType}
        dynamic={dynamic}
        screenshotFile={screenshotFile}
        setScreenshotFile={setScreenshotFile}
        screenshotError={screenshotError}
        setScreenshotError={setScreenshotError}
        attachmentFile={attachmentFile}
        setAttachmentFile={setAttachmentFile}
        getLocalISOString={getLocalISOString}
      />
    </div>
  );
}
