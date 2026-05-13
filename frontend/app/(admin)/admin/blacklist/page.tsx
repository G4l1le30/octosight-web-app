"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldOff, CheckCircle2, XCircle } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatDateTime } from "@/lib/utils";

interface BlacklistEntry {
  id: number;
  url: string;
  domain: string;
  reason: string | null;
  ticket_id: string | null;
  added_by: string | null;
  is_active: boolean;
  created_at: string;
}

export default function BlacklistPage() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; id: number | null; url: string }>({
    isOpen: false,
    id: null,
    url: "",
  });
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const router = useRouter();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/blacklist");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEntries(data);
    } catch {
      showToast("error", "Failed to load blacklist entries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleRemoveClick = (id: number, url: string) => {
    setConfirmConfig({ isOpen: true, id, url });
  };

  const confirmRemove = async () => {
    if (!confirmConfig.id) return;
    
    const id = confirmConfig.id;
    const url = confirmConfig.url;
    
    setRemoving(id);
    setConfirmConfig({ ...confirmConfig, isOpen: false });
    
    try {
      const res = await fetch(`/api/v1/admin/blacklist/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast("success", `URL removed from blacklist.`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      showToast("error", "Failed to remove entry.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-6 py-4 rounded-xl shadow-lg font-semibold text-white text-sm transition-all ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-neutral-border rounded-full transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-secondary">Internal URL Blacklist</h1>
            <p className="text-secondary font-normal opacity-70">
              Domains listed here will automatically receive a maximum risk score on future reports.
            </p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-center">
          <p className="text-2xl font-bold text-red-600">{entries.length}</p>
          <p className="text-xs text-red-500 font-medium">Active Entries</p>
        </div>
      </div>

      {/* Table */}
      <div className="card bg-white border border-neutral-border shadow-sm rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-secondary/50 text-sm">Loading blacklist...</div>
        ) : entries.length === 0 ? (
          <div className="p-16 text-center">
            <ShieldOff className="w-16 h-16 text-secondary/30 mx-auto mb-4" />
            <p className="text-secondary font-semibold">No blacklisted domains yet</p>
            <p className="text-secondary/50 text-sm mt-1">
              Add domains from the Investigate page when reviewing a suspicious report.
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-neutral-page text-sm font-bold text-secondary border-b border-neutral-border">
              <tr>
                <th className="px-6 py-4 w-[30%]">Blacklisted URL</th>
                <th className="px-6 py-4 w-[25%]">Reason</th>
                <th className="px-6 py-4 w-[20%]">Ticket Source</th>
                <th className="px-6 py-4 w-[15%]">Added Date</th>
                <th className="px-6 py-4 text-right w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border">
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-neutral-page/50 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <span className="font-bold text-sm text-secondary break-all line-clamp-2" title={entry.url}>
                      {entry.url}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-normal text-secondary break-words">
                      {entry.reason || <span className="opacity-50 italic">No reason given</span>}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {entry.ticket_id ? (
                      <Link
                        href={`/admin/investigate/${entry.ticket_id}`}
                        className="text-sm font-bold text-secondary hover:text-primary transition-colors"
                      >
                        {entry.ticket_id}
                      </Link>
                    ) : (
                      <span className="text-sm font-normal text-secondary opacity-50">—</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-normal text-secondary">
                      {formatDateTime(entry.created_at).date}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => handleRemoveClick(entry.id, entry.url)}
                      disabled={removing === entry.id}
                      className="text-xs font-bold text-secondary hover:text-primary transition-colors bg-white border border-neutral-border hover:bg-neutral-page px-4 py-2 rounded-xl shadow-sm inline-block disabled:opacity-50"
                    >
                      {removing === entry.id ? "Removing..." : "Remove"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title="Remove from Blacklist"
        message={`Are you sure you want to remove this URL from the internal blacklist? Future reports with this domain will no longer be automatically blocked.`}
        confirmText="Remove URL"
        type="danger"
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmRemove}
        isLoading={removing !== null}
      />
    </div>
  );
}
