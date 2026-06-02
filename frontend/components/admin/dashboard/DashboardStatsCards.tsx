import React from "react";
import { DashboardStats } from "@/types/ticket";

interface DashboardStatsCardsProps {
  stats: DashboardStats;
}

export const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({
  stats,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
      {[
        { label: "Total Incidents", value: stats.total, color: "text-secondary" },
        { label: "Avg Risk Level", value: stats.avgScore, color: "text-risk-medium" },
        { label: "Critical Threats", value: stats.highRisk, color: "text-risk-high" },
        { label: "Active Channels", value: stats.typeDist.length, color: "text-risk-low" },
        { label: "Open Tickets", value: stats.openTickets ?? 0, color: "text-amber-600" },
        { label: "Resolved", value: stats.resolvedTickets ?? 0, color: "text-emerald-600" },
      ].map((stat, idx) => (
        <div
          key={idx}
          className="card p-3 md:p-4 border-b-2 border-b-primary/10 text-center"
        >
          <p className="text-xs font-semibold text-secondary mb-1">
            {stat.label}
          </p>
          <h3 className={`text-xl font-bold ${stat.color}`}>{stat.value}</h3>
        </div>
      ))}
    </div>
  );
};
