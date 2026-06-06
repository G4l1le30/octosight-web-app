"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  NotificationList,
  NotificationItem,
} from "@/components/notifications/NotificationList";

const POLL_INTERVAL = 30000;

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/notifications?page=1&per_page=5");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items ?? []);
        if (data.unread_count !== undefined) {
          setUnreadCount(data.unread_count);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    if (!user) return;
    if (!open) return;
    fetchRecent();
  }, [user, open, fetchRecent]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/v1/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  const handleItemClick = (notification: NotificationItem) => {
    setOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  if (!user) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-1.5 md:p-2 text-secondary hover:text-primary transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <>
            <Bell className="h-4 md:h-5 w-4 md:w-5" />
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-0.5 md:px-1 text-xs font-bold text-white bg-primary rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </>
        ) : (
          <Bell className="h-4 md:h-5 w-4 md:w-5" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 md:mt-2 w-60 md:w-80 sm:w-96 bg-white border border-neutral-border rounded-lg md:rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-neutral-border">
            <span className="text-xs md:text-sm font-bold text-secondary">
              Notifications
            </span>
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll || unreadCount === 0}
              className="flex items-center gap-0.5 md:gap-1 text-xs font-bold text-primary hover:text-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {markingAll ? (
                <Loader2 className="h-2 md:h-3 w-2 md:w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-2 md:h-3 w-2 md:w-3" />
              )}
              Mark all read
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6 md:py-8">
              <Loader2 className="h-4 md:h-5 w-4 md:w-5 animate-spin text-secondary/60" />
            </div>
          ) : (
            <NotificationList
              notifications={notifications}
              onMarkRead={handleMarkRead}
              compact
              onItemClick={handleItemClick}
            />
          )}

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-0.5 md:gap-1 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-bold text-primary hover:text-primary-dark border-t border-neutral-border transition-colors"
          >
            See All &rarr;
          </Link>
        </div>
      )}
    </div>
  );
};
