"use client";

import React from "react";
import Link from "next/link";
import { Ticket } from "@/types/ticket";
import { cn, formatDateTime } from "@/lib/utils";

interface ThreatTableProps {
  tickets: Ticket[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const ThreatTable: React.FC<ThreatTableProps> = ({
  tickets,
  loading = false,
  emptyMessage = "No matching reports found.",
  className,
}) => {
  const getStatusBadgeClass = (status: Ticket["status"]) => {
    switch (status) {
      case "Submitted":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "In Review":
        return "bg-amber-50 text-amber-700 border-amber-200";
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

  if (loading) {
    return (
      <div className="py-20 text-center opacity-40 font-bold">
        Loading threat data...
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left">
        <thead className="bg-neutral-page text-sm font-bold text-secondary border-b border-neutral-border">
          <tr>
            <th className="px-6 py-4 w-[20%]">Ticket</th>
            <th className="px-6 py-4 w-[20%]">Indicator / Target</th>
            <th className="px-6 py-4">Priority</th>
            <th className="px-6 py-4">Risk Score</th>
            <th className="px-6 py-4">Key Findings</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-border">
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-10 text-center opacity-40">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="hover:bg-neutral-page/50 transition-colors group"
              >
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-bold text-base text-black">
                      {ticket.ticket_id}
                    </span>
                    <span className="text-xs font-medium text-secondary">
                      {formatDateTime(ticket.created_at).full}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-secondary mb-1">
                      {ticket.type}
                    </span>
                    <span
                      className="text-sm font-medium text-secondary break-all line-clamp-1"
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
                <td className="px-6 py-5">
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
                <td className="px-6 py-5">
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className="text-sm font-bold"
                      style={{
                        color:
                          ticket.risk_score > 70
                            ? "#e31e24"
                            : ticket.risk_score > 30
                              ? "#f97316"
                              : "#00a651",
                      }}
                    >
                      {ticket.risk_score}
                    </span>
                    <div className="w-full max-w-[140px] rounded-full bg-neutral-border h-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${ticket.risk_score}%`,
                          backgroundColor:
                            ticket.risk_score > 70
                              ? "#e31e24"
                              : ticket.risk_score > 30
                                ? "#f97316"
                                : "#00a651",
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-1">
                    {ticket.flags ? (
                      ticket.flags
                        .split(",")
                        .slice(0, 2)
                        .map((f, i) => (
                          <span
                            key={i}
                            className="text-xs font-bold border border-neutral-border text-secondary/80 px-2 py-0.5 rounded"
                          >
                            {f.replace(/_/g, " ")}
                          </span>
                        ))
                    ) : (
                      <span className="text-xs text-secondary/80">None</span>
                    )}
                    {ticket.flags && ticket.flags.split(",").length > 2 && (
                      <span className="text-xs font-bold text-secondary/70">
                        +{ticket.flags.split(",").length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span
                    className={cn(
                      "text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap border",
                      getStatusBadgeClass(ticket.status),
                    )}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <Link
                    href={`/admin/investigate/${ticket.ticket_id}`}
                    className="text-xs font-bold text-secondary hover:text-primary transition-colors bg-white border border-neutral-border px-4 py-2 rounded-xl shadow-sm inline-block"
                  >
                    Investigate
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
