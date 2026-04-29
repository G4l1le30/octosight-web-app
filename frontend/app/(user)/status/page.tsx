"use client";

import { useState, useEffect } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import StatusResult from "@/components/status/StatusResult";
import { Ticket } from "@/types/ticket";
import { useAuth } from "@/lib/auth-context";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthRequired } from "@/components/auth/AuthRequired";
import { ReportHistory } from "@/components/status/ReportHistory";

export default function StatusPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [ticketId, setTicketId] = useState("");
  const [result, setResult] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch("/api/v1/user/tickets");
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

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
      router.push(`/report/${data.ticket_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectTicket = (ticket: Ticket) => {
    router.push(`/report/${ticket.ticket_id}`);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-secondary font-medium">Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthRequired 
        description="Please log in to your account to track your report progress and view your submission history."
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 text-secondary">Track Your Reports</h1>
        <p className="text-secondary opacity-70 font-medium max-w-xl mx-auto">
          Enter a Ticket ID manually or select from your recent submission history below.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Search Section */}
        <div className="card p-5 shadow-xl border-neutral-border">
          <SearchBar 
            value={ticketId}
            onChange={setTicketId}
            onSearch={handleSearch}
            placeholder="Enter Ticket ID (e.g., OCTO-9921)"
            loading={loading}
            buttonText="Track Report"
            inputClassName="font-medium"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-risk-high/10 text-risk-high p-4 rounded-xl font-bold text-xs text-center border border-risk-high/20">
            <AlertTriangle className="inline-block size-4 mr-2 -mt-0.5" />
            {error}
          </div>
        )}

        {/* History Section */}
        <ReportHistory 
          history={history}
          loading={historyLoading}
          onSelect={selectTicket}
        />
      </div>
    </div>
  );
}
