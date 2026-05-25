"use client";

import React from "react";
import { TicketAuditLog, TicketStatus } from "@/types/ticket";
import { formatDateTime } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  FileText,
  type LucideIcon,
} from "lucide-react";

interface TicketTimelineProps {
  auditLogs: TicketAuditLog[];
  currentStatus: TicketStatus;
  submittedAt: string;
}

// Ordered status stages with metadata
const STATUS_STAGES: {
  key: TicketStatus;
  label: string;
  Icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
    {
      key: "Submitted",
      label: "Submitted",
      Icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      key: "In Review",
      label: "In Review",
      Icon: Search,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      key: "Confirmed",
      label: "Confirmed",
      Icon: ShieldAlert,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      key: "Mitigated",
      label: "Mitigated",
      Icon: ShieldCheck,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
    },
    {
      key: "Closed",
      label: "Closed",
      Icon: CheckCircle2,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-200",
    },
  ];

const FALSE_POSITIVE_STAGE = {
  key: "False Positive" as TicketStatus,
  label: "False Positive",
  Icon: XCircle,
  color: "text-green-600",
  bgColor: "bg-green-50",
  borderColor: "border-green-200",
};

function getStageIndex(status: TicketStatus): number {
  if (status === "False Positive") return -1;
  return STATUS_STAGES.findIndex((s) => s.key === status);
}

function getStatusMeta(status: string): {
  Icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  const all = [...STATUS_STAGES, FALSE_POSITIVE_STAGE];
  const found = all.find((s) => s.key === status);
  if (found) {
    return {
      Icon: found.Icon,
      color: found.color,
      bgColor: found.bgColor,
      borderColor: found.borderColor,
    };
  }
  return {
    Icon: Clock,
    color: "text-secondary",
    bgColor: "bg-neutral-page",
    borderColor: "border-neutral-border",
  };
}

export const TicketTimeline: React.FC<TicketTimelineProps> = ({
  auditLogs,
  currentStatus,
  submittedAt,
}) => {
  const isFalsePositive = currentStatus === "False Positive";
  const stages = isFalsePositive
    ? [STATUS_STAGES[0], STATUS_STAGES[1], FALSE_POSITIVE_STAGE]
    : STATUS_STAGES;

  const currentStageIndex = isFalsePositive
    ? stages.findIndex((s) => s.key === currentStatus)
    : getStageIndex(currentStatus);

  return (
    <div className="space-y-6">
      {/* Status Progress Bar */}
      <div className="overflow-x-auto pb-4 pt-2 px-2">
        <div className="flex items-center min-w-max gap-0">
          {stages.map((stage, index) => {
            const isDone = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isPending = index > currentStageIndex;

            return (
              <React.Fragment key={stage.key}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`
                      size-12 shrink-0 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold text-xs
                      ${isDone ? `${stage.bgColor} ${stage.borderColor} ${stage.color}` : ""}
                      ${isCurrent ? `${stage.bgColor} ${stage.borderColor} ${stage.color} ring-4 ring-offset-2 ring-current/20` : ""}
                      ${isPending ? "bg-neutral-page border-neutral-border text-secondary/30" : ""}
                    `}
                  >
                    {isDone ? (
                      <CheckCircle2 className="size-5" />
                    ) : (
                      <stage.Icon className="size-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold text-center max-w-[64px] leading-tight
                    ${isCurrent ? stage.color : isPending ? "text-secondary/30" : "text-secondary/60"}`}
                  >
                    {stage.label}
                  </span>
                </div>
                {index < stages.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 min-w-[24px] mx-1 rounded transition-all duration-500 ${isDone ? "bg-secondary/30" : "bg-neutral-border"
                      }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Timeline Activity Log */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-secondary tracking-wide">
          Activity Log
        </h4>

        {/* Ticket Submitted (always first) */}
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-0">
            <div className="size-8 rounded-full bg-white border-2 border-neutral-border flex items-center justify-center text-secondary shrink-0">
              <FileText className="size-4" />
            </div>
            {auditLogs.length > 0 && (
              <div className="w-0.5 h-full min-h-[16px] bg-neutral-border/60 mt-1" />
            )}
          </div>
          <div className="pb-4 min-w-0 flex-1">
            <p className="text-sm font-bold text-secondary">
              Report submitted
            </p>
            <p className="text-xs text-secondary/50 font-medium mt-0.5">
              {formatDateTime(submittedAt).full}
            </p>
          </div>
        </div>

        {/* Audit Logs */}
        {auditLogs.map((log, index) => {
          const isLast = index === auditLogs.length - 1;
          const statusMeta = log.new_status
            ? getStatusMeta(log.new_status)
            : {
              Icon: FileText,
              color: "text-secondary",
              bgColor: "bg-neutral-page",
              borderColor: "border-neutral-border",
            };

          return (
            <div key={log.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`size-8 rounded-full bg-white border-2 border-neutral-border flex items-center justify-center text-secondary shrink-0`}
                >
                  <statusMeta.Icon className="size-4" />
                </div>
                {!isLast && (
                  <div className="w-0.5 h-full min-h-[16px] bg-neutral-border/60 mt-1" />
                )}
              </div>
              <div className="pb-4 min-w-0 flex-1">
                <p className="text-sm font-bold text-secondary">
                  {log.action_taken}
                </p>
                <p className="text-xs text-secondary/50 font-medium mt-0.5">
                  {log.admin_name} · {formatDateTime(log.created_at).full}
                </p>
                {log.notes && (
                  <div className="mt-2 p-2.5 bg-neutral-page/60 rounded-lg border border-neutral-border/60">
                    <p className="text-xs font-medium text-secondary/70 leading-relaxed italic">
                      &quot;{log.notes}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {auditLogs.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-secondary/40 font-medium py-2">
            <AlertTriangle className="size-3.5" />
            Your report is awaiting review by our security team.
          </div>
        )}
      </div>
    </div>
  );
};
