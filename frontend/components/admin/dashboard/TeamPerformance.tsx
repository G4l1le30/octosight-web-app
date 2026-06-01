"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_BADGE_COLORS } from "@/types/auth";

interface TeamMember {
  assignee_id: string;
  assignee_name: string;
  assignee_role: string | null;
  total_tickets: number;
  open_tickets: number;
  high_priority_tickets: number;
  avg_response_hours: number | null;
}

export const TeamPerformance: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/dashboard/team");
        const data = await res.json();
        setTeam(data.team || []);
      } catch {
        setTeam([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-bold text-secondary mb-4">Team Performance</h3>
        <p className="text-sm text-secondary/40">Loading team data...</p>
      </div>
    );
  }

  if (team.length === 0) return null;

  const totalOpen = team.reduce((s, m) => s + m.open_tickets, 0);
  const totalHigh = team.reduce((s, m) => s + m.high_priority_tickets, 0);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-secondary">Team Performance</h3>
        <div className="flex items-center gap-4 text-xs text-secondary/40">
          <span>{totalOpen} open</span>
          <span>{totalHigh} high priority</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {team.map((member) => {
          const badgeColor = member.assignee_role
            ? ROLE_BADGE_COLORS[member.assignee_role as keyof typeof ROLE_BADGE_COLORS]
            : "bg-gray-100 text-gray-600";
          return (
            <div
              key={member.assignee_id}
              className="p-4 bg-neutral-page rounded-xl border border-neutral-border"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm truncate">
                  {member.assignee_name}
                </span>
                {member.assignee_role && (
                  <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", badgeColor)}>
                    {member.assignee_role}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-black">{member.total_tickets}</div>
                  <div className="text-xs text-secondary/40">Total</div>
                </div>
                <div>
                  <div className="text-lg font-black text-risk-medium">{member.open_tickets}</div>
                  <div className="text-xs text-secondary/40">Open</div>
                </div>
                <div>
                  <div className="text-lg font-black text-risk-high">{member.high_priority_tickets}</div>
                  <div className="text-xs text-secondary/40">High</div>
                </div>
              </div>
              {member.avg_response_hours !== null && (
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-secondary/50">
                  <Clock size={12} />
                  <span>Avg response: {member.avg_response_hours}h</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
