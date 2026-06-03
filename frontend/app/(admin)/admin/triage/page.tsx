"use client";

import Link from "next/link";
import { RefreshCw, Download } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { ThreatTable } from "@/components/admin/ThreatTable";
import { Pagination } from "@/components/ui/Pagination";
import { TriageFilters } from "@/components/admin/triage/TriageFilters";
import { useTriageTickets } from "@/modules/admin/hooks/useTriageTickets";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_OPTIONS = ["Submitted", "In Review", "Confirmed", "False Positive", "Mitigated", "Closed"] as const;
const PRIORITY_OPTIONS = ["High", "Medium", "Low"] as const;

export default function TriagePage() {
  const {
    tickets,
    paginatedData,
    loading,
    error,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    availableFlags,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    filteredTickets,
    paginatedTickets,
    resetFilters,
    fetchTickets,
    assignTicket,
  } = useTriageTickets();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkPriority, setBulkPriority] = useState("");
  const [bulkAssignTo, setBulkAssignTo] = useState("");
  const [bulkApplying, setBulkApplying] = useState(false);

  const handleBulkCancel = () => {
    setSelectedIds([]);
    setBulkStatus("");
    setBulkPriority("");
    setBulkAssignTo("");
  };

  const handleBulkApply = async () => {
    if (selectedIds.length === 0) return;
    setBulkApplying(true);
    try {
      const body: Record<string, unknown> = { ticket_ids: selectedIds };
      if (bulkStatus) body.status = bulkStatus;
      if (bulkPriority) body.priority = bulkPriority;
      if (bulkAssignTo.trim()) body.assigned_to = bulkAssignTo.trim();

      const res = await fetch("/api/v1/tickets/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Bulk operation failed");
      toast.success(`Updated ${selectedIds.length} ticket(s) successfully`);
      handleBulkCancel();
      fetchTickets();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bulk operation failed");
    } finally {
      setBulkApplying(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8">
        <div className="flex items-center gap-3 md:gap-4">
          <Link
            href="/admin"
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
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary">
              Triage Management
            </h1>
            <p className="text-secondary font-normal mt-2">
              Advanced search and multi-factor threat filtering.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const params = new URLSearchParams();
              if (filters.status !== "All") params.set("status", filters.status);
              if (filters.priority !== "All") params.set("priority", filters.priority);
              window.open(`/api/v1/tickets/export?${params.toString()}`, "_blank");
            }}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Download CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTickets}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-risk-high/10 text-risk-high p-3 md:p-4 rounded-xl mb-6 font-bold text-sm text-center border border-risk-high/20">
          Error: {error}
        </div>
      )}

      <TriageFilters
        filters={filters}
        setFilters={setFilters}
        availableFlags={availableFlags}
        filteredCount={filteredTickets.length}
        totalCount={paginatedData?.total ?? 0}
        onReset={resetFilters}
      />

      <div className="mb-6 md:mb-8">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          onSearch={(e) => e.preventDefault()}
          placeholder="Search Ticket ID (e.g., OCTO-9921)..."
          buttonText="Search"
          className="max-w-2xl"
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-neutral-page border border-neutral-border rounded-xl flex-wrap">
          <span className="text-sm font-bold text-secondary whitespace-nowrap">
            {selectedIds.length} selected
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="text-sm border border-neutral-border rounded-lg px-3 py-2 outline-none focus:border-primary bg-white"
          >
            <option value="">Status...</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={bulkPriority}
            onChange={(e) => setBulkPriority(e.target.value)}
            className="text-sm border border-neutral-border rounded-lg px-3 py-2 outline-none focus:border-primary bg-white"
          >
            <option value="">Priority...</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            type="text"
            value={bulkAssignTo}
            onChange={(e) => setBulkAssignTo(e.target.value)}
            placeholder="Assign to..."
            className="text-sm border border-neutral-border rounded-lg px-3 py-2 w-40 outline-none focus:border-primary"
          />
          <Button size="sm" onClick={handleBulkApply} loading={bulkApplying}>
            Apply
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkCancel}>
            Cancel
          </Button>
        </div>
      )}

      <div className="mb-6 md:mb-8 card shadow-md overflow-hidden border border-neutral-border">
        <ThreatTable
          tickets={paginatedTickets}
          loading={loading}
          emptyMessage="No reports match your filters and search term."
          onAssign={assignTicket}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
        <Pagination
          currentPage={currentPage}
          totalItems={paginatedData?.total ?? 0}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}
