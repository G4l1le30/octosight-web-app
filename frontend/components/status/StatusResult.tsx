import React, { useEffect, useState } from "react";
import { Ticket, TicketAuditLog } from "@/types/ticket";
import { History } from "lucide-react";
import { RiskEducationPanel } from "./RiskEducationPanel";
import { TicketTimeline } from "./TicketTimeline";
import { Button } from "@/components/ui/Button";

import { StatusHeader } from "./StatusHeader";
import { StatusOverview } from "./StatusOverview";
import { StatusAnalysis } from "./StatusAnalysis";
import { StatusEvidence } from "./StatusEvidence";

interface StatusResultProps {
  result: Ticket;
}

const StatusResult: React.FC<StatusResultProps> = ({ result }) => {
  const [auditLogs, setAuditLogs] = useState<TicketAuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    if (!result.ticket_id) return;
    const fetchAuditLogs = async () => {
      setLogsLoading(true);
      try {
        const res = await fetch(
          `/api/v1/tickets/${result.ticket_id}/audit-logs`,
        );
        if (res.ok) {
          const data = await res.json();
          setAuditLogs(data);
        }
      } catch {
        // Non-fatal: timeline simply shows empty state
      } finally {
        setLogsLoading(false);
      }
    };
    fetchAuditLogs();
  }, [result.ticket_id]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="bg-white rounded-3xl border border-neutral-border shadow-sm overflow-hidden">
         <div
           className={`h-1.5 ${(result.risk_score ?? 0) >= 75 ? "bg-risk-high" : (result.risk_score ?? 0) >= 35 ? "bg-risk-medium" : "bg-risk-low"}`}
         ></div>
        <div className="p-6 md:p-8">
          <StatusHeader result={result} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8 md:mb-10">
            {/* Left Column */}
            <StatusOverview result={result} />

            {/* Right Column */}
            <div className="space-y-8">
              <StatusAnalysis result={result} />
              <StatusEvidence result={result} />
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-border flex flex-col sm:flex-row sm:items-center justify-end gap-3 md:gap-4">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="md"
                className="flex-1 sm:flex-none"
              >
                Report Accuracy Issue
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="flex-1 sm:flex-none"
              >
                Notify Support
              </Button>
            </div>
          </div>
        </div>
      </div>

      {result.education_recommendation && (
        <div className="bg-white rounded-3xl border border-neutral-border shadow-sm overflow-hidden">
           <div
             className={`h-1.5 ${(result.risk_score ?? 0) >= 75 ? "bg-risk-high" : (result.risk_score ?? 0) >= 35 ? "bg-risk-medium" : "bg-risk-low"}`}
           ></div>
          <div className="p-6 md:p-8">
            <RiskEducationPanel
              recommendation={result.education_recommendation}
            />
          </div>
        </div>
      )}

      {/* Report Timeline */}
      <div className="bg-white rounded-3xl border border-neutral-border shadow-sm overflow-hidden">
        <div
          className={`h-1.5 ${(result.risk_score ?? 0) >= 70 ? "bg-risk-high" : (result.risk_score ?? 0) >= 40 ? "bg-risk-medium" : "bg-risk-low"}`}
        />
        <div className="p-6 md:p-8">
          <div className="mb-4 md:mb-6 space-y-1">
            <h3 className="text-lg md:text-xl font-bold text-secondary">
              Report Timeline
            </h3>
            <p className="text-sm text-secondary/60 font-medium">
              Live status updates and investigator actions
            </p>
          </div>
          {logsLoading ? (
            <div className="flex items-center gap-3 text-sm text-secondary/60 font-medium py-4 md:py-6">
              <div className="size-5 border-2 border-secondary/20 border-t-secondary/60 rounded-full animate-spin" />
              Loading timeline...
            </div>
          ) : (
            <div className="py-2">
              <TicketTimeline
                auditLogs={auditLogs}
                currentStatus={result.status}
                submittedAt={result.created_at}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusResult;
