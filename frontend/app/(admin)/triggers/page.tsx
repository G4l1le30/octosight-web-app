"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Bell } from "lucide-react";

interface Alert {
  rule: string;
  description: string;
  severity: string;
  message: string;
  count: number;
}

export default function TriggersPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/triggers/evaluate")
      .then((r) => (r.ok ? r.json() : { alerts: [] }))
      .then((data) => setAlerts(data.alerts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const severityColors: Record<string, string> = {
    critical: "bg-red-50 border-red-200 text-red-800",
    high: "bg-orange-50 border-orange-200 text-orange-800",
    medium: "bg-amber-50 border-amber-200 text-amber-800",
    low: "bg-blue-50 border-blue-200 text-blue-800",
  };

  if (loading) {
    return <div className="p-20 text-center font-bold opacity-40">Loading triggers...</div>;
  }

  return (
    <div className="bg-neutral-page min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Behavioral Triggers</h1>
            <p className="text-secondary/60 text-sm">Automated alerts based on activity patterns</p>
          </div>
          <button
            onClick={() => { setLoading(true); window.location.reload(); }}
            className="text-sm font-bold text-primary hover:underline px-3 py-1.5"
          >
            Refresh
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="card p-12 text-center">
            <CheckCircle className="size-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-secondary mb-2">All Clear</h2>
            <p className="text-sm text-secondary/60">No active trigger alerts at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "card p-4 border-l-4 flex items-start gap-3",
                  severityColors[alert.severity] || severityColors.medium
                )}
              >
                <AlertTriangle className="size-5 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold">{alert.rule}</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                      alert.severity === "critical" ? "bg-red-200 text-red-800" :
                      alert.severity === "high" ? "bg-orange-200 text-orange-800" :
                      "bg-amber-200 text-amber-800"
                    )}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
