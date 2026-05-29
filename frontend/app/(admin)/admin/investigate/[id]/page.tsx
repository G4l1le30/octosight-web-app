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
import { toast } from "sonner";

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

  const hasChanges = notes !== initialNotes || status !== initialStatus || !!actionLabel;

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
        message: err.message || "An error occurred while connecting to the server.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center font-normal opacity-70">
        Loading investigation data...
      </div>
    );
  if (!ticket)
    return (
      <div className="p-20 text-center font-bold text-risk-high text-xl">
        Ticket # {ticketId} Not Found
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <InvestigateHeader
        ticketId={ticket.ticket_id}
        onSave={() => {
          if (!hasChanges) {
            toast.error("No changes detected. Please modify the data before saving.");
            return;
          }
          setShowSaveConfirm(true);
        }}
        saving={saving}
        disabled={!hasChanges}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        {/* Audit Trail — full width */}
        <div className="lg:col-span-3">
          <AuditTrail logs={auditLogs} loading={auditLoading} />
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
        buttonText={modalConfig.type === "success" ? "Back to Triage" : "Dismiss"}
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
