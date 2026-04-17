"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function TriagePage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/tickets");
      if (!response.ok) throw new Error("Failed to fetch tickets");
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = filter === 'All' 
    ? tickets 
    : tickets.filter(t => t.priority === filter);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">Triage Management</h1>
          <p className="text-secondary-light">Review and mitigate high-risk phishing reports.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchTickets} className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <Link href="/admin" className="text-sm font-bold text-primary hover:underline">← Back to Dashboard</Link>
        </div>
      </div>

      {error && (
        <div className="bg-risk-high/10 text-risk-high p-4 rounded-lg mb-6 font-bold text-sm text-center">
          Error: {error}
        </div>
      )}

      <div className="card shadow-md">
        <div className="p-4 border-b border-neutral-border bg-neutral-page flex items-center justify-between">
          <div className="flex gap-2">
            {['All', 'High', 'Medium', 'Low'].map((p) => (
              <button 
                key={p}
                onClick={() => setFilter(p)}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                  filter === p 
                    ? 'bg-secondary text-white' 
                    : 'bg-white border border-neutral-border text-secondary/60 hover:border-secondary/40'
                }`}
              >
                {p} Priority
              </button>
            ))}
          </div>
          <div className="text-xs font-bold opacity-50">
            {loading ? "Loading..." : `Showing ${filteredTickets.length} tickets`}
          </div>
        </div>

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
                    <td colSpan="5" className="px-6 py-10 text-center opacity-40 italic">No tickets found for this filter.</td>
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
                          <span className="text-sm font-mono truncate opacity-80" title={ticket.url}>{ticket.url}</span>
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
                          ticket.status === 'Closed' ? 'bg-neutral-border text-secondary/40' : 'bg-primary/10 text-primary'
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
