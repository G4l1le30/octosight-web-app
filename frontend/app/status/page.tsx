"use client";

import { useState } from "react";
import StatusResult from "@/components/status/StatusResult";
import { Ticket } from "@/types/ticket";

export default function StatusPage() {
  const [ticketId, setTicketId] = useState("");
  const [result, setResult] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId) return;
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`/api/v1/tickets/${ticketId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Ticket not found. Please check your ID.");
        throw new Error("Failed to fetch ticket status.");
      }
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black mb-4">Track Your Report</h1>
        <p className="text-secondary-light">Enter your Ticket ID to see the real-time analysis and mitigation status.</p>
      </div>

      <div className="card p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input 
            type="text" 
            placeholder="Enter Ticket ID (e.g., OCTO-9921)" 
            className="flex-1 p-4 border-2 border-neutral-border rounded-lg focus:border-primary outline-none transition-all font-mono text-sm uppercase"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value.toUpperCase())}
          />
          <button type="submit" disabled={loading} className="btn-primary px-8 flex items-center gap-2">
            {loading ? "Searching..." : "Track"}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-risk-high/10 text-risk-high p-4 rounded-lg mb-6 font-bold text-sm text-center">
          {error}
        </div>
      )}

      {result && <StatusResult result={result} />}
    </div>
  );
}
