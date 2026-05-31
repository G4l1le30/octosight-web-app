"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Ticket, DashboardStats } from "@/types/ticket";
import { ThreatTable } from "@/components/admin/ThreatTable";
import { DashboardStatsCards } from "@/components/admin/dashboard/DashboardStatsCards";
import { IncidentTrendChart, TimeRange } from "@/components/admin/dashboard/IncidentTrendChart";
import { ThreatChannelChart } from "@/components/admin/dashboard/ThreatChannelChart";
import { SecurityFlagAnalysis } from "@/components/admin/dashboard/SecurityFlagAnalysis";
import { ActivityFeed } from "@/components/admin/dashboard/ActivityFeed";

function buildTrendData(tickets: Ticket[], range: TimeRange) {
  const now = new Date();
  const buckets: { name: string; start: Date; end: Date }[] = [];

  if (range === "7d") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      buckets.push({ name: d.toLocaleDateString("en-US", { weekday: "short" }), start: d, end: next });
    }
  } else if (range === "1m") {
    for (let i = 3; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      buckets.push({
        name: `Week ${4 - i}`,
        start,
        end,
      });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i, 1);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setMonth(end.getMonth() + 1);
      buckets.push({
        name: d.toLocaleDateString("en-US", { month: "short" }),
        start: d,
        end,
      });
    }
  }

  return buckets.map((b) => ({
    name: b.name,
    incidents: tickets.filter((t) => {
      const d = new Date(t.created_at);
      return d >= b.start && d < b.end;
    }).length,
  }));
}

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
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

      const raw = await response.json();
      const list: Ticket[] = Array.isArray(raw) ? raw : (raw.items ?? raw.tickets ?? []);
      const sorted = list.sort((a: Ticket, b: Ticket) =>
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
    const highRisk = data.filter((t) => t.risk_score >= 75).length;

    const types: Record<string, number> = {};
    const flags: Record<string, number> = {};

    data.forEach((t) => {
      types[t.type] = (types[t.type] || 0) + 1;
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

    setStats({ total, avgScore, highRisk, typeDist, trendData: [], flagDist });
  };

  const trendData = useMemo(() => buildTrendData(tickets, timeRange), [tickets, timeRange]);

  if (loading)
    return (
      <div className="p-20 text-center font-bold opacity-40">
        Loading Analytics...
      </div>
    );

  return (
    <div className="bg-neutral-page min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
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

        {/* Row 1: Incident Trend + Threat Channel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          <IncidentTrendChart
            trendData={trendData}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
          <ThreatChannelChart typeDist={stats.typeDist} />
        </div>

        {/* Row 2: Activity Feed (left) + Security Flag Analysis (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          <div className="order-1 md:order-1">
            <ActivityFeed />
          </div>
          <div className="order-2 md:order-2">
            <SecurityFlagAnalysis flagDist={stats.flagDist} />
          </div>
        </div>

        {/* Recent Alerts Table Preview */}
        <div className="mb-6 md:mb-8 card overflow-hidden">
          <div className="px-6 md:px-8 py-4 md:py-5 border-b border-neutral-border flex items-center justify-between bg-white">
            <h3 className="font-bold text-lg md:text-xl text-secondary">
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
