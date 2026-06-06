"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Ticket } from "@/types/ticket";
import { cn, formatDateTime } from "@/lib/utils";
import { RISK } from "@/constants/colors";
import { usePermissions } from "@/hooks/usePermissions";

interface ThreatTableProps {
  tickets: Ticket[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onAssign?: (ticketId: string, email: string) => void;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
  onSort?: (column: string) => void;
  sortBy?: string;
  sortDir?: string;
}

export const ThreatTable: React.FC<ThreatTableProps> = ({
  tickets,
  loading = false,
  emptyMessage = "No matching reports found.",
  className,
  onAssign,
  selectedIds = [],
  onSelectionChange,
  onSort,
  sortBy,
  sortDir,
}) => {
  const { can } = usePermissions();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTicketId, setAssignTicketId] = useState<string | null>(null);
  const [assignEmail, setAssignEmail] = useState("");
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const allVisibleSelected =
    tickets.length > 0 && tickets.every((t) => selectedIds.includes(t.id));
  const someVisibleSelected = tickets.some((t) => selectedIds.includes(t.id));

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allVisibleSelected) {
      onSelectionChange(
        selectedIds.filter((id) => !tickets.some((t) => t.id === id)),
      );
    } else {
      const newIds = [...selectedIds];
      tickets.forEach((t) => {
        if (!newIds.includes(t.id)) newIds.push(t.id);
      });
      onSelectionChange(newIds);
    }
  };

  const handleSelectOne = (id: number) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const getStatusBadgeClass = (status: Ticket["status"]) => {
    switch (status) {
      case "Submitted":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "In Review":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Need More Info":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Confirmed":
        return "bg-red-50 text-red-700 border-red-200";
      case "False Positive":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Mitigated":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "Closed":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-neutral-page text-secondary border-neutral-border";
    }
  };

  const openAssignModal = (ticketId: string) => {
    setAssignTicketId(ticketId);
    setAssignEmail("");
    setAssignModalOpen(true);
  };

  const handleAssignConfirm = async () => {
    if (!assignEmail.trim() || !onAssign || !assignTicketId) return;
    await onAssign(assignTicketId, assignEmail.trim());
    setAssignModalOpen(false);
    setAssignTicketId(null);
    setAssignEmail("");
  };

  if (loading) {
    return (
      <div className="py-14 md:py-20 text-center opacity-40 font-semibold">
        Loading threat data...
      </div>
    );
  }

  const colSpan = onSelectionChange ? 10 : 9;

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left">
        <thead className="bg-neutral-page text-xs md:text-sm font-bold text-secondary border-b border-neutral-border">
          <tr>
            {onSelectionChange && (
              <th className="px-2 md:px-3 py-3 md:py-4 w-6 md:w-8">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={handleSelectAll}
                  className="accent-primary cursor-pointer"
                />
              </th>
            )}
            <th className="px-4 md:px-6 py-3 md:py-4 w-[35%] cursor-pointer select-none" onClick={() => onSort?.("ticket_id")}>
              Ticket {sortBy === "ticket_id" && (sortDir === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 md:px-6 py-3 md:py-4 w-[25%] cursor-pointer select-none" onClick={() => onSort?.("url")}>
              Indicator / Target {sortBy === "url" && (sortDir === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 md:px-6 py-3 md:py-4 text-center cursor-pointer select-none" onClick={() => onSort?.("priority")}>
              Priority {sortBy === "priority" && (sortDir === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 md:px-6 py-3 md:py-4 text-center cursor-pointer select-none" onClick={() => onSort?.("risk_score")}>
              Risk Score {sortBy === "risk_score" && (sortDir === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 md:px-6 py-3 md:py-4 text-center">Key Findings</th>
            <th className="px-4 md:px-6 py-3 md:py-4 text-center cursor-pointer select-none" onClick={() => onSort?.("status")}>
              Status {sortBy === "status" && (sortDir === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 md:px-6 py-3 md:py-4 text-center w-[100px]">SLA</th>
            <th className="px-4 md:px-6 py-3 md:py-4 text-center w-[110px]">Assignee</th>
            <th className="px-4 md:px-6 py-3 md:py-4 text-center w-[90px]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-border">
          {tickets.length === 0 ? (
            <tr>
              <td
                colSpan={colSpan}
                className="px-4 md:px-6 py-8 md:py-10 text-center opacity-40"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            tickets.map((ticket, index) => (
              <tr
                key={ticket.id ?? ticket.ticket_id ?? `ticket-${index}`}
                className="hover:bg-neutral-page/50 transition-colors group"
              >
                {onSelectionChange && (
                  <td className="px-4 md:px-6 py-4 md:py-5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(ticket.id)}
                      onChange={() => handleSelectOne(ticket.id)}
                      className="accent-primary cursor-pointer"
                    />
                  </td>
                )}
                <td className="px-4 md:px-6 py-4 md:py-5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <span className="font-bold text-sm md:text-base text-black">
                        {ticket.ticket_id}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-secondary">
                      {formatDateTime(ticket.created_at).full}
                    </span>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-secondary mb-0.5 md:mb-1">
                      {ticket.type}
                    </span>
                    <span
                      className="text-xs md:text-sm font-medium text-secondary break-all line-clamp-1"
                      title={
                        ticket.type === "SMS" || ticket.type === "WhatsApp"
                          ? ticket.sender_numbers || "N/A"
                          : ticket.url || "N/A"
                      }
                    >
                      {ticket.type === "SMS" || ticket.type === "WhatsApp"
                        ? ticket.sender_numbers || "N/A"
                        : ticket.url || "N/A"}
                    </span>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                  <span
                    className={cn(
                      "text-xs font-bold tracking-wide",
                      ticket.priority === "High"
                        ? "text-risk-high"
                        : ticket.priority === "Medium"
                          ? "text-risk-medium"
                          : "text-risk-low",
                    )}
                  >
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                  <div className="flex flex-col items-center gap-1.5 md:gap-2">
                    <span
                      className="text-xs md:text-sm font-bold"
                      style={{
                        color:
                          ticket.risk_score >= 75
                            ? RISK.high.hex
                            : ticket.risk_score >= 35
                              ? RISK.medium.hex
                              : RISK.low.hex,
                      }}
                    >
                      {ticket.risk_score}
                    </span>
                    <div className="w-full max-w-[140px] rounded-full bg-neutral-border h-0.5 md:h-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${ticket.risk_score}%`,
                          backgroundColor:
                            ticket.risk_score >= 75
                              ? RISK.high.hex
                              : ticket.risk_score >= 35
                                ? RISK.medium.hex
                                : RISK.low.hex,
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                  <div className="flex flex-wrap gap-0.5 md:gap-1 justify-center">
                    {ticket.flags ? (
                      ticket.flags
                        .split(",")
                        .slice(0, 2)
                        .map((f, i) => (
                          <span
                            key={i}
                            className="text-xs font-bold border border-neutral-border text-secondary/80 px-1.5 md:px-2 py-0.5 rounded"
                          >
                            {f.replace(/_/g, " ")}
                          </span>
                        ))
                    ) : (
                      <span className="text-xs text-secondary/80">None</span>
                    )}
                    {ticket.flags && ticket.flags.split(",").length > 2 && (
                      <span className="text-xs font-bold text-secondary/80">
                        +{ticket.flags.split(",").length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                  <span
                    className={cn(
                      "text-xs font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full whitespace-nowrap border",
                      getStatusBadgeClass(ticket.status),
                    )}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                  {ticket.sla_breached ? (
                    <span className="text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 inline-flex items-center gap-0.5 md:gap-1">
                      Breached
                    </span>
                  ) : ticket.sla_deadline ? (
                    <span className="text-xs font-medium text-secondary">
                      {(() => {
                        const deadline = new Date(ticket.sla_deadline);
                        const now = new Date();
                        const diffMs = deadline.getTime() - now.getTime();
                        if (diffMs <= 0) return "Expired";
                        const diffHrs = Math.floor(diffMs / 3600000);
                        const diffMins = Math.floor((diffMs % 3600000) / 60000);
                        if (diffHrs > 0) return `${diffHrs}h ${diffMins}m left`;
                        return `${diffMins}m left`;
                      })()}
                    </span>
                  ) : (
                    <span className="text-xs text-secondary/60">N/A</span>
                  )}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                  <span
                    className="text-xs font-medium text-secondary truncate max-w-[120px] block"
                    title={ticket.assigned_to || undefined}
                  >
                    {ticket.assigned_to || "None"}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                  <div className="flex flex-col items-center gap-1 md:gap-1.5">
                    <Link
                      href={`/admin/investigate/${ticket.ticket_id}`}
                      className="text-xs font-bold text-white bg-primary px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg hover:opacity-90 transition-all w-full text-center"
                    >
                      Investigate
                    </Link>
                    {onAssign && can("tickets.assign") && (
                      <button
                        onClick={() => openAssignModal(ticket.ticket_id)}
                        className="text-xs font-bold border border-neutral-border px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg hover:bg-neutral-page transition-colors w-full text-center"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Assign Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setAssignModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl md:rounded-2xl shadow-xl w-full max-w-md p-4 md:p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base md:text-lg font-bold text-secondary mb-0.5 md:mb-1">
              Assign Ticket
            </h3>
            <p className="text-xs md:text-sm text-secondary/60 mb-3 md:mb-4">
              Assigning{" "}
              <span className="font-bold text-secondary">{assignTicketId}</span>{" "}
              to an analyst.
            </p>
            <label className="text-xs font-bold text-secondary block mb-1 md:mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAssignConfirm();
              }}
              placeholder="analyst@domain.com"
              className="w-full border border-neutral-border rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all mb-3 md:mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-1.5 md:gap-2">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold text-secondary hover:bg-neutral-page rounded-lg md:rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignConfirm}
                disabled={!assignEmail.trim()}
                className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg md:rounded-xl transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
