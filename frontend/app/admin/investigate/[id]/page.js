"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";

export default function InvestigatePage({ params }) {
  const { id: ticketId } = use(params);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/tickets/${ticketId}`);
      if (!res.ok) throw new Error("Ticket not found");
      const data = await res.json();
      setTicket(data);
      setNotes(data.investigation_notes || "");
      setStatus(data.status);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status,
          investigation_notes: notes
        }),
      });
      if (res.ok) alert("Ticket updated successfully!");
    } catch (err) {
      alert("Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold opacity-40">Loading investigation data...</div>;
  if (!ticket) return <div className="p-20 text-center font-bold text-risk-high text-xl">Ticket # {ticketId} Not Found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/triage" className="p-2 hover:bg-neutral-border rounded-full transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-3xl font-black">Investigate {ticket.ticket_id}</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={handleUpdate} disabled={saving} className="btn-primary px-8">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Analysis & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <div className="card p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase opacity-40">Target Indicator</span>
                <p className="text-xl font-mono text-primary font-bold break-all">{ticket.url}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase opacity-40">Risk Score</span>
                <p className={`text-4xl font-black ${ticket.risk_score > 70 ? 'text-risk-high' : 'text-risk-medium'}`}>{ticket.risk_score}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-neutral-border">
              <div>
                <span className="text-[10px] font-black uppercase opacity-40 block mb-1">Type</span>
                <span className="font-bold">{ticket.type}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase opacity-40 block mb-1">Priority</span>
                <span className={`font-black text-xs px-2 py-0.5 rounded ${
                  ticket.priority === 'High' ? 'bg-risk-high/10 text-risk-high' : 'bg-risk-medium/10 text-risk-medium'
                }`}>{ticket.priority}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase opacity-40 block mb-1">Submitted</span>
                <span className="font-bold text-xs">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase opacity-40 block mb-1">Status</span>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="text-xs font-black bg-neutral-page border border-neutral-border rounded p-1 outline-none"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="In Review">In Review</option>
                  <option value="Confirmed">Confirmed (Phish)</option>
                  <option value="False Positive">False Positive</option>
                  <option value="Mitigated">Mitigated</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-black text-sm mb-4">Detection Engine Flags</h3>
              <div className="flex flex-wrap gap-2">
                {ticket.flags?.split(',').map((flag, idx) => (
                  <span key={idx} className="bg-secondary text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {flag.replace(/_/g, ' ')}
                  </span>
                ))}
                {!ticket.flags && <span className="text-xs italic opacity-40">No specific rule flags triggered.</span>}
              </div>
            </div>
          </div>

          {/* Evidence/Summary Section */}
          <div className="card p-8">
            <h3 className="font-black text-sm mb-4">User-Provided Summary</h3>
            <div className="bg-neutral-page p-6 rounded-xl border border-neutral-border min-h-32 text-sm leading-relaxed italic opacity-70">
              "{ticket.summary || "No summary provided by the user."}"
            </div>
          </div>
        </div>

        {/* Right Column: Investigation Tools */}
        <div className="space-y-8">
          <div className="card p-6">
            <h3 className="font-black text-sm mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Internal Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record investigation findings, domain whois info, or escalation notes here..."
              className="w-full h-64 p-4 text-sm bg-neutral-page border border-neutral-border rounded-xl focus:border-primary outline-none transition-all"
            ></textarea>
          </div>

          <div className="card p-6 bg-secondary text-white border-none shadow-lg">
            <h3 className="font-black text-sm mb-4 uppercase tracking-widest text-primary-light">Mitigation Actions</h3>
            <div className="space-y-3">
              <button className="w-full py-2 bg-white/10 hover:bg-primary text-xs font-black rounded-lg transition-all text-left px-4 flex items-center justify-between group">
                Add to Internal Blacklist
                <span className="opacity-0 group-hover:opacity-100 transition-all">→</span>
              </button>
              <button className="w-full py-2 bg-white/10 hover:bg-primary text-xs font-black rounded-lg transition-all text-left px-4 flex items-center justify-between group">
                Generate Warning Template
                <span className="opacity-0 group-hover:opacity-100 transition-all">→</span>
              </button>
              <button className="w-full py-2 bg-white/10 hover:bg-risk-medium text-xs font-black rounded-lg transition-all text-left px-4 flex items-center justify-between group">
                Escalate to SOC Team
                <span className="opacity-0 group-hover:opacity-100 transition-all">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
