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
  Clock,
} from "lucide-react";

interface AuditTrailProps {
  logs: TicketAuditLog[];
  loading: boolean;
}

function getActionIcon(log: TicketAuditLog) {
  const s = log.new_status?.toLowerCase() ?? "";
  const action = log.action_taken.toLowerCase();

  if (action.includes("warning") || action.includes("notification"))
    return <Bell className="size-3.5" />;
  if (action.includes("notes") || action.includes("investigation"))
    return <StickyNote className="size-3.5" />;
  if (s.includes("in review") || s.includes("review"))
    return <Search className="size-3.5" />;
  if (s.includes("confirmed")) return <ShieldAlert className="size-3.5" />;
  if (s.includes("mitigated")) return <ShieldCheck className="size-3.5" />;
  if (s.includes("closed")) return <CheckCircle2 className="size-3.5" />;
  if (s.includes("false positive")) return <XCircle className="size-3.5" />;

  return <FileText className="size-3.5" />;
}

function getActionColor(log: TicketAuditLog): {
  bg: string;
  border: string;
  text: string;
} {
  const s = log.new_status?.toLowerCase() ?? "";
  const action = log.action_taken.toLowerCase();

  if (action.includes("warning") || action.includes("notification"))
    return {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-600",
    };
  if (action.includes("notes"))
    return {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-600",
    };
  if (s.includes("in review"))
    return {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-600",
    };
  if (s.includes("confirmed"))
    return { bg: "bg-red-50", border: "border-red-200", text: "text-red-600" };
  if (s.includes("mitigated"))
    return {
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      text: "text-cyan-600",
    };
  if (s.includes("closed"))
    return {
      bg: "bg-gray-100",
      border: "border-gray-300",
      text: "text-gray-600",
    };
  if (s.includes("false positive"))
    return {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-600",
    };

  return {
    bg: "bg-neutral-page",
    border: "border-neutral-border",
    text: "text-secondary",
  };
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ logs, loading }) => {
  if (loading) {
    return (
      <div className="card p-6 bg-white border border-neutral-border shadow-sm">
        <h3 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
          <Clock className="size-5 text-secondary/40" />
          Audit Trail
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="size-7 rounded-full bg-neutral-border flex-shrink-0" />
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
    <div className="card p-6 bg-white border border-neutral-border shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
          <Clock className="size-5 text-secondary/60" />
          Audit Trail
        </h3>
        <span className="text-xs font-bold text-secondary/40 bg-neutral-page px-2 py-1 rounded-full border border-neutral-border">
          {logs.length} {logs.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-6">
          <Clock className="size-10 text-secondary/20 mx-auto mb-2" />
          <p className="text-sm font-medium text-secondary/40">
            No actions recorded yet.
          </p>
          <p className="text-xs text-secondary/40 mt-1">
            Updates will appear here after saving changes.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-neutral-border/60" />

          <div className="space-y-0">
            {logs.map((log, index) => {
              const isLast = index === logs.length - 1;
              const color = getActionColor(log);
              const icon = getActionIcon(log);

              return (
                <div
                  key={log.id}
                  className={`flex gap-3 ${!isLast ? "pb-4" : ""}`}
                >
                  {/* Icon node */}
                  <div
                    className={`relative z-10 size-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${color.bg} ${color.border} ${color.text}`}
                  >
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-secondary leading-snug">
                        {log.action_taken}
                      </p>
                      {log.new_status && (
                        <span
                          className={`flex-shrink-0 text-xs font-bold tracking-wide px-2 py-0.5 rounded-full border ${color.bg} ${color.border} ${color.text}`}
                        >
                          {log.new_status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-secondary/60">
                        {log.admin_name}
                      </span>
                      <span className="text-secondary/20">·</span>
                      <span className="text-xs text-secondary/60 font-medium">
                        {formatDateTime(log.created_at).full}
                      </span>
                    </div>

                    {log.notes && (
                      <div className="mt-2 p-2.5 bg-neutral-page/60 rounded-lg border border-neutral-border/60">
                        <p className="text-xs font-medium text-secondary/70 leading-relaxed">
                          &quot;{log.notes}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
