"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Ticket, TicketAuditLog } from "@/types/ticket";
import { StatusModal } from "@/components/ui/StatusModal";
import { BlacklistModal } from "@/components/admin/investigate/BlacklistModal";

import { InvestigateHeader } from "@/components/admin/investigate/InvestigateHeader";
import { InvestigateTargetInfo } from "@/components/admin/investigate/InvestigateTargetInfo";
import { InvestigateNotes } from "@/components/admin/investigate/InvestigateNotes";
import { DownloadModal } from "@/components/admin/investigate/DownloadModal";
import { InvestigateEvidence } from "@/components/admin/investigate/InvestigateEvidence";
import { AuditTrail } from "@/components/admin/investigate/AuditTrail";

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
  const [status, setStatus] = useState("");
  const [actionLabel, setActionLabel] = useState("");

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
      setStatus(data.status);
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
    metadata?: any
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

  const handleUpdate = async () => {
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
        setActionLabel("");
        setModalConfig({
          isOpen: true,
          type: "success",
          title: "Update Successful",
          message: `Ticket ${ticketId} has been updated successfully.`,
        });
      } else {
        setModalConfig({
          isOpen: true,
          type: "error",
          title: "Update Failed",
          message: "Could not update the ticket. Please try again later.",
        });
      }
    } catch {
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Connection Error",
        message: "An error occurred while connecting to the server.",
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
        onSave={handleUpdate}
        saving={saving}
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
        <div className="lg:col-span-1 space-y-4">
          <InvestigateNotes notes={notes} setNotes={setNotes} />

          {/* Action label (optional, gives admins a free-text description for the audit trail) */}
          <div className="card p-5 bg-white border border-neutral-border shadow-sm">
            <label className="block text-xs font-bold text-secondary tracking-wide mb-2">
              Audit Label <span className="text-secondary/30 font-semibold normal-case">(optional)</span>
            </label>
            <input
              id="audit-action-label"
              type="text"
              value={actionLabel}
              onChange={(e) => setActionLabel(e.target.value)}
              placeholder="e.g. Escalated to Tier 2"
              className="w-full text-sm font-medium text-secondary bg-neutral-page border border-neutral-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <p className="text-[10px] text-secondary/40 font-medium mt-1.5">
              Custom note shown in the ticket audit trail.
            </p>
          </div>
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
          <div className="card p-8 bg-white border border-neutral-border shadow-sm h-full">
            <h3 className="text-xl font-bold text-secondary mb-6">
              Mitigation Actions
            </h3>
            <div className="space-y-3">
              {ticket.url && (
                <button
                  id="btn-add-blacklist-url"
                  onClick={() => openBlacklistModal("url", ticket.url!)}
                  className="w-full py-3 bg-neutral-page hover:bg-primary/5 text-sm font-bold text-secondary rounded-xl transition-all text-left px-5 flex items-center justify-between group border border-neutral-border"
                >
                  <span>Block Domain/URL</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">→</span>
                </button>
              )}

              {ticket.bank_account && (
                <button
                  id="btn-add-blacklist-account"
                  onClick={() =>
                    openBlacklistModal("account", ticket.bank_account!, {
                      bank_name: ticket.bank_name,
                    })
                  }
                  className="w-full py-3 bg-neutral-page hover:bg-primary/5 text-sm font-bold text-secondary rounded-xl transition-all text-left px-5 flex items-center justify-between group border border-neutral-border"
                >
                  <span>Block Bank Account</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">→</span>
                </button>
              )}

              {ticket.sender_numbers && (
                <button
                  id="btn-add-blacklist-sender"
                  onClick={() => {
                    const type = ticket.sender_numbers!.includes("@")
                      ? "email"
                      : "phone";
                    openBlacklistModal(type, ticket.sender_numbers!);
                  }}
                  className="w-full py-3 bg-neutral-page hover:bg-primary/5 text-sm font-bold text-secondary rounded-xl transition-all text-left px-5 flex items-center justify-between group border border-neutral-border"
                >
                  <span>
                    Block Sender (
                    {ticket.sender_numbers!.includes("@") ? "Email" : "Phone"})
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">→</span>
                </button>
              )}

              <button className="w-full py-3 bg-neutral-page hover:bg-risk-medium/5 text-sm font-bold text-secondary rounded-xl transition-all text-left px-5 flex items-center justify-between group border border-neutral-border">
                Generate Warning Template
                <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Audit Trail — full width */}
        <div className="lg:col-span-3">
          <AuditTrail logs={auditLogs} loading={auditLoading} />
        </div>
      </div>

      {/* Blacklist Modal */}
      <BlacklistModal
        isOpen={blacklistConfig.isOpen}
        type={blacklistConfig.type}
        value={blacklistConfig.value}
        metadata={blacklistConfig.metadata}
        ticketId={ticket.ticket_id}
        onClose={() => setBlacklistConfig({ ...blacklistConfig, isOpen: false })}
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
        onClose={() => {
          setModalConfig({ ...modalConfig, isOpen: false });
          if (modalConfig.type === "success") {
            router.push("/admin/triage");
          }
        }}
      />
    </div>
  );
}
