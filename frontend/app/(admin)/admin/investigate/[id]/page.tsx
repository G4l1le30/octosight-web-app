"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket } from "@/types/ticket";
import { StatusModal } from "@/components/ui/StatusModal";

import { InvestigateHeader } from "@/components/admin/investigate/InvestigateHeader";
import { InvestigateTargetInfo } from "@/components/admin/investigate/InvestigateTargetInfo";
import { InvestigateNotes } from "@/components/admin/investigate/InvestigateNotes";
import { DownloadModal } from "@/components/admin/investigate/DownloadModal";
import { InvestigateEvidence } from "@/components/admin/investigate/InvestigateEvidence";

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

  // Download Modal State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [downloadError, setDownloadError] = useState("");

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

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const openDownloadModal = (filename: string) => {
    setSelectedFile(filename);
    setShowDownloadModal(true);
    setDownloadPassword("");
    setDownloadError("");
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
          status: status,
          investigation_notes: notes,
        }),
      });

      if (res.ok) {
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
    } catch (err) {
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

      {/* Main Grid Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ROW 1: Target Indicator & Internal Notes */}
        <div className="lg:col-span-2">
          <InvestigateTargetInfo
            ticket={ticket}
            status={status}
            setStatus={setStatus}
          />
        </div>

        <div className="lg:col-span-1">
          <InvestigateNotes notes={notes} setNotes={setNotes} />
        </div>

        {/* ROW 2: Incident Evidence & Mitigation Actions */}
        <div className="lg:col-span-2">
          <InvestigateEvidence
            ticket={ticket}
            onDownloadAttachment={openDownloadModal}
          />
        </div>

        <div className="lg:col-span-1">
          <div className="card p-8 bg-white border border-neutral-border shadow-sm h-full">
            <h3 className="text-lg font-bold text-secondary mb-6">
              Mitigation Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full py-3 bg-neutral-page hover:bg-primary/5 text-sm font-bold text-secondary rounded-xl transition-all text-left px-5 flex items-center justify-between group border border-neutral-border">
                Add to Internal Blacklist
                <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
                  →
                </span>
              </button>
              <button className="w-full py-3 bg-neutral-page hover:bg-primary/5 text-sm font-bold text-secondary rounded-xl transition-all text-left px-5 flex items-center justify-between group border border-neutral-border">
                Generate Warning Template
                <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
                  →
                </span>
              </button>
              <button className="w-full py-3 bg-neutral-page hover:bg-risk-medium/5 text-sm font-bold text-secondary rounded-xl transition-all text-left px-5 flex items-center justify-between group border border-neutral-border">
                Escalate to SOC Team
                <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <DownloadModal
        isOpen={showDownloadModal}
        downloadPassword={downloadPassword}
        downloadError={downloadError}
        onPasswordChange={setDownloadPassword}
        onConfirm={handleConfirmDownload}
        onCancel={() => setShowDownloadModal(false)}
      />

      {/* Status Dialog Modal */}
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
