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
  Info,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { AuditTrail } from "@/components/admin/investigate/AuditTrail";

interface TicketTimelineProps {
  auditLogs: TicketAuditLog[];
  currentStatus: TicketStatus;
  submittedAt: string;
}

const STATUS_STAGES: {
  key: TicketStatus;
  label: string;
  Icon: LucideIcon;
  color: string;
  bgColor: string;
  ringColor: string;
  borderColor: string;
}[] = [
  {
    key: "Submitted",
    label: "Submitted",
    Icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    ringColor: "ring-blue-200",
    borderColor: "border-blue-200",
  },
  {
    key: "In Review",
    label: "In Review",
    Icon: Search,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    ringColor: "ring-orange-200",
    borderColor: "border-orange-200",
  },
  {
    key: "Confirmed",
    label: "Confirmed",
    Icon: ShieldAlert,
    color: "text-red-600",
    bgColor: "bg-red-50",
    ringColor: "ring-red-200",
    borderColor: "border-red-200",
  },
  {
    key: "Mitigated",
    label: "Mitigated",
    Icon: ShieldCheck,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    ringColor: "ring-cyan-200",
    borderColor: "border-cyan-200",
  },
  {
    key: "Closed",
    label: "Closed",
    Icon: CheckCircle2,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    ringColor: "ring-gray-200",
    borderColor: "border-gray-300",
  },
];

const FALSE_POSITIVE_STAGE = {
  key: "False Positive" as TicketStatus,
  label: "False Positive",
  Icon: XCircle,
  color: "text-green-600",
  bgColor: "bg-green-50",
  ringColor: "ring-green-200",
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
} {
  const all = [...STATUS_STAGES, FALSE_POSITIVE_STAGE];
  const found = all.find((s) => s.key === status);
  if (found) {
    return {
      Icon: found.Icon,
      color: found.color,
      bgColor: found.bgColor,
    };
  }
  return {
    Icon: Clock,
    color: "text-secondary",
    bgColor: "bg-neutral-page",
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
    <div className="space-y-4 md:space-y-6">
      {/* Status Progress Bar */}
      <div className="overflow-x-auto pb-3 md:pb-4 pt-1.5 md:pt-2 px-1.5 md:px-2">
        <div className="relative flex items-start justify-between min-w-[600px] w-full px-6 md:px-8">
          {/* Connector Line behind circles */}
          <div className="absolute top-6 left-14 right-14 h-0.5 bg-neutral-border z-0">
            {/* Active/Completed Line part */}
            <div
              className="h-full bg-secondary/30 transition-all duration-500 rounded"
              style={{
                width: `${stages.length > 1 ? (Math.max(0, currentStageIndex) / (stages.length - 1)) * 100 : 0}%`,
              }}
            />
          </div>

          {stages.map((stage, index) => {
            const isDone = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isPending = index > currentStageIndex;

            return (
              <div
                key={stage.key}
                className="relative z-10 flex flex-col items-center gap-1.5 md:gap-2"
              >
                <div
                  className={`
                    size-12 shrink-0 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold text-xs bg-white
                    ${isDone ? `${stage.bgColor} ${stage.color} ${stage.borderColor}` : ""}
                    ${isCurrent ? `${stage.bgColor} ${stage.color} ${stage.borderColor} ring-4 ${stage.ringColor} ring-offset-2` : ""}
                    ${isPending ? "bg-white text-secondary/60 border-neutral-border" : ""}
                  `}
                >
                  <stage.Icon className="size-5" />
                </div>
                <span
                  className={`text-xs font-bold text-center leading-tight whitespace-nowrap
                  ${isCurrent ? "text-secondary font-extrabold" : isPending ? "text-secondary/60" : "text-secondary/60"}`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Activity Log */}
      <AuditTrail
        logs={auditLogs}
        loading={false}
        submittedAt={submittedAt}
        variant="plain"
      />
    </div>
  );
};
