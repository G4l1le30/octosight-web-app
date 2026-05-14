"use client";

import { useState } from "react";
import { Ban, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BlacklistModalProps {
  isOpen: boolean;
  url: string;
  ticketId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type SubmitStatus = "idle" | "loading" | "success" | "already" | "error";

export function BlacklistModal({
  isOpen,
  url,
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
      const res = await fetch("/api/v1/admin/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          reason: reason.trim() || "Flagged during investigation",
          ticket_id: ticketId ?? null,
        }),
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-5">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Ban className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-secondary">Add to Blacklist</h2>
            <p className="text-sm text-secondary/90 mt-1">
              Future reports containing this domain will automatically receive a
              maximum risk score.
            </p>
          </div>
        </div>

        {/* URL preview */}
        <div className="bg-neutral-page rounded-xl p-4 border border-neutral-border">
          <p className="text-sm text-secondary font-bold mb-1">
            URL to Blacklist
          </p>
          <p className="text-sm text-secondary font-medium break-all">{url}</p>
        </div>

        {/* Reason input — only shown before submission */}
        {!isResolved && (
          <div>
            <label className="block text-sm font-bold text-secondary mb-2">
              Reason{" "}
              <span className="text-secondary/80 font-medium">(optional)</span>
            </label>
            <textarea
              id="blacklist-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Confirmed phishing domain, brand impersonation..."
              rows={3}
              className="w-full border border-neutral-border rounded-xl px-4 py-3 text-sm text-secondary focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>
        )}

        {/* Status feedback */}
        {status === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-semibold flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Domain successfully added to blacklist. Future reports will be flagged automatically.</span>
          </div>
        )}
        {status === "already" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>This domain is already on the blacklist.</span>
          </div>
        )}
        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-semibold flex items-center gap-2">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>Failed to add domain. Please try again.</span>
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
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                id="blacklist-confirm-btn"
                variant="danger"
                onClick={handleConfirm}
                loading={status === "loading"}
                className="flex-1"
              >
                Confirm Blacklist
              </Button>
            </>
          ) : (
            <Button
              id="blacklist-close-btn"
              variant="outline"
              onClick={handleClose}
              className="w-full"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
