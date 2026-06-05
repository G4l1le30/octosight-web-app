import React, { useEffect, useState } from "react";
import { Ticket, TicketAuditLog } from "@/types/ticket";
import { History } from "lucide-react";
import { RiskEducationPanel } from "./RiskEducationPanel";
import { TicketTimeline } from "./TicketTimeline";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

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
  const [sendingAccuracy, setSendingAccuracy] = useState(false);
  const [sendingSupport, setSendingSupport] = useState(false);
  const [accuracyModal, setAccuracyModal] = useState(false);
  const [supportModal, setSupportModal] = useState(false);
  const [messageText, setMessageText] = useState("");

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
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="bg-white rounded-2xl md:rounded-3xl border border-neutral-border shadow-sm overflow-hidden">
         <div
           className={`h-1.5 ${(result.risk_score ?? 0) >= 75 ? "bg-risk-high" : (result.risk_score ?? 0) >= 35 ? "bg-risk-medium" : "bg-risk-low"}`}
         ></div>
        <div className="p-6 md:p-8">
          <StatusHeader result={result} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-8 md:mb-10">
            {/* Left Column */}
            <StatusOverview result={result} />

            {/* Right Column */}
            <div className="space-y-6 md:space-y-8">
              <StatusAnalysis result={result} />
              <StatusEvidence result={result} />
            </div>
          </div>

          <div className="pt-4 md:pt-6 border-t border-neutral-border flex flex-col sm:flex-row sm:items-center justify-end gap-3 md:gap-4">
            <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="md"
                className="flex-1 sm:flex-none"
                loading={sendingAccuracy}
                onClick={() => {
                  setMessageText("");
                  setAccuracyModal(true);
                }}
              >
                Report Accuracy Issue
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="flex-1 sm:flex-none"
                loading={sendingSupport}
                onClick={() => {
                  setMessageText("");
                  setSupportModal(true);
                }}
              >
                Notify Support
              </Button>
            </div>
          </div>

          {/* Accuracy Issue Modal */}
          {accuracyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4" onClick={() => setAccuracyModal(false)}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8 border border-neutral-border animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-base md:text-lg font-bold text-secondary mb-1.5 md:mb-2">Report Accuracy Issue</h2>
                <p className="text-xs md:text-sm text-secondary/60 mb-3 md:mb-4">This will notify the OctoSight admin about an issue with this analysis.</p>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Describe what seems incorrect about the analysis..."
                  rows={4}
                  className="w-full border-2 border-neutral-border rounded-lg md:rounded-xl p-2 md:p-3 text-xs md:text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 resize-none mb-3 md:mb-4"
                />
                <div className="flex items-center justify-end gap-2 md:gap-3">
                  <button onClick={() => setAccuracyModal(false)} className="px-4 md:px-5 py-2 md:py-2.5 bg-white border-2 border-neutral-border text-secondary font-bold text-xs md:text-sm rounded-lg md:rounded-xl hover:bg-neutral-page transition-all">Cancel</button>
                  <button onClick={async () => {
                    setSendingAccuracy(true);
                    try {
                      const res = await fetch(`/api/v1/tickets/${result.ticket_id}/report-accuracy`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: messageText }),
                      });
                      if (res.ok) { toast.success("Accuracy issue reported to admin."); setAccuracyModal(false); }
                      else { toast.error("Failed to send report."); }
                    } catch { toast.error("Connection error."); }
                    finally { setSendingAccuracy(false); }
                  }} disabled={sendingAccuracy} className="px-4 md:px-5 py-2 md:py-2.5 bg-secondary text-white font-bold text-xs md:text-sm rounded-lg md:rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-md">
                    {sendingAccuracy ? "Sending..." : "Send Report"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Support Modal */}
          {supportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4" onClick={() => setSupportModal(false)}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8 border border-neutral-border animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-base md:text-lg font-bold text-secondary mb-1.5 md:mb-2">Notify Support</h2>
                <p className="text-xs md:text-sm text-secondary/60 mb-3 md:mb-4">Request the OctoSight admin to review and take action on this ticket.</p>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Describe what you need help with..."
                  rows={4}
                  className="w-full border-2 border-neutral-border rounded-lg md:rounded-xl p-2 md:p-3 text-xs md:text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 resize-none mb-3 md:mb-4"
                />
                <div className="flex items-center justify-end gap-2 md:gap-3">
                  <button onClick={() => setSupportModal(false)} className="px-4 md:px-5 py-2 md:py-2.5 bg-white border-2 border-neutral-border text-secondary font-bold text-xs md:text-sm rounded-lg md:rounded-xl hover:bg-neutral-page transition-all">Cancel</button>
                  <button onClick={async () => {
                    setSendingSupport(true);
                    try {
                      const res = await fetch(`/api/v1/tickets/${result.ticket_id}/notify-support`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: messageText }),
                      });
                      if (res.ok) { toast.success("Support request sent to admin."); setSupportModal(false); }
                      else { toast.error("Failed to send request."); }
                    } catch { toast.error("Connection error."); }
                    finally { setSendingSupport(false); }
                  }} disabled={sendingSupport} className="px-4 md:px-5 py-2 md:py-2.5 bg-secondary text-white font-bold text-xs md:text-sm rounded-lg md:rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-md">
                    {sendingSupport ? "Sending..." : "Send Request"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {result.education_recommendation && (
        <div className="bg-white rounded-2xl md:rounded-3xl border border-neutral-border shadow-sm overflow-hidden">
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
      <div className="bg-white rounded-2xl md:rounded-3xl border border-neutral-border shadow-sm overflow-hidden">
        <div
          className={`h-1.5 ${(result.risk_score ?? 0) >= 70 ? "bg-risk-high" : (result.risk_score ?? 0) >= 40 ? "bg-risk-medium" : "bg-risk-low"}`}
        />
        <div className="p-6 md:p-8">
          <div className="mb-4 md:mb-6 space-y-0.5 md:space-y-1">
            <h3 className="text-lg md:text-xl font-bold text-secondary">
              Report Timeline
            </h3>
            <p className="text-xs md:text-sm text-secondary/60 font-medium">
              Live status updates and investigator actions
            </p>
          </div>
          {logsLoading ? (
            <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-secondary/60 font-medium py-4 md:py-6">
              <div className="size-5 border-2 border-secondary/20 border-t-secondary/60 rounded-full animate-spin" />
              Loading timeline...
            </div>
          ) : (
            <div className="py-1.5 md:py-2">
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
