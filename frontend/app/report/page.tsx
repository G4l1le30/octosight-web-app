"use client";

import { useState } from "react";
import ReportSuccess from "@/components/report/ReportSuccess";
import { Ticket, ReportFormData, IncidentType } from "@/types/ticket";

export default function ReportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ticketData, setTicketData] = useState<Ticket | null>(null);

  const [formData, setFormData] = useState<ReportFormData>({
    type: "Website",
    url: "",
    summary: "",
    senderNumbers: "",
  });

  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = new FormData();
      data.append("type", formData.type);
      data.append("url", formData.url);
      data.append("summary", formData.summary);
      data.append("sender_numbers", formData.senderNumbers);

      // Append files
      screenshots.forEach((file) => data.append("screenshots", file));
      attachments.forEach((file) => data.append("attachments", file));

      const response = await fetch("/api/v1/report", {
        method: "POST",
        body: data,
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
    switch (formData.type) {
      case "SMS":
        return {
          label: "Link in SMS",
          urlPlaceholder: "https://bit.ly/claim-prize",
          senderLabel: "Sender Phone Number",
          senderPlaceholder: "e.g., +62 812..., 0812...",
          summaryPlaceholder:
            "I received an SMS from this number saying my bank account was blocked...",
          fileLabel: "SMS Screenshot",
        };
      case "WhatsApp":
        return {
          label: "Link in WhatsApp",
          urlPlaceholder: "https://wa.me/message/...",
          senderLabel: "WhatsApp Number / Group",
          senderPlaceholder: "e.g., +62 812... or Phishing Group Name",
          summaryPlaceholder:
            "Someone sent a WhatsApp message with a link to a fake login page...",
          fileLabel: "Chat Screenshot",
        };
      case "Email":
        return {
          label: "Link in Email",
          urlPlaceholder: "https://cimb-security-update.com",
          senderLabel: "Sender Email Address",
          senderPlaceholder: "e.g., support@secure-cimb.xyz",
          summaryPlaceholder:
            "I received a suspicious email asking me to verify my identity...",
          fileLabel: "Email Screenshot",
        };
      default:
        return {
          label: "Suspicious URL / Link",
          urlPlaceholder: "https://clmbniaga.com/login",
          senderLabel: "Sender Information",
          senderPlaceholder: "Optional info about the sender",
          summaryPlaceholder: "I found this website while browsing...",
          fileLabel: "Evidence Screenshot",
        };
    }
  };

  const dynamic = getDynamicContent();

  if (submitted && ticketData) {
    return (
      <ReportSuccess
        ticketData={ticketData}
        onReset={() => setSubmitted(false)}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black mb-4">Report Phishing Incident</h1>
        <p className="text-secondary-light">
          Help us protect the community by reporting suspicious activities.
        </p>
      </div>

      {error && (
        <div className="bg-risk-high/10 text-risk-high p-4 rounded-lg mb-6 font-bold text-sm text-center">
          Error: {error}. Is the backend running?
        </div>
      )}

      <div className="card p-8 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-black uppercase tracking-wider text-secondary/60">
              Incident Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(["Website", "SMS", "WhatsApp", "Email"] as IncidentType[]).map(
                (type) => (
                  <label
                    key={type}
                    className="relative flex items-center justify-center p-3 border-2 border-neutral-border rounded-lg cursor-pointer hover:border-primary/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all"
                  >
                    <input
                      type="radio"
                      name="type"
                      className="hidden"
                      checked={formData.type === type}
                      onChange={() => setFormData({ ...formData, type })}
                    />
                    <span className="text-sm font-bold">{type}</span>
                  </label>
                ),
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="url"
              className="text-sm font-black uppercase tracking-wider text-secondary/60"
            >
              {dynamic.label}
            </label>
            <input
              type="text"
              id="url"
              placeholder={dynamic.urlPlaceholder}
              className="w-full p-4 border-2 border-neutral-border rounded-lg focus:border-primary outline-none transition-all font-medium"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              required={formData.type === "Website"}
            />
          </div>

          {(formData.type === "SMS" ||
            formData.type === "WhatsApp" ||
            formData.type === "Email") && (
            <div className="space-y-2">
              <label
                htmlFor="senderNumbers"
                className="text-sm font-black uppercase tracking-wider text-secondary/60"
              >
                {dynamic.senderLabel}
              </label>
              <input
                type="text"
                id="senderNumbers"
                placeholder={dynamic.senderPlaceholder}
                className="w-full p-4 border-2 border-neutral-border rounded-lg focus:border-primary outline-none transition-all font-medium"
                value={formData.senderNumbers}
                onChange={(e) =>
                  setFormData({ ...formData, senderNumbers: e.target.value })
                }
              />
              <p className="text-xs text-secondary-light">
                Separate multiple with commas
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-black uppercase tracking-wider text-secondary/60">
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
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-3 text-secondary/40 group-hover:text-primary transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                    <p className="mb-2 text-sm font-bold text-secondary">
                      {screenshots.length > 0
                        ? `${screenshots.length} files selected`
                        : "Upload Screenshots"}
                    </p>
                    <p className="text-xs text-secondary/50">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black uppercase tracking-wider text-secondary/60">
                Phishing Attachments
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="attachments-upload"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    setAttachments(
                      e.target.files ? Array.from(e.target.files) : [],
                    )
                  }
                />
                <label
                  htmlFor="attachments-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-3 text-secondary/40 group-hover:text-primary transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                    <p className="mb-2 text-sm font-bold text-secondary">
                      {attachments.length > 0
                        ? `${attachments.length} files selected`
                        : "Upload Files"}
                    </p>
                    <p className="text-xs text-secondary/50">
                      .apk, .pdf, .zip etc.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="summary"
              className="text-sm font-black uppercase tracking-wider text-secondary/60"
            >
              Brief Summary
            </label>
            <textarea
              id="summary"
              rows={3}
              placeholder={dynamic.summaryPlaceholder}
              className="w-full p-4 border-2 border-neutral-border rounded-lg focus:border-primary outline-none transition-all font-medium"
              value={formData.summary}
              onChange={(e) =>
                setFormData({ ...formData, summary: e.target.value })
              }
            ></textarea>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Analyze & Submit Report"
              )}
            </button>
            <p className="text-center text-xs opacity-50 mt-4 italic">
              By submitting, you agree to share this data for security analysis
              purposes.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
