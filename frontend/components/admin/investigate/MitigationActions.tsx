import React, { useState, useEffect, useCallback } from "react";
import { Ticket } from "@/types/ticket";
import { toast } from "sonner";

interface MitigationActionsProps {
  ticket: Ticket;
  openBlacklistModal: (
    type: "url" | "account" | "phone" | "email",
    value: string,
    metadata?: any
  ) => void;
  onNotify?: () => void;
  onScanUrl?: () => void;
}

export const MitigationActions: React.FC<MitigationActionsProps> = ({
  ticket,
  openBlacklistModal,
  onNotify,
  onScanUrl,
}) => {
  const [assignModal, setAssignModal] = useState(false);
  const [assignEmail, setAssignEmail] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [registeredEmails, setRegisteredEmails] = useState<string[]>([]);

  const fetchEmails = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/users");
      if (res.ok) {
        const users = await res.json();
        setRegisteredEmails(users.map((u: any) => u.email).filter(Boolean));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (assignModal) fetchEmails();
  }, [assignModal, fetchEmails]);

  const handleAssign = async () => {
    if (!assignEmail.trim()) {
      toast.error("Please enter an email address.");
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch(`/api/v1/tickets/${ticket.ticket_id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: assignEmail.trim() }),
      });
      if (res.ok) {
        toast.success(`Ticket assigned to ${assignEmail.trim()}. Notification sent.`);
        setAssignModal(false);
        setAssignEmail("");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Failed to assign ticket.");
      }
    } catch {
      toast.error("Connection error.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="card p-6 md:p-8 h-full flex flex-col">
      <h3 className="text-lg md:text-xl font-bold text-secondary mb-4 md:mb-6">
        Mitigation Actions
      </h3>
      <div className="space-y-3">
        {ticket.url && ticket.url.trim() !== "" && ticket.url !== "N/A" && (
          <button
            id="btn-add-blacklist-url"
            onClick={() => openBlacklistModal("url", ticket.url!)}
            className="w-full py-3 bg-neutral-page hover:bg-primary/5 text-sm font-bold text-secondary rounded-xl transition-all text-left px-5 flex items-center justify-between group border border-neutral-border"
          >
            <span>Block Domain/URL</span>
            <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
              →
            </span>
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
            <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
              →
            </span>
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
              Block Sender ({ticket.sender_numbers!.includes("@") ? "Email" : "Phone"})
            </span>
            <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
              →
            </span>
          </button>
        )}

        <button
          onClick={() => {
            setAssignEmail(ticket.assigned_to || "");
            setAssignModal(true);
          }}
          className="w-full py-3 bg-neutral-page hover:bg-risk-medium/5 text-sm font-bold text-secondary rounded-xl transition-all text-left px-5 flex items-center justify-between group border border-neutral-border"
        >
          <span>{ticket.assigned_to ? "Reassign Ticket" : "Add Assignee"}</span>
          <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
            →
          </span>
        </button>

        {ticket.url && ticket.url.trim() !== "" && ticket.url !== "N/A" && onScanUrl && (
          <button
            onClick={onScanUrl}
            className="w-full py-3 bg-neutral-page hover:bg-blue-50 text-sm font-bold text-secondary rounded-xl transition-all text-left px-5 flex items-center justify-between group border border-neutral-border"
          >
            Re-scan URL
            <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
              →
            </span>
          </button>
        )}
      </div>

      {/* Assignee Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8 border border-neutral-border animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-secondary mb-2">Assign Ticket</h2>
            <p className="text-sm text-secondary/60 mb-4">Enter a registered user email to assign this ticket. An email notification will be sent.</p>
            <div className="relative">
              <input
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                placeholder="user@example.com"
                list="registered-emails"
                className="w-full border-2 border-neutral-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 mb-4"
              />
              <datalist id="registered-emails">
                {registeredEmails.map((email) => (
                  <option key={email} value={email} />
                ))}
              </datalist>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setAssignModal(false)} disabled={assigning} className="px-5 py-2.5 bg-white border-2 border-neutral-border text-secondary font-bold text-sm rounded-xl hover:bg-neutral-page transition-all disabled:opacity-50">Cancel</button>
              <button onClick={handleAssign} disabled={assigning} className="px-5 py-2.5 bg-secondary text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-md">
                {assigning ? "Assigning..." : "Assign & Notify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
