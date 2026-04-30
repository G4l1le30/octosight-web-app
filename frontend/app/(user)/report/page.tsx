"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReportSuccess from "@/components/report/ReportSuccess";
import { ReportConfirmation } from "@/components/report/ReportConfirmation";
import { Ticket, ReportFormData, IncidentType } from "@/types/ticket";
import { Globe, MessageSquare, Mail } from "lucide-react";
import { IncidentSchemas } from "@/modules/report/schemas";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { AuthRequired } from "@/components/auth/AuthRequired";

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const getLocalISOString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ticketData, setTicketData] = useState<Ticket | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedData, setConfirmedData] = useState<ReportFormData | null>(
    null,
  );
  const [analysisResult, setAnalysisResult] = useState<{
    score: number;
    priority: string;
  } | null>(null);

  const [incidentType, setIncidentType] = useState<IncidentType>("Website");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [isConfirming, submitted]);

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    reset,
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
    setLoading(true);
    setError("");
    try {
      const payload = {
        type: incidentType,
        url: data.url,
        summary: data.summary,
        sender_numbers: data.senderNumbers,
        attachment_names: attachments.map((a) => a.name),
      };
      console.log("Sending pre-analysis payload:", payload);

      const response = await fetch("/api/v1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Pre-analysis failed");
      const analysis = await response.json();
      console.log("Pre-analysis result received:", analysis);

      setAnalysisResult(analysis);
      setConfirmedData(data);
      setIsConfirming(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Pre-analysis error:", err);
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
      payload.append("type", incidentType);
      payload.append("url", confirmedData.url ?? "");
      payload.append("summary", confirmedData.summary);
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

  const getDynamicContent = () => {
    switch (incidentType) {
      case "SMS":
        return {
          urlLabel: "Link in SMS",
          urlPlaceholder: "https://bit.ly/claim-prize",
          senderLabel: "Sender Phone Number",
          senderPlaceholder: "e.g., +62 812..., 0812...",
          summaryLabel: "Full Message Content",
          summaryPlaceholder: "Paste the exact SMS text you received here...",
          fileLabel: "SMS Screenshot",
        };
      case "WhatsApp":
        return {
          urlLabel: "Link in WhatsApp",
          urlPlaceholder: "https://wa.me/message/...",
          senderLabel: "WhatsApp Number / Group",
          senderPlaceholder: "e.g., +62 812... or Phishing Group Name",
          summaryLabel: "Full Message Content",
          summaryPlaceholder: "Paste the exact WhatsApp message here...",
          fileLabel: "Chat Screenshot",
        };
      case "Email":
        return {
          urlLabel: "Link in Email",
          urlPlaceholder: "https://cimb-security-update.com",
          senderLabel: "Sender Email Address",
          senderPlaceholder: "e.g., support@secure-cimb.xyz",
          summaryLabel: "Full Message Content",
          summaryPlaceholder: "Paste the email body or sub-headers here...",
          fileLabel: "Email Screenshot",
        };
      default:
        return {
          urlLabel: "Suspicious URL / Link",
          urlPlaceholder: "https://clmbniaga.com/login",
          senderLabel: "Sender Information",
          senderPlaceholder: "Optional info about the sender",
          summaryLabel: "Full Message Content",
          summaryPlaceholder:
            "Describe how you found this website or paste the referring message...",
          fileLabel: "Evidence Screenshot",
        };
    }
  };

  const dynamic = getDynamicContent();

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-secondary font-medium">Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthRequired 
        description="Please log in to your account to submit a phishing report and track its progress."
      />
    );
  }

  if (submitted && ticketData) {
    return (
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
  }

  if (isConfirming && confirmedData) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {error && (
          <div className="bg-risk-high/10 text-risk-high p-4 rounded-lg mb-6 font-bold text-sm text-center border border-risk-high/20">
            Error: {error}
          </div>
        )}
        <ReportConfirmation
          formData={confirmedData}
          analysisResult={analysisResult}
          onBack={() => setIsConfirming(false)}
          onSubmit={handleFinalSubmit}
          isSubmitting={loading}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4 text-secondary">
          Report Phishing Incident
        </h1>
        <p className="text-secondary opacity-70 font-medium">
          Help us protect the community by reporting suspicious activities.
        </p>
      </div>

      {error && (
        <div className="bg-risk-high/10 text-risk-high p-4 rounded-lg mb-6 font-bold text-sm text-center border border-risk-high/20">
          Error: {error}. Is the backend running?
        </div>
      )}

      <div className="card p-8 bg-white border border-neutral-border overflow-visible">
        <form 
          onSubmit={handleSubmit(onSubmit as any, (errors) => {
            console.log("Form Validation Errors:", errors);
          })} 
          className="space-y-8"
        >
          {/* Incident Type */}
          <div className="space-y-4">
            <label className="text-base font-bold text-secondary">
              Incident Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(["Website", "SMS", "WhatsApp", "Email"] as IncidentType[]).map(
                (type) => (
                  <label
                    key={type}
                    className={`relative flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      incidentType === type
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-neutral-border hover:border-primary/30 text-secondary"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      className="hidden"
                      checked={incidentType === type}
                      onChange={() => {
                        setIncidentType(type);
                        reset({
                          type: type,
                          url: "",
                          summary: "",
                          senderNumbers: "",
                          incidentDate: getLocalISOString(),
                        } as any);
                      }}
                    />
                    {type === "Website" && <Globe className="w-5 h-5" />}
                    {type === "SMS" && <MessageSquare className="w-5 h-5" />}
                    {type === "WhatsApp" && (
                      <WhatsAppIcon className="w-5 h-5" />
                    )}
                    {type === "Email" && <Mail className="w-5 h-5" />}
                    <span className="text-sm font-bold">{type}</span>
                  </label>
                ),
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* URL Input (Full Width) */}
            <Input
              label={dynamic.urlLabel}
              placeholder={dynamic.urlPlaceholder}
              error={errors.url?.message}
              className="text-base"
              {...register("url")}
            />

            <div
              className={`grid gap-6 ${incidentType === "Website" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}
            >
              {/* Sender Info (Conditional) */}
              {(incidentType === "SMS" ||
                incidentType === "WhatsApp" ||
                incidentType === "Email") && (
                <Input
                  label={dynamic.senderLabel}
                  placeholder={dynamic.senderPlaceholder}
                  error={errors.senderNumbers?.message}
                  {...register("senderNumbers")}
                />
              )}

              {/* Incident Date */}
              <Controller
                name="incidentDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Date & Time of Occurrence"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.incidentDate?.message}
                  />
                )}
              />
            </div>
          </div>

          {/* Summary / Message Content */}
          <Textarea
            label={dynamic.summaryLabel}
            placeholder={dynamic.summaryPlaceholder}
            error={errors.summary?.message}
            {...register("summary")}
            className="min-h-[150px]"
          />

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-base font-bold text-secondary">
                {dynamic.fileLabel}s
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="screenshots-upload"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setScreenshots(
                      e.target.files ? Array.from(e.target.files) : [],
                    )
                  }
                />
                <label
                  htmlFor="screenshots-upload"
                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-neutral-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group overflow-hidden p-2"
                >
                  {screenshots.length > 0 ? (
                    <div className="relative w-full h-full">
                      <img
                        src={URL.createObjectURL(screenshots[0])}
                        className="w-full h-full object-cover rounded-lg"
                        alt="preview"
                      />
                      <div className="absolute inset-0 bg-secondary/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 rounded-lg">
                        <span className="text-white font-bold text-sm truncate w-full text-center">
                          {screenshots[0].name}
                        </span>
                        {screenshots.length > 1 && (
                          <span className="text-white/80 text-xs font-medium mt-1">
                            +{screenshots.length - 1} more screenshots
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setScreenshots([]);
                          }}
                          className="mt-3 px-4 py-1.5 bg-risk-high text-white text-xs font-bold rounded-full hover:bg-risk-high/90 transition-all shadow-lg active:scale-95"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="w-8 h-8 mb-3 text-secondary/40 group-hover:text-primary transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm font-bold text-secondary">
                        Upload Screenshots
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-base font-bold text-secondary">
                Phishing Attachments
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="attachments-upload"
                  className="hidden"
                  onChange={(e) =>
                    setAttachments(
                      e.target.files && e.target.files[0]
                        ? [e.target.files[0]]
                        : [],
                    )
                  }
                />
                <label
                  htmlFor="attachments-upload"
                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-neutral-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group px-4"
                >
                  <div className="flex flex-col items-center justify-center w-full">
                    <svg
                      className="w-8 h-8 mb-3 text-secondary/40 group-hover:text-primary transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {attachments.length > 0 ? (
                      <div className="flex flex-col items-center text-center w-full">
                        <p className="text-sm font-bold text-secondary truncate w-full px-2">
                          {attachments[0].name}
                        </p>
                        <p className="text-xs font-medium text-secondary/50 mt-1">
                          {formatFileSize(attachments[0].size)}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setAttachments([]);
                          }}
                          className="mt-3 px-4 py-1.5 bg-risk-high text-white text-xs font-bold rounded-full hover:bg-risk-high/90 transition-all shadow-lg active:scale-95"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-secondary">
                        Upload File
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="py-4">
            <Button
              size="md"
              type="submit"
              loading={loading}
              className="w-full text-lg"
            >
              Analyze Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
