"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Flag } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TransactionsTable } from "@/components/admin/TransactionsTable";

interface Transaction {
  id: number;
  reference_number: string;
  sender_name: string;
  sender_account: string | null;
  sender_bank: string | null;
  receiver_account: string | null;
  receiver_bank: string | null;
  amount: number;
  transaction_type: string;
  status: string;
  description: string | null;
  merchant_name: string | null;
  location: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  anomaly_score: number;
  transaction_date: string;
  created_at: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("transaction_date");
  const [sortDir, setSortDir] = useState("desc");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: String(itemsPerPage),
        sort_by: sortBy,
        sort_dir: sortDir,
      });
      if (typeFilter) params.set("transaction_type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (flaggedOnly) params.set("flagged_only", "true");

      const res = await fetch(`/api/v1/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    sortBy,
    sortDir,
    typeFilter,
    statusFilter,
    flaggedOnly,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (t) =>
        t.reference_number.toLowerCase().includes(q) ||
        t.sender_name.toLowerCase().includes(q) ||
        (t.merchant_name || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q),
    );
  }, [transactions, search]);

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  return (
    <>
      <AdminHeader
        title="Transactions"
        subtitle="Monitor and review all bank transactions"
        stat={{ label: "Total", value: total }}
      />

      <div className="container mx-auto px-4 pb-6 md:pb-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/60"
            />
            <input
              type="text"
              placeholder="Search ref, sender, merchant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-neutral-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 pr-10 text-sm border-2 border-neutral-border rounded-lg outline-none transition-all font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 bg-white appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundSize: "0.9rem",
            }}
          >
            <option value="">All Types</option>
            <option value="TRANSFER">Transfer</option>
            <option value="DEBIT">Debit</option>
            <option value="CREDIT">Credit</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 pr-10 text-sm border-2 border-neutral-border rounded-lg outline-none transition-all font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 bg-white appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundSize: "0.9rem",
            }}
          >
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FLAGGED">Flagged</option>
            <option value="REVERSED">Reversed</option>
          </select>

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none font-medium">
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={() => {
                setFlaggedOnly(!flaggedOnly);
                setCurrentPage(1);
              }}
              className="rounded text-sm border-neutral-border"
            />
            Flagged only
          </label>
        </div>

        {/* Table */}
        <div className="card bg-white border border-neutral-border shadow-sm rounded-3xl overflow-hidden">
          <TransactionsTable
            transactions={filtered}
            loading={loading}
            emptyMessage="No transactions found."
            onSort={toggleSort}
            sortBy={sortBy}
            sortDir={sortDir}
          />
          <Pagination
            currentPage={currentPage}
            totalItems={total}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(v) => {
              setItemsPerPage(v);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
    </>
  );
}
