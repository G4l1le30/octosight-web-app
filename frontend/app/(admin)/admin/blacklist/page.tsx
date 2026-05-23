"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldOff, CheckCircle2, XCircle, Globe, CreditCard, Phone, Mail, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; id: number | null; value: string }>({
    isOpen: false,
    id: null,
    value: "",
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
  }, [fetchEntries]);

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
      const res = await fetch(`/api/v1/admin/blacklist${endpoint}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast("success", `${typeLabel} removed from blacklist.`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      showToast("error", "Failed to remove entry.");
    } finally {
      setRemoving(null);
    }
  };

  const getEntryValue = (entry: BlacklistEntry) => {
    switch (activeTab) {
      case "url": return entry.url;
      case "account": return `${entry.bank_name}: ${entry.account_number}`;
      case "phone": return entry.phone_number;
      case "email": return entry.email;
    }
  };

  const tabs = [
    { id: "url" as const, label: "Websites", icon: Globe },
    { id: "account" as const, label: "Bank Accounts", icon: CreditCard },
    { id: "phone" as const, label: "Phone Numbers", icon: Phone },
    { id: "email" as const, label: "Email Addresses", icon: Mail },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed top-6 right-6 z-50 flex items-center gap-2 px-6 py-4 rounded-xl shadow-lg font-semibold text-white text-sm transition-all animate-in slide-in-from-right-4",
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          )}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-neutral-border rounded-full transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-black text-secondary tracking-tight">Global Blacklist</h1>
            <p className="text-secondary font-medium opacity-60">
              Manage verified fraud indicators to protect the OctoSight community.
            </p>
          </div>
        </div>
        <div className="bg-risk-high/10 border border-risk-high/20 rounded-2xl px-6 py-4 flex items-center gap-4">
          <div>
             <p className="text-2xl font-black text-risk-high leading-none">{entries.length}</p>
             <p className="text-[10px] text-risk-high uppercase font-black tracking-widest mt-1">Active Blocks</p>
          </div>
          <ShieldOff className="size-8 text-risk-high opacity-40" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all",
                activeTab === tab.id
                  ? "bg-secondary text-white shadow-md scale-105"
                  : "bg-white text-secondary/60 border border-neutral-border hover:border-secondary/40 hover:bg-neutral-page"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card bg-white border border-neutral-border shadow-sm rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-3">
             <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
             <p className="text-sm font-bold text-secondary/40">Syncing with blacklist database...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-20 text-center max-w-md mx-auto">
            <div className="size-16 bg-neutral-page rounded-2xl flex items-center justify-center mx-auto mb-6">
               <ShieldOff className="size-8 text-secondary/20" />
            </div>
            <p className="text-secondary font-black text-lg">No {activeTab}s blocked yet</p>
            <p className="text-secondary/50 text-sm mt-2 font-medium">
              You can add new entries during ticket investigation or through the API.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-page/50 text-[11px] font-black text-secondary/50 uppercase tracking-widest border-b border-neutral-border">
                <tr>
                  <th className="px-8 py-5">Blocked {activeTab}</th>
                  <th className="px-8 py-5">Reason / Modus</th>
                  <th className="px-8 py-5">Source Ticket</th>
                  <th className="px-8 py-5">Date Added</th>
                  <th className="px-8 py-5 text-right text-secondary/30 font-bold lowercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border">
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-neutral-page/30 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-secondary text-sm break-all" title={getEntryValue(entry)}>
                          {getEntryValue(entry)}
                        </span>
                        {activeTab === "url" && <span className="text-[10px] font-bold text-secondary/40 uppercase mt-1">{entry.domain}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-secondary/70 max-w-xs break-words">
                        {entry.reason || <span className="opacity-30 italic font-medium">No details provided</span>}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      {entry.ticket_id ? (
                        <Link
                          href={`/admin/investigate/${entry.ticket_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary text-xs font-black rounded-lg hover:bg-primary hover:text-white transition-all border border-primary/10"
                        >
                          {entry.ticket_id}
                        </Link>
                      ) : (
                        <span className="text-xs font-bold text-secondary opacity-30">—</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-secondary/60">
                        {formatDateTime(entry.created_at).date}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => handleRemoveClick(entry.id, getEntryValue(entry) || "")}
                        disabled={removing === entry.id}
                        className="p-2.5 text-secondary/40 hover:text-risk-high hover:bg-risk-high/5 rounded-xl transition-all disabled:opacity-50"
                        title="Remove from blacklist"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={`Remove from Blacklist?`}
        message={`Are you sure you want to remove "${confirmConfig.value}" from the global ${activeTab} blacklist? This item will no longer be automatically blocked.`}
        confirmText="Confirm Removal"
        type="danger"
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmRemove}
        isLoading={removing !== null}
      />
    </div>
  );
}
