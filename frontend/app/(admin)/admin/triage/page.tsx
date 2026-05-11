"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { ThreatTable } from "@/components/admin/ThreatTable";
import { Pagination } from "@/components/ui/Pagination";
import { TriageFilters } from "@/components/admin/triage/TriageFilters";
import { useTriageTickets } from "@/modules/admin/hooks/useTriageTickets";

export default function TriagePage() {
  const {
    tickets,
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
  } = useTriageTickets();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
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
            <h1 className="text-3xl font-black text-secondary">
              Triage Management
            </h1>
            <p className="text-secondary font-normal opacity-70">
              Advanced search and multi-factor threat filtering.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchTickets}
            className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-neutral-border shadow-sm transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-risk-high/10 text-risk-high p-4 rounded-xl mb-6 font-bold text-sm text-center border border-risk-high/20">
          Error: {error}
        </div>
      )}

      <TriageFilters
        filters={filters}
        setFilters={setFilters}
        availableFlags={availableFlags}
        filteredCount={filteredTickets.length}
        totalCount={tickets.length}
        onReset={resetFilters}
      />

      <div className="mb-8">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          onSearch={(e) => e.preventDefault()}
          placeholder="Search Ticket ID (e.g., OCTO-9921)..."
          buttonText="Search"
          className="max-w-xl"
        />
      </div>

      <div className="mb-8 card shadow-md overflow-hidden border border-neutral-border">
        <ThreatTable
          tickets={paginatedTickets}
          loading={loading}
          emptyMessage="No reports match your filters and search term."
        />
        <Pagination
          currentPage={currentPage}
          totalItems={filteredTickets.length}
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
