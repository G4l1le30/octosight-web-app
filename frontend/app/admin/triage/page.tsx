"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Ticket } from "@/types/ticket";

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

  const [availableFlags, setAvailableFlags] = useState<string[]>([]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const ADMIN_AUTH = btoa("admin:admin1234");
      const response = await fetch("/api/v1/tickets", {
        headers: { "Authorization": `Basic ${ADMIN_AUTH}` }
      });
      
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
        <div>
          <h1 className="text-3xl font-black mb-1">Triage Management</h1>
          <p className="text-secondary-light font-medium">Advanced search and multi-factor threat filtering.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchTickets} className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-neutral-border shadow-sm transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
          <Link href="/admin" className="text-sm font-black text-primary hover:underline px-4">← Dashboard</Link>
        </div>
      </div>

      {error && (
        <div className="bg-risk-high/10 text-risk-high p-4 rounded-xl mb-6 font-bold text-sm text-center border border-risk-high/20">
          Error: {error}
        </div>
      )}

      {/* Advanced Filter Panel */}
      <div className="card p-6 mb-8 bg-white border-primary/10 border-t-4 shadow-xl">
        <div className="flex items-center gap-2 mb-6 border-b border-neutral-border pb-4">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z"></path></svg>
          <h2 className="font-black uppercase tracking-widest text-sm">Advanced Search Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-40">Priority</label>
            <select 
              className="w-full p-2 bg-neutral-page border border-neutral-border rounded font-bold text-xs outline-none focus:border-primary"
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
            >
              <option value="All">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-40">Ticket Status</label>
            <select 
              className="w-full p-2 bg-neutral-page border border-neutral-border rounded font-bold text-xs outline-none focus:border-primary"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="All">All Status</option>
              <option value="Submitted">Submitted</option>
              <option value="In Review">In Review</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-40">Channel</label>
            <select 
              className="w-full p-2 bg-neutral-page border border-neutral-border rounded font-bold text-xs outline-none focus:border-primary"
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
            >
              <option value="All">All Channels</option>
              <option value="Website">Website</option>
              <option value="SMS">SMS</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-40">Detection Flag</label>
            <select 
              className="w-full p-2 bg-neutral-page border border-neutral-border rounded font-bold text-xs outline-none focus:border-primary"
              value={filters.flag}
              onChange={(e) => setFilters({...filters, flag: e.target.value})}
            >
              <option value="All">Any Flag</option>
              {availableFlags.map(f => (
                <option key={f} value={f}>{f.replaceAll('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-40">From Date</label>
            <input 
              type="date" 
              className="w-full p-1.5 bg-neutral-page border border-neutral-border rounded font-bold text-[10px] outline-none focus:border-primary"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-40">To Date</label>
            <input 
              type="date" 
              className="w-full p-1.5 bg-neutral-page border border-neutral-border rounded font-bold text-[10px] outline-none focus:border-primary"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-dashed border-neutral-border flex items-center justify-between">
          <p className="text-[10px] font-bold opacity-40 italic">
            Found <span className="text-secondary opacity-100">{filteredTickets.length}</span> matching reports out of {tickets.length} total
          </p>
          <button 
            onClick={resetFilters}
            className="text-[10px] font-black uppercase text-risk-high hover:bg-risk-high/5 px-3 py-1 rounded transition-all underline underline-offset-4"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      <div className="card shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center opacity-40 font-bold italic">Loading live triage data...</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-white text-xs uppercase font-black text-secondary/40 border-b border-neutral-border">
                <tr>
                  <th className="px-6 py-4">Ticket</th>
                  <th className="px-6 py-4">Target URL / Info</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center opacity-40 italic">No tickets found for this filter.</td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-neutral-page/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-sm">{ticket.ticket_id}</span>
                          <span className="text-[10px] opacity-40 font-bold">{new Date(ticket.created_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col max-w-md">
                          <span className="text-xs font-black uppercase text-secondary/40 mb-1">{ticket.type}</span>
                          <span className="text-sm font-mono truncate opacity-80" title={ticket.url || ""}>{ticket.url}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm" style={{
                            backgroundColor: ticket.risk_score > 70 ? '#e31e2415' : ticket.risk_score > 30 ? '#f9731615' : '#00a65115',
                            color: ticket.risk_score > 70 ? '#e31e24' : ticket.risk_score > 30 ? '#f97316' : '#00a651'
                          }}>
                            {ticket.risk_score}
                          </div>
                          <div className="h-1.5 w-16 bg-neutral-border rounded-full overflow-hidden hidden md:block">
                            <div className="h-full rounded-full" style={{
                              width: `${ticket.risk_score}%`,
                              backgroundColor: ticket.risk_score > 70 ? '#e31e24' : ticket.risk_score > 30 ? '#f97316' : '#00a651'
                            }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${
                          ticket.status === 'Mitigated' || ticket.status === 'Closed' ? 'bg-neutral-border text-secondary/40' : 'bg-primary/10 text-primary'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link 
                          href={`/admin/investigate/${ticket.ticket_id}`}
                          className="text-xs font-black text-secondary hover:text-primary transition-colors bg-white border border-neutral-border px-3 py-1.5 rounded-lg shadow-sm"
                        >
                          Investigate
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
