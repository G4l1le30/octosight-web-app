"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Ticket } from "@/types/ticket";

interface PaginatedResponse {
  items: Ticket[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface TriageFiltersState {
  priority: string;
  status: string;
  type: string;
  flag: string;
  startDate: string;
  endDate: string;
}

export const useTriageTickets = (externalSortBy?: string, externalSortDir?: string) => {
  const [paginatedData, setPaginatedData] = useState<PaginatedResponse>({
    items: [],
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableFlags, setAvailableFlags] = useState<string[]>([]);

  const [filters, setFilters] = useState<TriageFiltersState>({
    priority: "All",
    status: "All",
    type: "All",
    flag: "All",
    startDate: "",
    endDate: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: String(currentPage),
      per_page: String(itemsPerPage),
      sort_by: externalSortBy || "created_at",
      sort_dir: externalSortDir || "desc",
    });
    if (filters.status !== "All") params.set("status", filters.status);
    if (filters.priority !== "All") params.set("priority", filters.priority);
    return `/api/v1/tickets?${params}`;
  }, [currentPage, itemsPerPage, filters.status, filters.priority, externalSortBy, externalSortDir]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = buildUrl();
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch tickets");

      const data = await response.json();

      if (data && Array.isArray(data.items)) {
        setPaginatedData({
          items: data.items,
          total: data.total ?? 0,
          page: data.page ?? 1,
          per_page: data.per_page ?? itemsPerPage,
          total_pages: data.total_pages ?? 0,
        });

        const flags = new Set<string>();
        data.items.forEach((t: Ticket) => {
          if (t.flags) {
            t.flags.split(",").forEach((f) => {
              if (f.trim()) flags.add(f.trim());
            });
          }
        });
        setAvailableFlags(Array.from(flags));
      } else {
        setPaginatedData({ items: [], total: 0, page: 1, per_page: itemsPerPage, total_pages: 0 });
        setAvailableFlags([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildUrl, itemsPerPage]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.priority]);

    const filteredTickets = useMemo(() => {
      // Safely handle case where paginatedData or paginatedData.items might be undefined/null
      if (!paginatedData || !paginatedData.items || !Array.isArray(paginatedData.items)) {
        return [];
      }
      return paginatedData.items.filter((t) => {
       const matchPriority =
         filters.priority === "All" || t.priority === filters.priority;
       const matchStatus =
         filters.status === "All" || t.status === filters.status;
       const matchType = filters.type === "All" || t.type === filters.type;
       const matchFlag =
         filters.flag === "All" || (t.flags && t.flags.includes(filters.flag));

       const matchSearch =
         !searchTerm ||
         t.ticket_id.toLowerCase().includes(searchTerm.toLowerCase());

       let matchDate = true;
       if (filters.startDate || filters.endDate) {
         const ticketDate = new Date(t.created_at).getTime();
         if (filters.startDate) {
           const start = new Date(filters.startDate).getTime();
           if (ticketDate < start) matchDate = false;
         }
         if (filters.endDate) {
           const end = new Date(filters.endDate).setHours(23, 59, 59, 999);
           if (ticketDate > end) matchDate = false;
         }
       }

       return (
         matchPriority &&
         matchStatus &&
         matchType &&
         matchFlag &&
         matchDate &&
         matchSearch
       );
     });
   }, [paginatedData?.items, filters, searchTerm]);

  const paginatedTickets = filteredTickets;

  const resetFilters = () => {
    setFilters({
      priority: "All",
      status: "All",
      type: "All",
      flag: "All",
      startDate: "",
      endDate: "",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const assignTicket = useCallback(
    async (ticketId: string, email: string) => {
      try {
        setError("");
        const response = await fetch(`/api/v1/tickets/${ticketId}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assigned_to: email }),
        });
        if (!response.ok) throw new Error("Failed to assign ticket");
        await fetchTickets();
      } catch (err: any) {
        setError(err.message);
      }
    },
    [fetchTickets],
  );

  return {
    tickets: paginatedData.items,
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
  };
};
