"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ShieldOff,
  CheckCircle2,
  XCircle,
  Globe,
  CreditCard,
  Phone,
  Mail,
  Trash2,
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AdminHeader } from "@/components/admin/AdminHeader";

type BlacklistType = "url" | "account" | "phone" | "email";

interface BlacklistEntry {
  id: number;
  url?: string;
  domain?: string;
  account_number?: string;
  bank_name?: string;
  phone_number?: string;
  email?: string;
  reason: string | null;
  ticket_id: string | null;
  added_by: string | null;
  is_active: boolean;
  created_at: string;
}

export default function BlacklistPage() {
  const [activeTab, setActiveTab] = useState<BlacklistType>("url");
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    id: number | null;
    value: string;
  }>({
    isOpen: false,
    id: null,
    value: "",
  });
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const toggleSort = useCallback(
    (col: string) => {
      if (col === sortBy) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(col);
        setSortDir("desc");
      }
    },
    [sortBy],
  );

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "url" ? "" : `/${activeTab}s`;
      const res = await fetch(`/api/v1/admin/blacklist${endpoint}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEntries(data.filter((e: any) => e.is_active));
    } catch {
      showToast("error", `Failed to load ${activeTab} blacklist.`);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchEntries();
    setCurrentPage(1);
  }, [fetchEntries]);

  const getEntryValue = useCallback(
    (entry: BlacklistEntry) => {
      switch (activeTab) {
        case "url":
          return entry.url;
        case "account":
          return `${entry.bank_name}: ${entry.account_number}`;
        case "phone":
          return entry.phone_number;
        case "email":
          return entry.email;
      }
    },
    [activeTab],
  );

  const sortedEntries = useMemo(() => {
    const sorted = [...entries];
    sorted.sort((a, b) => {
      let aVal: string = "";
      let bVal: string = "";
      if (sortBy === "created_at") {
        aVal = a.created_at;
        bVal = b.created_at;
      } else if (sortBy === "reason") {
        aVal = a.reason || "";
        bVal = b.reason || "";
      } else {
        aVal = getEntryValue(a) || "";
        bVal = getEntryValue(b) || "";
      }
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [entries, sortBy, sortDir, getEntryValue]);

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedEntries.slice(start, start + itemsPerPage);
  }, [sortedEntries, currentPage, itemsPerPage]);

  const handleRemoveClick = (id: number, value: string) => {
    setConfirmConfig({ isOpen: true, id, value });
  };

  const confirmRemove = async () => {
    if (!confirmConfig.id) return;

    const id = confirmConfig.id;
    const typeLabel = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

    setRemoving(id);
    setConfirmConfig({ ...confirmConfig, isOpen: false });

    try {
      const endpoint = activeTab === "url" ? `/${id}` : `/${activeTab}s/${id}`;
      const res = await fetch(`/api/v1/admin/blacklist${endpoint}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      showToast("success", `${typeLabel} removed from blacklist.`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      showToast("error", "Failed to remove entry.");
    } finally {
      setRemoving(null);
    }
  };

  const tabs = [
    { id: "url" as const, label: "Websites", icon: Globe },
    { id: "account" as const, label: "Bank Accounts", icon: CreditCard },
    { id: "phone" as const, label: "Phone Numbers", icon: Phone },
    { id: "email" as const, label: "Email Addresses", icon: Mail },
  ];

  return (
    <div className="container mx-auto px-3 md:px-4 pb-6 md:pb-8">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed top-6 right-6 z-50 flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl shadow-lg font-semibold text-white text-xs md:text-sm transition-all animate-in slide-in-from-right-4",
            toast.type === "success" ? "bg-green-600" : "bg-red-600",
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 md:w-5 h-4 md:h-5" />
          ) : (
            <XCircle className="w-4 md:w-5 h-4 md:h-5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <AdminHeader
        title="Global Blacklist"
        subtitle="Manage verified fraud indicators to protect the OctoSight community."
        stat={{ label: "Active Blocks", value: entries.length }}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 md:gap-4 px-4 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all",
                activeTab === tab.id
                  ? "bg-secondary text-white shadow-md scale-105"
                  : "bg-white text-secondary/80 border border-neutral-border hover:border-secondary/40 hover:bg-neutral-page",
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card bg-white border border-neutral-border shadow-sm rounded-2xl md:rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-14 md:p-20 text-center flex flex-col items-center gap-2 md:gap-3">
            <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs md:text-sm font-bold text-secondary/60">
              Syncing with blacklist database...
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-14 md:p-20 text-center max-w-md mx-auto">
            <div className="size-16 bg-neutral-page rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <ShieldOff className="size-8 text-secondary/20" />
            </div>
            <p className="text-secondary font-bold text-base md:text-lg">
              No {activeTab}s blocked yet
            </p>
            <p className="text-secondary/60 text-xs md:text-sm mt-1.5 md:mt-2 font-medium">
              You can add new entries during ticket investigation or through the
              API.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-page/50 text-xs md:text-sm font-bold text-secondary border-b border-neutral-border">
                <tr>
                  <th
                    className="px-6 md:px-8 py-4 md:py-5 cursor-pointer select-none"
                    onClick={() => toggleSort("value")}
                  >
                    Blocked {activeTab}{" "}
                    {sortBy === "value" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 md:px-8 py-4 md:py-5 text-center cursor-pointer select-none"
                    onClick={() => toggleSort("reason")}
                  >
                    Reason / Modus{" "}
                    {sortBy === "reason" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-6 md:px-8 py-4 md:py-5 text-center">
                    Source Ticket
                  </th>
                  <th
                    className="px-6 md:px-8 py-4 md:py-5 text-center cursor-pointer select-none"
                    onClick={() => toggleSort("created_at")}
                  >
                    Date Added{" "}
                    {sortBy === "created_at" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-6 md:px-8 py-4 md:py-5 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border">
                {paginatedEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-neutral-page/30 transition-colors group"
                  >
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex flex-col">
                        <span
                          className="font-semibold text-secondary text-xs md:text-sm break-all"
                          title={getEntryValue(entry)}
                        >
                          {getEntryValue(entry)}
                        </span>
                        {activeTab === "url" && (
                          <span className="text-xs font-semibold text-secondary/60 mt-0.5 md:mt-1">
                            {entry.domain}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      <p className="text-xs md:text-sm font-semibold text-secondary/80 max-w-xs break-words inline-block text-left">
                        {entry.reason || (
                          <span className="text-secondary/60 font-medium">
                            No details provided
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      {entry.ticket_id ? (
                        <Link
                          href={`/admin/investigate/${entry.ticket_id}`}
                          className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-primary/5 text-primary text-xs font-semibold rounded-md md:rounded-lg hover:bg-primary hover:text-white transition-all border border-primary/10"
                        >
                          {entry.ticket_id}
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold text-secondary/60">
                          None
                        </span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      <span className="text-xs font-semibold text-secondary/80">
                        {formatDateTime(entry.created_at).date}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      <button
                        onClick={() =>
                          handleRemoveClick(
                            entry.id,
                            getEntryValue(entry) || "",
                          )
                        }
                        disabled={removing === entry.id}
                        className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 text-xs font-bold text-risk-high hover:bg-risk-high/5 rounded-md md:rounded-lg transition-all disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {entries.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={entries.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={`Remove from Blacklist?`}
        message={`Are you sure you want to remove "${confirmConfig.value}" from the global ${activeTab} blacklist? This item will no longer be automatically blocked.`}
        confirmText="Confirm"
        type="danger"
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmRemove}
        isLoading={removing !== null}
      />
    </div>
  );
}
