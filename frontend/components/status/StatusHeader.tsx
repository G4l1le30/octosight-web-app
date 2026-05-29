import React from "react";
import { formatDateTime } from "@/lib/utils";
import { Ticket } from "@/types/ticket";
import { Button } from "@/components/ui/Button";

interface StatusHeaderProps {
  result: Ticket;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({ result }) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 mb-8 md:mb-10">
      <div>
        <span className="text-sm font-bold text-secondary tracking-wide">
          Ticket ID
        </span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1">{result.ticket_id}</h2>
        <p className="text-sm font-bold text-secondary/60 mt-2">
          Submitted on {formatDateTime(result.created_at).full}
        </p>
      </div>
      <div className="text-left md:text-right">
        <span className="text-sm font-bold text-secondary tracking-wide">
          Current Status
        </span>
        <div className="mt-2">
          <span
            className={`px-4 py-1.5 rounded-lg text-sm font-bold border ${result.status.toLowerCase() === "submitted"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : result.status.toLowerCase() === "in review"
                ? "bg-orange-50 text-orange-700 border-orange-200"
                : result.status.toLowerCase() === "confirmed"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : result.status.toLowerCase() === "false positive"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : result.status.toLowerCase() === "mitigated"
                      ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                      : result.status.toLowerCase() === "closed"
                        ? "bg-gray-100 text-gray-700 border-gray-200"
                        : "bg-neutral-page text-secondary border-neutral-border"
              }`}
          >
            {result.status}
          </span>
        </div>
      </div>
    </div>
  );
};
