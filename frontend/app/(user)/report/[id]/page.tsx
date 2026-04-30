"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import StatusResult from "@/components/status/StatusResult";
import { Ticket } from "@/types/ticket";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthRequired } from "@/components/auth/AuthRequired";

export default function DetailedReportPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && ticketId) {
      fetchTicket();
    }
  }, [user, ticketId]);

  const fetchTicket = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/tickets/${ticketId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Ticket not found.");
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

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <Loader2 className="animate-spin size-12 text-primary mx-auto mb-4" />
        <p className="text-secondary font-medium">Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthRequired description="Please log in to your account to view the detailed analysis report." />
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <Loader2 className="animate-spin size-12 text-primary mx-auto mb-4" />
        <p className="text-secondary font-medium">Fetching report details...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="container mx-auto px-4 py-32 text-center max-w-md">
        <div className="bg-risk-high/10 text-risk-high p-6 rounded-2xl border border-risk-high/20 mb-6">
          <AlertTriangle className="size-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Report Not Found</h2>
          <p className="text-sm font-medium opacity-80">
            {error ||
              "The ticket ID you provided does not exist in our system."}
          </p>
        </div>
        <Button
          onClick={() => router.push("/status")}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="size-4" /> Back to Tracking
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-10 flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
        <button
          onClick={() => router.push("/status")}
          className="p-2 rounded-xl border border-neutral-border hover:bg-neutral-page transition-all text-secondary/40 hover:text-primary group shadow-sm"
          title="Back to History"
        >
          <ChevronLeft className="size-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-secondary">
            Analysis Report
          </h1>
          <p className="text-sm font-bold text-secondary/40 mt-2">
            Verified Phishing Investigation Details
          </p>
        </div>
      </div>

      <div className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <StatusResult result={result} />
      </div>
    </div>
  );
}
