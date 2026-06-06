"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/auth/AuthRequired";
import {
  NotificationList,
  NotificationItem,
} from "@/components/notifications/NotificationList";

interface NotificationsResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  per_page: number;
  unread_count: number;
}

const PER_PAGE = 10;

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PER_PAGE);

  const fetchNotifications = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/notifications?page=${p}&per_page=${PER_PAGE}`,
      );
      if (res.ok) {
        const data: NotificationsResponse = await res.json();
        setNotifications(data.items ?? []);
        setTotal(data.total);
        setPage(data.page);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications(page);
  }, [user, page, fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch {
      // silent
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/notifications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  const handleItemClick = (notification: NotificationItem) => {
    if (notification.link) {
      router.push(notification.link);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-24 md:py-32 text-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3 md:mb-4" />
        <p className="text-secondary font-medium">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthRequired description="Please log in to view your notifications." />
    );
  }

  return (
    <div className="container mx-auto px-6 sm:px-8 py-8 md:py-12 max-w-6xl">
      <div className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-secondary">
          Notifications
        </h1>
        <p className="text-secondary/80 font-medium max-w-2xl mx-auto">
          Review your in-app notifications, including admin notifications from
          across the platform.
        </p>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl border border-neutral-border shadow-xl overflow-hidden">
        <div className="flex flex-col gap-3 md:gap-4 p-5 md:p-6 lg:p-8">
          <div className="flex flex-col gap-2 md:gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => router.back()}
                className="px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-neutral-border hover:bg-neutral-page transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-3 md:h-4 w-3 md:w-4 text-secondary" />
              </button>
              <p className="text-sm md:text-base text-secondary font-semibold">
                {total} notification{total !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-14 md:py-20">
              <Loader2 className="h-4 md:h-6 w-4 md:w-6 animate-spin text-secondary/80" />
            </div>
          ) : (
            <>
              <NotificationList
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onItemClick={handleItemClick}
              />

              <div className="border-t border-neutral-border" />

              <div className="flex items-center justify-between px-3 md:px-4 py-3 rounded-b-3xl">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-bold text-secondary border border-neutral-border rounded-lg md:rounded-xl hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>

                <span className="text-sm md:text-base text-secondary font-medium">
                  Page {page} of {totalPages || 1}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-bold text-secondary border border-neutral-border rounded-lg md:rounded-xl hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
