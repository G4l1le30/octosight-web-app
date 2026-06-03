"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  FilePlus,
  FileEdit,
  ShieldOff,
  Shield,
  UserPlus,
  Flag,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface ActivityItem {
  id: string;
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

const ACTIVITY_COLORS: Record<string, { bg: string; icon: string }> = {
  ticket_created: {
    bg: "bg-sky-50",
    icon: "text-sky-600",
  },
  ticket_updated: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
  },
  blacklist_added: {
    bg: "bg-rose-50",
    icon: "text-rose-600",
  },
  blacklist_removed: {
    bg: "bg-slate-50",
    icon: "text-slate-600",
  },
  report_submitted: {
    bg: "bg-violet-50",
    icon: "text-violet-600",
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
      bg: "bg-slate-50",
      icon: "text-slate-500",
    }
  );
}

function getActivityIcon(type: string) {
  return ACTIVITY_ICONS[type] ?? Flag;
}

function getActivityLabel(type: string) {
  switch (type) {
    case "ticket_created":
      return "Report submitted";
    case "ticket_updated":
      return "Ticket updated";
    case "blacklist_added":
      return "Blacklist entry";
    case "blacklist_removed":
      return "Blacklist removed";
    case "report_submitted":
      return "New phishing report";
    default:
      return "Activity";
  }
}

function sanitizeActivityText(text: string) {
  return text.replace(/—/g, ":").trim();
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
      const filtered = data.items
        .filter((item) => item.activity_type !== "user_registered")
        .slice(0, 4);
      setActivities(filtered);
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
    <div className="card p-6 md:p-8 h-full flex flex-col">
      <div className="mb-4 md:mb-6">
        <h3 className="font-bold text-lg md:text-xl text-secondary">Activity Feed</h3>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="space-y-2 md:space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 md:gap-3 animate-pulse">
                <div className="size-9 rounded-lg md:rounded-xl bg-neutral-border shrink-0" />
                <div className="flex-1 space-y-1.5 md:space-y-2 min-w-0">
                  <div className="h-2 md:h-3 bg-neutral-border rounded w-1.5 md:w-2" />
                  <div className="h-1.5 md:h-2 bg-neutral-border rounded w-0.5 md:w-1" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 md:gap-4 py-6 md:py-8">
            <AlertCircle className="size-8 text-risk-high" />
            <p className="text-xs md:text-sm font-bold text-risk-high">{error}</p>
            <button onClick={fetchActivities} className="btn-primary text-xs md:text-sm">
              Retry
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs md:text-sm text-secondary/60 font-semibold">
              No recent activity
            </p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {activities.map((item) => {
              const Icon = getActivityIcon(item.activity_type);
              const colors = getActivityColors(item.activity_type);
              const content = (
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${colors.bg} ${colors.icon}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm font-semibold text-secondary">
                      {getActivityLabel(item.activity_type)}
                    </div>
                    <p className="text-xs md:text-sm text-secondary/70 mt-0.5 md:mt-1 leading-snug">
                      {sanitizeActivityText(item.description)}
                    </p>
                  </div>
                  <div className="text-xs text-secondary/50 whitespace-nowrap">
                    {timeAgo(item.created_at)}
                  </div>
                </div>
              );

              if (item.ticket_id) {
                return (
                  <Link
                    key={item.id}
                    href={`/admin/investigate/${item.ticket_id}`}
                    className="block rounded-lg md:rounded-xl border border-neutral-border bg-white shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div
                  key={item.id}
                  className="rounded-lg md:rounded-xl border border-neutral-border bg-white shadow-sm transition-all"
                >
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
