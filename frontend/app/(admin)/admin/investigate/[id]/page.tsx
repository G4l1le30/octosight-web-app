"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Ticket, TicketAuditLog } from "@/types/ticket";
import { StatusModal } from "@/components/ui/StatusModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { BlacklistModal } from "@/components/admin/investigate/BlacklistModal";

import { InvestigateHeader } from "@/components/admin/investigate/InvestigateHeader";
import { InvestigateTargetInfo } from "@/components/admin/investigate/InvestigateTargetInfo";
import { InvestigateNotes } from "@/components/admin/investigate/InvestigateNotes";
import { DownloadModal } from "@/components/admin/investigate/DownloadModal";
import { InvestigateEvidence } from "@/components/admin/investigate/InvestigateEvidence";
import { MitigationActions } from "@/components/admin/investigate/MitigationActions";
import { AuditTrail } from "@/components/admin/investigate/AuditTrail";
import { SimilarIncidents } from "@/components/admin/investigate/SimilarIncidents";
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  BrainCircuit,
} from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { motion, AnimatePresence } from "framer-motion";

export default function InvestigatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ticketId } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [initialNotes, setInitialNotes] = useState("");
  const [status, setStatus] = useState("");
  const [initialStatus, setInitialStatus] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showFeedbackAnim, setShowFeedbackAnim] = useState(false);

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [auditLogs, setAuditLogs] = useState<TicketAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const [blacklistConfig, setBlacklistConfig] = useState<{
    isOpen: boolean;
    type: "url" | "account" | "phone" | "email";
    value: string;
    metadata?: any;
  }>({
    isOpen: false,
    type: "url",
    value: "",
  });

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    title: "",
    message: "",
  });

  const router = useRouter();

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/tickets/${ticketId}`);
      if (!res.ok) throw new Error("Ticket not found");
      const data = await res.json();
      setTicket(data);
      setNotes(data.investigation_notes || "");
      setInitialNotes(data.investigation_notes || "");
      setStatus(data.status);
      setInitialStatus(data.status);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/v1/tickets/${ticketId}/audit-logs`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setAuditLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
    fetchAuditLogs();
  }, [fetchTicket, fetchAuditLogs]);

  const openDownloadModal = (filename: string) => {
    setSelectedFile(filename);
    setShowDownloadModal(true);
    setDownloadPassword("");
    setDownloadError("");
  };

  const openBlacklistModal = (
    type: "url" | "account" | "phone" | "email",
    value: string,
    metadata?: any,
  ) => {
    setBlacklistConfig({ isOpen: true, type, value, metadata });
  };

  const handleConfirmDownload = async () => {
    if (downloadPassword === "confirm") {
      try {
        const res = await fetch(`/api/v1/admin/download/${selectedFile}`);
        if (!res.ok) {
          setDownloadError("Download failed. Server returned an error.");
          return;
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = selectedFile;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);
        setShowDownloadModal(false);
        setDownloadPassword("");
      } catch (err) {
        console.error("Download Error:", err);
        setDownloadError("Connection error. Check if backend is running.");
      }
    } else {
      setDownloadError("Type 'confirm' to proceed with download.");
    }
  };

  const hasChanges =
    notes !== initialNotes || status !== initialStatus || !!actionLabel;

  const handleUpdate = async () => {
    setShowSaveConfirm(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          investigation_notes: notes,
          action_taken: actionLabel || undefined,
        }),
      });

      if (res.ok) {
        // Refresh audit log to show the new entry
        await fetchAuditLogs();
        setInitialNotes(notes);
        setInitialStatus(status);
        setActionLabel("");
        setModalConfig({
          isOpen: true,
          type: "success",
          title: "Changes Saved",
          message: `Ticket ${ticketId} has been updated. The reporter will be notified of any status changes.`,
        });
      } else {
        let errorMsg = "Could not update the ticket. Please try again later.";
        try {
          const errorData = await res.json();
          if (errorData.detail) {
            errorMsg = errorData.detail;
          }
        } catch (e) {
          // Fallback to default message
        }

        setModalConfig({
          isOpen: true,
          type: "error",
          title: "Update Failed",
          message: errorMsg,
        });
      }
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Connection Error",
        message:
          err.message || "An error occurred while connecting to the server.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackType) return;
    setSubmittingFeedback(true);
    try {
      const res = await fetch(`/api/v1/tickets/${ticketId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback_type: feedbackType }),
      });
      if (res.ok) {
        toast.success("ML feedback submitted successfully.");
        setFeedbackType(null);
        setShowFeedbackAnim(true);
        setTimeout(() => setShowFeedbackAnim(false), 2500);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.detail || "Failed to submit ML feedback.");
      }
    } catch {
      toast.error("Connection error while submitting ML feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleNotify = async () => {
    const message = window.prompt(
      "Enter warning message to send to the reporter:",
    );
    if (!message || !message.trim()) return;
    try {
      const res = await fetch(`/api/v1/tickets/${ticketId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (res.ok) {
        toast.success("Warning notification sent to reporter.");
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.detail || "Failed to send notification.");
      }
    } catch {
      toast.error("Connection error while sending notification.");
    }
  };

  if (loading)
    return (
      <div className="p-14 md:p-20 text-center font-normal opacity-70">
        Loading investigation data...
      </div>
    );
  if (!ticket)
    return (
      <div className="p-14 md:p-20 text-center font-bold text-risk-high text-lg md:text-xl">
        Ticket # {ticketId} Not Found
      </div>
    );

  return (
    <div className="container mx-auto px-3 md:px-4 py-6 md:py-8 max-w-6xl">
      <InvestigateHeader
        ticketId={ticket.ticket_id}
        onSave={() => {
          if (!hasChanges) {
            toast.error(
              "No changes detected. Please modify the data before saving.",
            );
            return;
          }
          setShowSaveConfirm(true);
        }}
        saving={saving}
        disabled={!hasChanges}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Target Info */}
        <div className="lg:col-span-2">
          <InvestigateTargetInfo
            ticket={ticket}
            status={status}
            setStatus={setStatus}
          />
        </div>

        {/* Notes + optional action label */}
        <div className="lg:col-span-1 h-full">
          <InvestigateNotes ticket={ticket} notes={notes} setNotes={setNotes} />
        </div>

        {/* Evidence */}
        <div className="lg:col-span-2">
          <InvestigateEvidence
            ticket={ticket}
            onDownloadAttachment={openDownloadModal}
          />
        </div>

        {/* Mitigation Actions */}
        <div className="lg:col-span-1">
          <MitigationActions
            ticket={ticket}
            openBlacklistModal={openBlacklistModal}
          />
        </div>

        {/* Audit Trail */}
        <div className="lg:col-span-2">
          <AuditTrail logs={auditLogs} loading={auditLoading} />
        </div>

        {/* ML Feedback */}
        <PermissionGate permission="ml.submit_feedback">
        <div className="lg:col-span-1">
          <div className="card p-6 md:p-8 h-full flex flex-col relative overflow-hidden">
            <h3 className="text-lg md:text-xl font-bold text-secondary mb-4 md:mb-6">
              ML Feedback
            </h3>

            <div className="flex gap-2 md:gap-3 mb-3 md:mb-4 text-xs md:text-sm">
              <div className="flex-1 bg-gray-50 rounded-md md:rounded-lg p-1.5 md:p-2 text-center">
                <span className="text-secondary block text-xs">ML Score</span>
                <span className="font-bold text-secondary">
                  {ticket.ml_score ?? "N/A"}
                </span>
              </div>
              <div className="flex-1 bg-gray-50 rounded-md md:rounded-lg p-1.5 md:p-2 text-center">
                <span className="text-secondary block text-xs">Rule Score</span>
                <span className="font-bold text-secondary">
                  {ticket.rule_score ?? "N/A"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 md:gap-2 mb-3 md:mb-4">
              <button
                onClick={() => setFeedbackType("tp")}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-xs font-medium transition-all ${
                  feedbackType === "tp"
                    ? "border-green-500 ring-2 ring-green-200 bg-green-50 text-green-700"
                    : "border-gray-200 text-secondary hover:border-green-300 hover:bg-green-50/50"
                }`}
              >
                Correct - Phishing
              </button>
              <button
                onClick={() => setFeedbackType("fp")}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-xs font-medium transition-all ${
                  feedbackType === "fp"
                    ? "border-amber-500 ring-2 ring-amber-200 bg-amber-50 text-amber-700"
                    : "border-gray-200 text-secondary hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                False Alarm
              </button>
              <button
                onClick={() => setFeedbackType("fn")}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-xs font-medium transition-all ${
                  feedbackType === "fn"
                    ? "border-red-500 ring-2 ring-red-200 bg-red-50 text-red-700"
                    : "border-gray-200 text-secondary hover:border-red-300 hover:bg-red-50/50"
                }`}
              >
                Missed Phishing
              </button>
              <button
                onClick={() => setFeedbackType("tn")}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-xs font-medium transition-all ${
                  feedbackType === "tn"
                    ? "border-blue-500 ring-2 ring-blue-200 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-secondary hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                Correct - Safe
              </button>
            </div>

            <button
              onClick={handleSubmitFeedback}
              disabled={!feedbackType || submittingFeedback}
              className="w-full py-1.5 md:py-2 px-3 md:px-4 rounded-md md:rounded-lg text-xs md:text-sm font-medium transition-all bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingFeedback ? "Saving..." : "Submit Feedback"}
            </button>

            <AnimatePresence>
              {showFeedbackAnim && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl md:rounded-2xl border border-green-200"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.1 }}
                    className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 text-green-600"
                  >
                    <CheckCircle className="w-6 h-6 md:w-8 md:h-8" />
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm md:text-base font-bold text-gray-900"
                  >
                    Feedback Received!
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs md:text-sm text-gray-500 mt-1 text-center px-4"
                  >
                    Your input helps the ML engine learn.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </PermissionGate>

        {/* Similar Incidents */}
        <div className="lg:col-span-3">
          <SimilarIncidents ticketId={ticketId} />
        </div>
      </div>

      {/* Save Confirmation Modal */}
      <ConfirmModal
        isOpen={showSaveConfirm}
        title="Save Investigation Changes?"
        message="Are you sure you want to update this ticket? The reporter will be notified of any status changes."
        confirmText="Confirm Save"
        onConfirm={handleUpdate}
        onClose={() => setShowSaveConfirm(false)}
        isLoading={saving}
      />

      {/* Blacklist Modal */}
      <BlacklistModal
        isOpen={blacklistConfig.isOpen}
        type={blacklistConfig.type}
        value={blacklistConfig.value}
        metadata={blacklistConfig.metadata}
        ticketId={ticket.ticket_id}
        onClose={() =>
          setBlacklistConfig({ ...blacklistConfig, isOpen: false })
        }
      />

      <DownloadModal
        isOpen={showDownloadModal}
        downloadPassword={downloadPassword}
        downloadError={downloadError}
        onPasswordChange={setDownloadPassword}
        onConfirm={handleConfirmDownload}
        onCancel={() => setShowDownloadModal(false)}
      />

      <StatusModal
        {...modalConfig}
        buttonText={
          modalConfig.type === "success" ? "Back to Triage" : "Dismiss"
        }
        onClose={() => {
          if (modalConfig.type === "success") {
            toast.success(`Ticket ${ticketId} has been updated successfully.`);
            router.back();
          } else {
            // Errors just close the dialog, stay on page
            setModalConfig({ ...modalConfig, isOpen: false });
          }
        }}
      />
    </div>
  );
}
