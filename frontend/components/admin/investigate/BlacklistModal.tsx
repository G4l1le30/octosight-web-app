"use client";

import { useState } from "react";
import { Ban, CheckCircle2, AlertTriangle, XCircle, Globe, Phone, Mail, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";

type BlacklistType = "url" | "account" | "phone" | "email";

interface BlacklistModalProps {
  isOpen: boolean;
  type: BlacklistType;
  value: string;
  metadata?: any;
  ticketId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type SubmitStatus = "idle" | "loading" | "success" | "already" | "error";

export function BlacklistModal({
  isOpen,
  type,
  value,
  metadata,
  ticketId,
  onClose,
  onSuccess,
}: BlacklistModalProps) {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setStatus("loading");
    try {
      let endpoint = "/api/v1/admin/blacklist";
      let body: any = {
        reason: reason.trim() || `Flagged during investigation of ticket ${ticketId}`,
        ticket_id: ticketId ?? null,
      };

      if (type === "url") {
        body.url = value;
      } else if (type === "account") {
        endpoint += "/accounts";
        body.account_number = value;
        body.bank_name = metadata?.bank_name || "Unknown Bank";
      } else if (type === "phone") {
        endpoint += "/phones";
        body.phone_number = value;
      } else if (type === "email") {
        endpoint += "/emails";
        body.email = value;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 409) {
        setStatus("already");
      } else if (res.ok) {
        setStatus("success");
        onSuccess?.();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const handleClose = () => {
    setReason("");
    setStatus("idle");
    onClose();
  };

  const isResolved = status === "success" || status === "already" || status === "error";

  const getIcon = () => {
    switch (type) {
      case "url": return <Globe className="w-8 h-8 text-red-600" />;
      case "phone": return <Phone className="w-8 h-8 text-red-600" />;
      case "email": return <Mail className="w-8 h-8 text-red-600" />;
      case "account": return <CreditCard className="w-8 h-8 text-red-600" />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case "url": return "URL Domain";
      case "phone": return "Phone Number";
      case "email": return "Email Address";
      case "account": return "Bank Account";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0 border border-red-100">
            {getIcon()}
          </div>
          <div>
            <h2 className="text-2xl font-black text-secondary tracking-tight">Blacklist {getLabel()}</h2>
            <p className="text-sm text-secondary/60 font-medium mt-1 px-4">
              Adding this will automatically block future reports containing this indicator.
            </p>
          </div>
        </div>

        {/* Value preview */}
        <div className="bg-neutral-page rounded-2xl p-4 border border-neutral-border space-y-1">
          <p className="text-[10px] text-secondary/40 font-black uppercase tracking-widest">
            Indicator to Block
          </p>
          <p className="text-sm text-secondary font-bold break-all">
             {type === "account" && metadata?.bank_name ? `${metadata.bank_name}: ` : ""}{value}
          </p>
        </div>

        {/* Reason input — only shown before submission */}
        {!isResolved && (
          <div>
            <label className="block text-xs font-black text-secondary/40 uppercase tracking-widest mb-2 ml-1">
              Blacklist Reason
            </label>
            <textarea
              id="blacklist-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Why is this ${type} being blacklisted?`}
              rows={3}
              className="w-full border border-neutral-border rounded-2xl px-4 py-3 text-sm text-secondary font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none"
            />
          </div>
        )}

        {/* Status feedback */}
        {status === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-700 font-bold flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Successfully added to global blacklist.</span>
          </div>
        )}
        {status === "already" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700 font-bold flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>Already on the blacklist.</span>
          </div>
        )}
        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 font-bold flex items-center gap-3">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>Failed to process. Try again.</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {!isResolved ? (
            <>
              <Button
                id="blacklist-cancel-btn"
                variant="outline"
                onClick={handleClose}
                className="flex-1 rounded-xl h-12"
              >
                Cancel
              </Button>
              <Button
                id="blacklist-confirm-btn"
                variant="danger"
                onClick={handleConfirm}
                loading={status === "loading"}
                className="flex-1 rounded-xl h-12"
              >
                Confirm Block
              </Button>
            </>
          ) : (
            <Button
              id="blacklist-close-btn"
              variant="outline"
              onClick={handleClose}
              className="w-full rounded-xl h-12"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
