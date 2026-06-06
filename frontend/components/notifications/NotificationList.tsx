"use client";

import React from "react";
import {
  Bell,
  BellDot,
  CheckCheck,
  AlertCircle,
  FilePlus,
  FileEdit,
  UserPlus,
  ShieldOff,
  Shield,
  Flag,
} from "lucide-react";
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
  ticket_created: { bg: "bg-violet-50", icon: "text-violet-600" },
  ticket_status_changed: { bg: "bg-amber-50", icon: "text-amber-600" },
  ticket_assigned: { bg: "bg-blue-50", icon: "text-blue-600" },
  report_accuracy: { bg: "bg-rose-50", icon: "text-rose-600" },
  notify_support: { bg: "bg-orange-50", icon: "text-orange-600" },
  blacklist_added: { bg: "bg-red-50", icon: "text-red-600" },
  blacklist_removed: { bg: "bg-slate-50", icon: "text-slate-600" },
  feedback_submitted: { bg: "bg-green-50", icon: "text-green-600" },
  sla_breach: { bg: "bg-risk-high/10", icon: "text-risk-high" },
  rule_created: { bg: "bg-teal-50", icon: "text-teal-600" },
  rule_updated: { bg: "bg-cyan-50", icon: "text-cyan-600" },
  rule_deactivated: { bg: "bg-gray-100", icon: "text-secondary" },
};

const ICON_MAP: Record<string, React.ElementType> = {
  ticket_created: Flag,
  ticket_status_changed: FileEdit,
  ticket_assigned: UserPlus,
  report_accuracy: AlertCircle,
  notify_support: BellDot,
  blacklist_added: ShieldOff,
  blacklist_removed: Shield,
  feedback_submitted: CheckCheck,
  sla_breach: AlertCircle,
  rule_created: FilePlus,
  rule_updated: FileEdit,
  rule_deactivated: ShieldOff,
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
    <div className={cn(compact ? "max-h-72 md:max-h-96 overflow-y-auto" : "space-y-2 md:space-y-3")}>
      {displayItems.length === 0 && (
        <div className="py-6 md:py-8 text-center text-xs md:text-sm text-secondary/60 font-medium">
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
                : "rounded-lg md:rounded-xl border border-neutral-border shadow-sm",
              !notification.is_read && "bg-primary/[0.03]",
            )}
          >
            <div
              className={cn("flex items-start gap-2 md:gap-3", compact ? "p-[10px] md:p-[14px]" : "p-[10px] md:p-[14px]")}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${colors.bg} ${colors.icon}`}
              >
                <Icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs md:text-sm font-semibold text-secondary">
                  {notification.title}
                </div>
                <p className="text-xs md:text-sm font-medium text-secondary/80 mt-0.5 md:mt-1 line-clamp-2 leading-snug">
                  {notification.body}
                </p>
              </div>
              <div className="text-xs font-medium text-secondary/60 whitespace-nowrap">
                {timeAgo(notification.created_at)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
