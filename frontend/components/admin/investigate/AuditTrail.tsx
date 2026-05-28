"use client";

import React from "react";
import { TicketAuditLog } from "@/types/ticket";
import { formatDateTime } from "@/lib/utils";
import {
  FileText,
  Search,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Bell,
  StickyNote,
  Info,
} from "lucide-react";

interface AuditTrailProps {
  logs: TicketAuditLog[];
  loading?: boolean;
  submittedAt?: string;
  variant?: "card" | "plain";
}

function getActionIcon(log: TicketAuditLog) {
  const s = log.new_status?.toLowerCase() ?? "";
  const action = log.action_taken?.toLowerCase() ?? "";

  if (action.includes("warning") || action.includes("notification")) return Bell;
  if (action.includes("notes") || action.includes("investigation")) return StickyNote;
  if (s.includes("in review") || s.includes("review")) return Search;
  if (s.includes("confirmed")) return ShieldAlert;
  if (s.includes("mitigated")) return ShieldCheck;
  if (s.includes("closed")) return CheckCircle2;
  if (s.includes("false positive")) return XCircle;

  return FileText;
}

function getStatusBadgeStyle(status: string) {
  const s = status.toLowerCase();
  if (s.includes("in review")) return "bg-orange-50 text-orange-600 border-orange-200";
  if (s.includes("confirmed")) return "bg-red-50 text-red-600 border-red-200";
  if (s.includes("mitigated")) return "bg-cyan-50 text-cyan-600 border-cyan-200";
  if (s.includes("closed")) return "bg-gray-100 text-gray-600 border-gray-300";
  if (s.includes("false positive")) return "bg-green-50 text-green-600 border-green-200";
  if (s.includes("submitted")) return "bg-blue-50 text-blue-600 border-blue-200";
  return "bg-neutral-page text-secondary border-neutral-border";
}

export const AuditTrail: React.FC<AuditTrailProps> = ({
  logs,
  loading = false,
  submittedAt,
  variant = "card"
}) => {
  if (loading) {
    if (variant === "card") {
      return (
        <div className="card p-6 bg-white border border-neutral-border shadow-sm">
          <h3 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
            Audit Trail
          </h3>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="size-8 rounded-full bg-neutral-border flex-shrink-0" />
                <div className="flex-1 space-y-1.5 pt-1">
                  <div className="h-3 bg-neutral-border rounded w-3/4" />
                  <div className="h-2 bg-neutral-border/60 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-neutral-border rounded w-32 mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="size-8 rounded-full bg-neutral-border flex-shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3 bg-neutral-border rounded w-3/4" />
              <div className="h-2 bg-neutral-border/60 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const content = (
    <div className="space-y-0">
      {/* Ticket Submitted (always first if provided) */}
      {submittedAt && (
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="size-8 rounded-full bg-white border-2 border-neutral-border flex items-center justify-center text-secondary shrink-0 z-10 relative">
              <FileText className="size-4" />
            </div>
            {logs.length > 0 && (
              <div className="w-0.5 grow bg-neutral-border/60" />
            )}
          </div>
          <div className="pb-6 min-w-0 flex-1 pt-1.5 flex justify-between items-start gap-4">
            <div>
              <p className="text-sm font-bold text-secondary leading-snug">Report submitted</p>
              <p className="text-xs text-secondary/50 font-medium mt-0.5">
                {formatDateTime(submittedAt).full}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs */}
      {logs.map((log, index) => {
        const isLast = index === logs.length - 1;
        const Icon = getActionIcon(log);

        return (
          <div key={log.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="size-8 rounded-full bg-white border-2 border-neutral-border flex items-center justify-center text-secondary shrink-0 z-10 relative"
              >
                <Icon className="size-4" />
              </div>
              {!isLast && (
                <div className="w-0.5 grow bg-neutral-border/60" />
              )}
            </div>
            <div className="pb-6 min-w-0 flex-1 pt-1.5 flex justify-between items-start gap-4">
              <div>
                <p className="text-sm font-bold text-secondary leading-snug">
                  {log.action_taken}
                </p>
                <p className="text-xs text-secondary/50 font-medium mt-0.5">
                  {log.admin_name} · {formatDateTime(log.created_at).full}
                </p>
                {log.notes && (
                  <div className="mt-2 p-2.5 bg-neutral-page/60 rounded-lg border border-neutral-border/60">
                    <p className="text-xs font-medium text-secondary/70 leading-relaxed">
                      &quot;{log.notes}&quot;
                    </p>
                  </div>
                )}
              </div>
              {log.new_status && (
                <span className={`flex-shrink-0 text-xs font-bold tracking-wide px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(log.new_status)}`}>
                  {log.new_status}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {!submittedAt && logs.length === 0 && (
        <div className="flex items-center w-full text-sm text-secondary/80 font-medium py-4">
          <Info className="size-4 mr-2" />
          No actions recorded yet.
        </div>
      )}
    </div>
  );

  if (variant === "card") {
    return (
      <div className="card p-6 bg-white border border-neutral-border shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
            Audit Trail
          </h3>
          <span className="text-xs font-bold text-secondary/40 bg-neutral-page px-2 py-1 rounded-full border border-neutral-border">
            {logs.length + (submittedAt ? 1 : 0)} {(logs.length + (submittedAt ? 1 : 0)) === 1 ? "entry" : "entries"}
          </span>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-6">
      <h4 className="text-base font-bold text-secondary">
        Audit Trail
      </h4>
      {content}
    </div>
  );
};

