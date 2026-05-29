"use client";

import { useState, useEffect, useRef } from "react";
import { Ban, CheckCircle2, AlertTriangle, XCircle, Globe, Phone, Mail, CreditCard, Loader2 } from "lucide-react";
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

type SubmitStatus = "form" | "success" | "already" | "error";

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
  const [status, setStatus] = useState<SubmitStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevOpenRef = useRef(false);

  // Detect first render after isOpen becomes true → reset state immediately
  if (isOpen && !prevOpenRef.current) {
    setStatus(null);
    setReason("");
    setIsSubmitting(false);
  }
  prevOpenRef.current = isOpen;

  useEffect(() => {
    if (!isOpen) return;
    const check = async () => {
      let url = "";
      if (type === "url") {
        url = `/api/v1/admin/blacklist/check?url=${encodeURIComponent(value)}`;
      } else if (type === "account") {
        url = `/api/v1/admin/blacklist/accounts/check?account_number=${encodeURIComponent(value)}`;
      } else if (type === "phone") {
        url = `/api/v1/admin/blacklist/phones/check?phone_number=${encodeURIComponent(value)}`;
      } else if (type === "email") {
        url = `/api/v1/admin/blacklist/emails/check?email=${encodeURIComponent(value)}`;
      }

      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.is_blacklisted) {
            setStatus("already");
            return;
          }
        }
      } catch {
        // Non-fatal — proceed to show form
      }
      setStatus("form");
    };

    check();
  }, [isOpen, type, value]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
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
    onClose();
  };

  const isResolved = status === "success" || status === "already" || status === "error";

  const getIcon = () => {
    switch (type) {
      case "url": return <Globe className="w-8 h-8 text-secondary" />;
      case "phone": return <Phone className="w-8 h-8 text-secondary" />;
      case "email": return <Mail className="w-8 h-8 text-secondary" />;
      case "account": return <CreditCard className="w-8 h-8 text-secondary" />;
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 md:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col h-[440px] p-6 md:p-8 animate-in zoom-in-95 duration-200">
        {/* Header — fixed at top */}
        <div className="flex flex-col items-center text-center gap-2 md:gap-3 shrink-0">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-neutral-page flex items-center justify-center border border-neutral-border">
            {getIcon()}
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-secondary tracking-tight">Blacklist {getLabel()}</h2>
            {status !== null && (
              <p className="text-xs text-secondary/60 font-medium mt-1 px-2">
                Adding this will automatically block future reports containing this indicator.
              </p>
            )}
          </div>
        </div>

        {/* Content — flex-1, centered */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {status === null && (
            <div className="flex items-center justify-center gap-2 md:gap-3 py-6 md:py-8">
              <Loader2 className="size-5 animate-spin text-secondary" />
              <span className="text-sm font-semibold text-secondary/70">Checking blacklist...</span>
            </div>
          )}

          {status === "form" && (
            <div className="w-full space-y-4">
              <div className="bg-neutral-page rounded-2xl p-3 md:p-4 border border-neutral-border space-y-1 text-left">
                <p className="text-sm text-secondary font-bold tracking-wide">Indicator to Block</p>
                <p className="text-sm text-secondary font-medium break-all">
                  {type === "account" && metadata?.bank_name ? `${metadata.bank_name}: ` : ""}{value}
                </p>
              </div>
              <div className="text-left">
                <label className="block text-sm font-bold text-secondary tracking-wide mb-2 ml-1">
                  Blacklist Reason
                </label>
                <textarea
                  id="blacklist-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`Why is this ${type} being blacklisted?`}
                  rows={3}
                  className="w-full border border-neutral-border rounded-2xl px-4 py-3 text-sm text-secondary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-3 md:p-4 text-sm text-green-700 font-bold flex items-start gap-2 md:gap-3 w-full text-left">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Successfully added to global blacklist.</span>
            </div>
          )}
          {status === "already" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 md:p-4 text-sm text-amber-700 font-bold flex items-center gap-2 md:gap-3 w-full">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>Already on the blacklist.</span>
            </div>
          )}
          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 md:p-4 text-sm text-red-700 font-bold flex items-center gap-2 md:gap-3 w-full">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <span>Failed to process. Try again.</span>
            </div>
          )}
        </div>

        {/* Actions — fixed at bottom */}
        <div className="flex gap-2 md:gap-3 shrink-0 pt-4">
          {status === null ? null : status === "form" ? (
            <>
              <Button
                id="blacklist-cancel-btn"
                variant="outline"
                onClick={handleClose}
                className="flex-1 rounded-xl h-11"
              >
                Cancel
              </Button>
              <Button
                id="blacklist-confirm-btn"
                variant="danger"
                onClick={handleConfirm}
                loading={isSubmitting}
                className="flex-1 rounded-xl h-11"
              >
                Block
              </Button>
            </>
          ) : (
            <Button
              id="blacklist-close-btn"
              variant="outline"
              onClick={handleClose}
              className="w-full rounded-xl h-11"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
