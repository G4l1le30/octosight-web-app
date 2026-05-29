import React from "react";
import { DashboardStats } from "@/types/ticket";

interface DashboardStatsCardsProps {
  stats: DashboardStats;
}

export const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
      {[
        {
          label: "Total Incidents",
          value: stats.total,
          color: "text-secondary",
        },
        {
          label: "Avg Risk Level",
          value: stats.avgScore,
          color: "text-risk-medium",
        },
        {
          label: "Critical Threats",
          value: stats.highRisk,
          color: "text-risk-high",
        },
        {
          label: "Active Channels",
          value: stats.typeDist.length,
          color: "text-risk-low",
        },
      ].map((stat, idx) => (
        <div key={idx} className="card p-4 md:p-6 border-b-4 border-b-primary/10">
          <p className="text-sm font-bold text-secondary mb-1 tracking-wide">
            {stat.label}
          </p>
          <h3 className={`text-2xl md:text-3xl font-bold ${stat.color}`}>
            {stat.value}
          </h3>
        </div>
      ))}
    </div>
  );
};
