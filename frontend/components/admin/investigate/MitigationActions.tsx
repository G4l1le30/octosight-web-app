import React from "react";
import { Ticket } from "@/types/ticket";

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
          onClick={onNotify}
          className="w-full py-3 bg-neutral-page hover:bg-risk-medium/5 text-sm font-bold text-secondary rounded-xl transition-all text-left px-5 flex items-center justify-between group border border-neutral-border"
        >
          Generate Warning Template
          <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
            →
          </span>
        </button>
      </div>
    </div>
  );
};
