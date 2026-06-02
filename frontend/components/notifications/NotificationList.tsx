"use client";

import React from "react";
import { Bell, BellDot, CheckCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationListProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  compact?: boolean;
  onItemClick?: (notification: NotificationItem) => void;
}

function timeAgo(dateStr: string): string {
  const date = new Date(
    dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z",
  );
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const NOTIFICATION_COLORS: Record<string, { bg: string; icon: string }> = {
  alert: {
    bg: "bg-risk-high/10",
    icon: "text-risk-high",
  },
  warning: {
    bg: "bg-risk-medium/10",
    icon: "text-risk-medium",
  },
  success: {
    bg: "bg-risk-low/10",
    icon: "text-risk-low",
  },
  info: {
    bg: "bg-sky-50",
    icon: "text-sky-600",
  },
};

const ICON_MAP: Record<string, React.ElementType> = {
  alert: AlertCircle,
  warning: BellDot,
  success: CheckCheck,
  info: Bell,
};

function getNotificationColors(type: string) {
  return (
    NOTIFICATION_COLORS[type] ?? {
      bg: "bg-slate-50",
      icon: "text-slate-600",
    }
  );
}

function getNotificationIcon(type: string) {
  return ICON_MAP[type] ?? Bell;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkRead,
  compact = false,
  onItemClick,
}) => {
  const displayItems = compact ? notifications.slice(0, 5) : notifications;

  return (
    <div className={cn(compact ? "max-h-96 overflow-y-auto" : "space-y-3")}>
      {displayItems.length === 0 && (
        <div className="py-8 text-center text-sm text-secondary/60 font-medium">
          No notifications yet
        </div>
      )}
      {displayItems.map((notification) => {
        const Icon = getNotificationIcon(notification.notification_type);
        const colors = getNotificationColors(notification.notification_type);

        return (
          <button
            key={notification.id}
            onClick={() => {
              if (!notification.is_read) {
                onMarkRead(notification.id);
              }
              onItemClick?.(notification);
            }}
            className={cn(
              "w-full text-left transition-all bg-white hover:bg-neutral-page",
              compact
                ? "border-b border-neutral-border rounded-none last:border-b-0"
                : "rounded-xl border border-neutral-border shadow-sm",
              !notification.is_read && "bg-primary/[0.03]",
            )}
          >
            <div
              className={cn("flex items-start gap-3", compact ? "p-3" : "p-3")}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${colors.bg} ${colors.icon}`}
              >
                <Icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-secondary">
                  {notification.title}
                </div>
                <p className="text-sm text-secondary/70 mt-1 line-clamp-2 leading-snug">
                  {notification.body}
                </p>
              </div>
              <div className="text-xs text-secondary/50 whitespace-nowrap">
                {timeAgo(notification.created_at)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
