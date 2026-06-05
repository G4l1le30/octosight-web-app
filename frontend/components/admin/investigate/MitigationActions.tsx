import React, { useState, useEffect, useCallback } from "react";
import { Ticket } from "@/types/ticket";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

interface MitigationActionsProps {
  ticket: Ticket;
  openBlacklistModal: (
    type: "url" | "account" | "phone" | "email",
    value: string,
    metadata?: any
  ) => void;
  onNotify?: () => void;
}

export const MitigationActions: React.FC<MitigationActionsProps> = ({
  ticket,
  openBlacklistModal,
  onNotify,
}) => {
  const { can } = usePermissions();
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
      <div className="space-y-2 md:space-y-3">
        {can("blacklist.add") && ticket.url && ticket.url.trim() !== "" && ticket.url !== "N/A" && (
          <button
            id="btn-add-blacklist-url"
            onClick={() => openBlacklistModal("url", ticket.url!)}
            className="w-full py-2 md:py-3 bg-neutral-page hover:bg-primary/5 text-xs md:text-sm font-bold text-secondary rounded-lg md:rounded-xl transition-all text-left px-4 md:px-5 flex items-center justify-between group border border-neutral-border"
          >
            <span>Block Domain/URL</span>
            <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
              →
            </span>
          </button>
        )}

        {can("blacklist.add") && ticket.bank_account && (
          <button
            id="btn-add-blacklist-account"
            onClick={() =>
              openBlacklistModal("account", ticket.bank_account!, {
                bank_name: ticket.bank_name,
              })
            }
            className="w-full py-2 md:py-3 bg-neutral-page hover:bg-primary/5 text-xs md:text-sm font-bold text-secondary rounded-lg md:rounded-xl transition-all text-left px-4 md:px-5 flex items-center justify-between group border border-neutral-border"
          >
            <span>Block Bank Account</span>
            <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
              →
            </span>
          </button>
        )}

        {can("blacklist.add") && ticket.sender_numbers && (
          <button
            id="btn-add-blacklist-sender"
            onClick={() => {
              const type = ticket.sender_numbers!.includes("@")
                ? "email"
                : "phone";
              openBlacklistModal(type, ticket.sender_numbers!);
            }}
            className="w-full py-2 md:py-3 bg-neutral-page hover:bg-primary/5 text-xs md:text-sm font-bold text-secondary rounded-lg md:rounded-xl transition-all text-left px-4 md:px-5 flex items-center justify-between group border border-neutral-border"
          >
            <span>
              Block Sender ({ticket.sender_numbers!.includes("@") ? "Email" : "Phone"})
            </span>
            <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
              →
            </span>
          </button>
        )}

        {can("tickets.assign") && (
          <button
            onClick={() => {
              setAssignEmail(ticket.assigned_to || "");
              setAssignModal(true);
            }}
            className="w-full py-2 md:py-3 bg-neutral-page hover:bg-risk-medium/5 text-xs md:text-sm font-bold text-secondary rounded-lg md:rounded-xl transition-all text-left px-4 md:px-5 flex items-center justify-between group border border-neutral-border"
          >
            <span>{ticket.assigned_to ? "Reassign Ticket" : "Add Assignee"}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
              →
            </span>
          </button>
        )}
      </div>

      {/* Assignee Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4" onClick={() => setAssignModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8 border border-neutral-border animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base md:text-lg font-bold text-secondary mb-1.5 md:mb-2">Assign Ticket</h2>
            <p className="text-xs md:text-sm text-secondary/60 mb-3 md:mb-4">Enter a registered user email to assign this ticket. An email notification will be sent.</p>
            <div className="relative">
              <input
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full border-2 border-neutral-border rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 mb-1.5 md:mb-2"
              />
              {assignEmail && registeredEmails.filter(e => e.toLowerCase().includes(assignEmail.toLowerCase())).length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-neutral-border rounded-lg md:rounded-xl shadow-lg max-h-32 md:max-h-40 overflow-y-auto mb-1.5 md:mb-2">
                  {registeredEmails
                    .filter(e => e.toLowerCase().includes(assignEmail.toLowerCase()))
                    .slice(0, 5)
                    .map((email) => (
                      <button
                        key={email}
                        type="button"
                        onClick={() => setAssignEmail(email)}
                        className="w-full text-left px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-secondary hover:bg-neutral-page transition-colors"
                      >
                        {email}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 md:gap-3">
              <button onClick={() => setAssignModal(false)} disabled={assigning} className="px-4 md:px-5 py-2 md:py-2.5 bg-white border-2 border-neutral-border text-secondary font-bold text-xs md:text-sm rounded-lg md:rounded-xl hover:bg-neutral-page transition-all disabled:opacity-50">Cancel</button>
              <button onClick={handleAssign} disabled={assigning} className="px-4 md:px-5 py-2 md:py-2.5 bg-secondary text-white font-bold text-xs md:text-sm rounded-lg md:rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-md">
                {assigning ? "Assigning..." : "Assign & Notify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
