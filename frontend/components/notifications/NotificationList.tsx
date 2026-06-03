"use client";

import React from "react";
import { Bell, BellDot, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  notification_type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationListProps {
  notifications: NotificationItem[];
  onMarkRead: (id: number) => void;
  compact?: boolean;
  onItemClick?: (notification: NotificationItem) => void;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z");
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

const iconMap: Record<string, React.ReactNode> = {
  alert: <BellDot className="h-4 w-4 text-risk-high" />,
  warning: <BellDot className="h-4 w-4 text-risk-medium" />,
  success: <CheckCheck className="h-4 w-4 text-risk-low" />,
  info: <Bell className="h-4 w-4 text-primary" />,
};

function getNotificationIcon(type: string): React.ReactNode {
  return iconMap[type] ?? <Bell className="h-4 w-4 text-secondary" />;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkRead,
  compact = false,
  onItemClick,
}) => {
  const displayItems = compact ? notifications.slice(0, 5) : notifications;

  return (
    <div className={cn("divide-y divide-neutral-border", compact && "max-h-96 overflow-y-auto")}>
      {displayItems.length === 0 && (
        <div className="py-8 text-center text-sm text-secondary/60 font-medium">
          No notifications yet
        </div>
      )}
      {displayItems.map((notification) => (
        <button
          key={notification.id}
          onClick={() => {
            if (!notification.is_read) {
              onMarkRead(notification.id);
            }
            onItemClick?.(notification);
          }}
          className={cn(
            "w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-neutral-page",
            !notification.is_read && "bg-primary/[0.03]",
          )}
        >
          <div className="mt-0.5 shrink-0">
            {getNotificationIcon(notification.notification_type)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm truncate",
                  notification.is_read ? "text-secondary/70 font-medium" : "text-secondary font-bold",
                )}
              >
                {notification.title}
              </span>
              {!notification.is_read && (
                <span className="shrink-0 w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
            <p className="text-xs text-secondary/60 mt-0.5 line-clamp-2">
              {notification.body.length > 80
                ? notification.body.slice(0, 80) + "..."
                : notification.body}
            </p>
            <span className="text-[11px] text-secondary/40 mt-1 block">
              {timeAgo(notification.created_at)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};
