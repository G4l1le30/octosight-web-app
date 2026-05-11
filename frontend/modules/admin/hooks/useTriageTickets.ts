"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Ticket } from "@/types/ticket";

export interface TriageFiltersState {
  priority: string;
  status: string;
  type: string;
  flag: string;
  startDate: string;
  endDate: string;
}

export const useTriageTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
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

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/tickets");
      if (!response.ok) throw new Error("Failed to fetch tickets");
      
      const data = await response.json();
      setTickets(data);

      const flags = new Set<string>();
      data.forEach((t: Ticket) => {
        if (t.flags) {
          t.flags.split(",").forEach((f) => {
            if (f.trim()) flags.add(f.trim());
          });
        }
      });
      setAvailableFlags(Array.from(flags));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchPriority =
        filters.priority === "All" || t.priority === filters.priority;
      const matchStatus = filters.status === "All" || t.status === filters.status;
      const matchType = filters.type === "All" || t.type === filters.type;
      const matchFlag =
        filters.flag === "All" || (t.flags && t.flags.includes(filters.flag));

      const matchSearch =
        t.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.url?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (t.sender_numbers?.toLowerCase().includes(searchTerm.toLowerCase()) ??
          false);

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
  }, [tickets, filters, searchTerm]);

  const paginatedTickets = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredTickets.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredTickets, currentPage, itemsPerPage]);

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
  };

  return {
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
  };
};
