"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FilePlus,
  FileEdit,
  ShieldOff,
  Shield,
  UserPlus,
  Flag,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface ActivityItem {
  id: number;
  activity_type: string;
  description: string;
  actor_id: string;
  ticket_id: string | null;
  metadata_json: string | null;
  created_at: string;
}

interface ActivityResponse {
  items: ActivityItem[];
  total: number;
  page: number;
  per_page: number;
}

const ACTIVITY_COLORS: Record<
  string,
  { border: string; bg: string; icon: string }
> = {
  ticket_created: {
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    icon: "text-blue-600",
  },
  ticket_updated: {
    border: "border-l-amber-500",
    bg: "bg-amber-50",
    icon: "text-amber-600",
  },
  blacklist_added: {
    border: "border-l-red-500",
    bg: "bg-red-50",
    icon: "text-red-600",
  },
  blacklist_removed: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
  },
  user_registered: {
    border: "border-l-purple-500",
    bg: "bg-purple-50",
    icon: "text-purple-600",
  },
  report_submitted: {
    border: "border-l-indigo-500",
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
  },
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  ticket_created: FilePlus,
  ticket_updated: FileEdit,
  blacklist_added: ShieldOff,
  blacklist_removed: Shield,
  user_registered: UserPlus,
  report_submitted: Flag,
};

function getActivityColors(type: string) {
  return (
    ACTIVITY_COLORS[type] ?? {
      border: "border-l-slate-400",
      bg: "bg-slate-50",
      icon: "text-slate-500",
    }
  );
}

function getActivityIcon(type: string) {
  return ACTIVITY_ICONS[type] ?? Flag;
}

function timeAgo(dateStr: string): string {
  const hasTimezone =
    dateStr.includes("Z") ||
    dateStr.includes("+") ||
    (dateStr.includes("-") &&
      dateStr.length > 10 &&
      dateStr.indexOf("-", 10) > 0);
  const normalized = hasTimezone ? dateStr : `${dateStr.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/activity?page=1&per_page=10");
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data: ActivityResponse = await res.json();
      setActivities(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <div className="card p-6 md:p-8 text-center h-full flex flex-col">
      <div className="flex items-center justify-center mb-6">
        <h3 className="font-bold text-xl text-secondary">Activity Feed</h3>
      </div>
      <div className="flex justify-center mb-2">
        <button
          onClick={fetchActivities}
          disabled={loading}
          className="btn-ghost p-2"
          title="Refresh"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-center gap-4 animate-pulse"
              >
                <div className="size-9 rounded-lg bg-neutral-border shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-4 bg-neutral-border rounded w-3/4" />
                  <div className="h-3 bg-neutral-border rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="size-8 text-risk-high" />
            <p className="text-sm font-bold text-risk-high">{error}</p>
            <button onClick={fetchActivities} className="btn-primary text-sm">
              Retry
            </button>
          </div>
        ) : activities.length === 0 ? (
          <p className="py-8 text-sm text-center opacity-40 font-semibold">
            No recent activity
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((item) => {
              const Icon = getActivityIcon(item.activity_type);
              const colors = getActivityColors(item.activity_type);

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-center gap-4 p-4 rounded-xl border-l-4 ${colors.border} ${colors.bg} transition-all`}
                >
                  <div
                    className={`size-9 rounded-lg flex items-center justify-center shrink-0 bg-white shadow-sm ${colors.icon}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.ticket_id ? (
                      <Link
                        href={`/admin/investigate/${item.ticket_id}`}
                        className="text-sm font-bold text-secondary hover:text-primary transition-colors"
                      >
                        {item.description}
                      </Link>
                    ) : (
                      <p className="text-sm font-bold text-secondary">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs font-medium text-secondary/70 mt-1">
                      {timeAgo(item.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
