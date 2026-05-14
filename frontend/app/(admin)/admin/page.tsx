"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Ticket, DashboardStats } from "@/types/ticket";
import { ThreatTable } from "@/components/admin/ThreatTable";
import { DashboardStatsCards } from "@/components/admin/dashboard/DashboardStatsCards";
import { IncidentTrendChart } from "@/components/admin/dashboard/IncidentTrendChart";
import { ThreatChannelChart } from "@/components/admin/dashboard/ThreatChannelChart";
import { SecurityFlagAnalysis } from "@/components/admin/dashboard/SecurityFlagAnalysis";

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    avgScore: "0",
    highRisk: 0,
    typeDist: [],
    trendData: [],
    flagDist: [],
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/tickets");

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        throw new Error(`Server returned an error (${response.status})`);
      }

      const data = await response.json();
      const sorted = data.sort((a: Ticket, b: Ticket) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTickets(sorted);
      calculateStats(sorted);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const calculateStats = (data: Ticket[]) => {
    if (!data.length) return;

    const total = data.length;
    const avgScore = (
      data.reduce((acc, t) => acc + t.risk_score, 0) / total
    ).toFixed(1);
    const highRisk = data.filter((t) => t.risk_score > 70).length;

    // Type Distribution
    const types: Record<string, number> = {};
    const flags: Record<string, number> = {};

    data.forEach((t) => {
      // Channel Distribution
      types[t.type] = (types[t.type] || 0) + 1;

      // Flag Distribution
      if (t.flags) {
        t.flags.split(",").forEach((f) => {
          const cleanFlag = f.trim();
          if (cleanFlag) flags[cleanFlag] = (flags[cleanFlag] || 0) + 1;
        });
      }
    });

    const typeDist = Object.entries(types).map(([name, value]) => ({
      name,
      value,
    }));
    const flagDist = Object.entries(flags)
      .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }))
      .sort((a, b) => b.value - a.value);

    // Simple Trend (by date)
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trend: Record<string, number> = {};
    // Init last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trend[days[d.getDay()]] = 0;
    }
    data.forEach((t) => {
      const d = new Date(t.created_at);
      const dayName = days[d.getDay()];
      if (trend[dayName] !== undefined) trend[dayName]++;
    });
    const trendData = Object.entries(trend).map(([name, incidents]) => ({
      name,
      incidents,
    }));

    setStats({ total, avgScore, highRisk, typeDist, trendData, flagDist });
  };

  if (loading)
    return (
      <div className="p-20 text-center font-bold opacity-40">
        Loading Analytics...
      </div>
    );

  return (
    <div className="bg-neutral-page min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Threat Intelligence Dashboard
            </h1>
            <p className="text-secondary-light">
              Unified monitoring for Website, SMS, WhatsApp, and Email threats.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/triage"
              className="btn-primary flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              Review Triage
            </Link>
          </div>
        </div>

        <DashboardStatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <IncidentTrendChart trendData={stats.trendData} />
          <ThreatChannelChart typeDist={stats.typeDist} />
        </div>

        <div className="grid grid-cols-1 gap-8 mb-8">
          <SecurityFlagAnalysis flagDist={stats.flagDist} />
        </div>

        {/* Recent Alerts Table Preview */}
        <div className="mb-8 card overflow-hidden">
          <div className="px-8 py-5 border-b border-neutral-border flex items-center justify-between bg-white">
            <h3 className="font-bold text-xl text-secondary">
              Live Threat Feed
            </h3>
            <Link
              href="/admin/triage"
              className="text-sm font-bold text-primary hover:underline px-3 py-1 bg-primary/5 rounded-full"
            >
              See Full Triage →
            </Link>
          </div>
          <ThreatTable 
            tickets={tickets.slice(0, 5)}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
