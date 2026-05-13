import React from "react";
import { Ticket } from "@/types/ticket";

interface InvestigateTargetInfoProps {
  ticket: Ticket;
  status: string;
  setStatus: (status: string) => void;
}

export const InvestigateTargetInfo: React.FC<InvestigateTargetInfoProps> = ({
  ticket,
  status,
  setStatus,
}) => {
  return (
    <div className="card p-8 h-full flex flex-col">
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-secondary">
            Target Indicator
          </h3>
          <p className="text-xl font-medium text-primary break-all">
            {ticket.url || "N/A"}
          </p>
        </div>
        <div className="text-right">
          <h3 className="text-lg font-bold text-secondary">Risk Score</h3>
          <p
            className={`text-4xl font-black ${ticket.risk_score >= 80 ? "text-risk-high" : ticket.risk_score >= 50 ? "text-risk-medium" : "text-risk-low"}`}
          >
            {ticket.risk_score.toFixed(0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 py-8 border-y border-neutral-border">
        {/* Left Column: Metadata */}
        <div className="space-y-8">
          <div className="space-y-1">
            <span className="text-sm font-bold block text-secondary">
              Type
            </span>
            <span className="text-base font-medium text-secondary">
              {ticket.type}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-bold block text-secondary">
              Submitted
            </span>
            <span className="text-base font-medium text-secondary">
              {new Date(ticket.created_at).toLocaleDateString()}
            </span>
          </div>

          {ticket.sender_numbers && (
            <div className="space-y-1">
              <span className="text-sm font-bold block text-secondary">
                Sender Info
              </span>
              <div className="flex flex-wrap gap-2">
                {ticket.sender_numbers.split(",").map((num, i) => (
                  <span
                    key={i}
                    className="bg-neutral-page border border-neutral-border px-3 py-1 rounded-lg font-medium text-sm text-secondary"
                  >
                    {num.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Status & Priority */}
        <div className="space-y-8">
          <div className="space-y-1">
            <span className="text-sm font-bold block text-secondary">
              Priority
            </span>
            <span
              className={`inline-block font-bold text-base ${
                ticket.priority === "High"
                  ? "text-risk-high"
                  : "text-risk-medium"
              }`}
            >
              {ticket.priority}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-bold block text-secondary">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-base font-medium bg-neutral-page border border-neutral-border rounded px-4 py-2 outline-none focus:border-primary text-secondary transition-all appearance-none pr-10 cursor-pointer w-full md:w-auto"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "1rem",
              }}
            >
              <option value="Submitted">Submitted</option>
              <option value="In Review">In Review</option>
              <option value="Confirmed">Confirmed</option>
              <option value="False Positive">False Positive</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <h3 className="text-lg font-bold mb-4 text-secondary">
          Detection Engine Flags
        </h3>
        <div className="flex flex-wrap gap-2">
          {ticket.flags ? (
            ticket.flags.split(",").map((flag, idx) => (
              <span
                key={idx}
                className="bg-secondary text-white text-xs font-bold px-3 py-1.5 rounded-full"
              >
                {flag.replace(/_/g, " ")}
              </span>
            ))
          ) : (
            <span className="text-sm font-normal opacity-60 text-secondary">
              No specific rule flags triggered.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
