"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Ticket } from "@/types/ticket";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { SearchBar } from "@/components/ui/SearchBar";
import { ThreatTable } from "@/components/admin/ThreatTable";

export default function TriagePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Advanced Filters State
  const [filters, setFilters] = useState({
    priority: 'All',
    status: 'All',
    type: 'All',
    flag: 'All',
    startDate: '',
    endDate: ''
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [availableFlags, setAvailableFlags] = useState<string[]>([]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/tickets");
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        throw new Error(`Server Error (${response.status}): ${text.substring(0, 50)}...`);
      }

      if (!response.ok) throw new Error("Failed to fetch tickets");
      const data = await response.json();
      setTickets(data);
      
      // Extract unique flags
      const flags = new Set<string>();
      data.forEach((t: Ticket) => {
        if (t.flags) {
          t.flags.split(',').forEach(f => {
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

  const filteredTickets = tickets.filter(t => {
    const matchPriority = filters.priority === 'All' || t.priority === filters.priority;
    const matchStatus = filters.status === 'All' || t.status === filters.status;
    const matchType = filters.type === 'All' || t.type === filters.type;
    const matchFlag = filters.flag === 'All' || (t.flags && t.flags.includes(filters.flag));
    
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

    return matchPriority && matchStatus && matchType && matchFlag && matchDate;
  });

  const resetFilters = () => {
    setFilters({
      priority: 'All',
      status: 'All',
      type: 'All',
      flag: 'All',
      startDate: '',
      endDate: ''
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-neutral-border rounded-full transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-secondary">Triage Management</h1>
            <p className="text-secondary font-normal opacity-70">Advanced search and multi-factor threat filtering.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchTickets} className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-neutral-border shadow-sm transition-all">
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

      {/* Advanced Filter Panel */}
      <div className="card p-6 mb-8 bg-white border-primary/10 border-t-4 shadow-xl overflow-visible">
        <div className="flex items-center gap-2 mb-6 border-b border-neutral-border pb-4">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z"></path></svg>
          <h2 className="font-bold text-sm text-secondary">Advanced Search Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <Select 
            label="Priority"
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            options={[
              {value: "All", label: "All Priority"},
              {value: "High", label: "High"},
              {value: "Medium", label: "Medium"},
              {value: "Low", label: "Low"}
            ]}
          />

          <Select 
            label="Ticket Status"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            options={[
              {value: "All", label: "All Status"},
              {value: "Submitted", label: "Submitted"},
              {value: "In Review", label: "In Review"},
              {value: "Confirmed", label: "Confirmed"},
              {value: "Mitigated", label: "Mitigated"},
              {value: "Closed", label: "Closed"}
            ]}
          />

          <Select 
            label="Channel"
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            options={[
              {value: "All", label: "All Channels"},
              {value: "Website", label: "Website"},
              {value: "SMS", label: "SMS"},
              {value: "WhatsApp", label: "WhatsApp"},
              {value: "Email", label: "Email"}
            ]}
          />

          <Select 
            label="Detection Flag"
            value={filters.flag}
            onChange={(e) => setFilters({...filters, flag: e.target.value})}
            options={[
              {value: "All", label: "Any Flag"},
              ...availableFlags.map(f => ({value: f, label: f.replaceAll('_', ' ')}))
            ]}
          />

          <DatePicker 
            label="From Date"
            value={filters.startDate}
            onChange={(val) => setFilters({...filters, startDate: val})}
            placeholder="Start Date"
            triggerClassName="py-2 text-sm"
          />

          <DatePicker 
            label="To Date"
            value={filters.endDate}
            onChange={(val) => setFilters({...filters, endDate: val})}
            placeholder="End Date"
            triggerClassName="py-2 text-sm"
          />
        </div>

        <div className="mt-6 pt-4 border-t border-dashed border-neutral-border flex items-center justify-between">
          <p className="text-sm font-medium opacity-60">
            Found <span className="text-secondary opacity-100">{filteredTickets.length}</span> matching reports out of {tickets.length} total
          </p>
          <button 
            onClick={resetFilters}
            className="text-xs font-bold text-risk-high px-3 py-1 rounded transition-all hover:underline hover:underline-offset-4"
          >
            Clear All Filters
          </button>
        </div>
      </div>

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

      <div className="card shadow-md">
        <ThreatTable 
          tickets={filteredTickets.filter(t => 
            t.ticket_id.toLowerCase().includes(searchTerm.toLowerCase())
          )}
          loading={loading}
          emptyMessage="No reports match your filters and search term."
        />
      </div>
    </div>
  );
}
