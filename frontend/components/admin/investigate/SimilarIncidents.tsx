"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRiskLevel, RISK } from "@/constants/colors";

interface SimilarTicket {
  ticket_id: string;
  similarity_score: number;
  summary: string;
  url: string;
  type: string;
  status: string;
  priority: string;
  risk_score: number;
}

interface SimilarIncidentsProps {
  ticketId: string;
}

export const SimilarIncidents: React.FC<SimilarIncidentsProps> = ({
  ticketId,
}) => {
  const [results, setResults] = useState<SimilarTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/v1/tickets/${ticketId}/similar`);
        const data = await res.json();
        setResults(data.similar || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="card p-4 md:p-6">
        <h3 className="text-base md:text-lg font-bold text-secondary mb-3 md:mb-4">
          Similar Incidents
        </h3>
        <p className="text-xs md:text-sm text-secondary/60">Loading similar tickets...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="card p-4 md:p-6">
      <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4">
        <h3 className="text-lg md:text-xl font-bold text-secondary">Similar Incidents</h3>
        <span className="text-xs md:text-sm text-secondary/80">
          ({results.length} found)
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 md:gap-3">
        {results.map((t) => {
          const riskLevel = getRiskLevel(t.risk_score);
          const riskColor = RISK[riskLevel];
          return (
            <Link
              key={t.ticket_id}
              href={`/admin/investigate/${t.ticket_id}`}
              className="block p-2 md:p-3 bg-neutral-page rounded-md md:rounded-lg border border-neutral-border hover:border-primary/30 transition-all"
            >
              <div className="flex items-center justify-between mb-1.5 md:mb-2">
                <span className="text-xs font-bold text-primary">
                  {t.ticket_id}
                </span>
                <span
                  className="px-1 md:px-1.5 py-0.5 text-xs font-bold rounded"
                  style={{
                    backgroundColor: riskColor.hex + "20",
                    color: riskColor.hex,
                  }}
                >
                  {t.risk_score?.toFixed(0) || (
                    <span className="text-secondary/60">None</span>
                  )}
                </span>
              </div>
              <p className="text-xs text-secondary/80 line-clamp-2 mb-1.5 md:mb-2">
                {t.summary || "No summary"}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs px-1 md:px-1.5 py-0.5 bg-gray-100 text-secondary rounded font-medium">
                  {t.type || <span className="text-secondary/60">None</span>}
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: riskColor.hex }}
                >
                  {(t.similarity_score * 100).toFixed(0)}% match
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
