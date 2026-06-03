"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/auth/AuthRequired";
import { NotificationList, NotificationItem } from "@/components/notifications/NotificationList";

interface NotificationsResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  per_page: number;
  unread_count: number;
}

const PER_PAGE = 20;

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const totalPages = Math.ceil(total / PER_PAGE);

  const fetchNotifications = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/notifications?page=${p}&per_page=${PER_PAGE}`);
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

  const handleMarkRead = async (id: number) => {
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/v1/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/notifications/${id}`, { method: "DELETE" });
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
      <div className="container mx-auto px-4 py-32 text-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-neutral-border hover:bg-neutral-page transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary">Notifications</h1>
            <p className="text-sm text-secondary/60 font-medium mt-0.5">
              {total} notification{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <button
          onClick={handleMarkAllRead}
          disabled={markingAll}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {markingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4" />
          )}
          Mark all read
        </button>
      </div>

      <div className="bg-white border border-neutral-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-secondary/40" />
          </div>
        ) : (
          <>
            <NotificationList
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onItemClick={handleItemClick}
            />

            <div className="border-t border-neutral-border" />

            <div className="flex items-center justify-between px-4 py-3 bg-neutral-page/50">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm font-bold text-secondary border border-neutral-border rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>

              <span className="text-sm text-secondary/70 font-medium">
                Page {page} of {totalPages || 1}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm font-bold text-secondary border border-neutral-border rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
