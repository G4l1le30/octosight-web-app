"use client";

import { useState, useEffect } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { Ticket } from "@/types/ticket";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthRequired } from "@/components/auth/AuthRequired";
import { ReportHistory } from "@/components/status/ReportHistory";
import { cn, formatDateTime } from "@/lib/utils";
import { Clock, Globe, MessageSquare, Mail, MoreHorizontal, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function StatusPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [ticketId, setTicketId] = useState("");
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

    try {
      const response = await fetch(`/api/v1/tickets/${ticketId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Ticket not found. Please check your ID.");
        throw new Error("Failed to fetch ticket status.");
      }
      const data = await response.json();
      router.push(`/report/${data.ticket_id}`);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const selectTicket = (ticket: Ticket) => {
    router.push(`/report/${ticket.ticket_id}`);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-24 md:py-32 text-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3 md:mb-4" />
        <p className="text-secondary font-medium">Loading...</p>
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
    <div className="container mx-auto px-3 md:px-4 py-8 md:py-12 max-w-6xl">
      <div className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-black mb-3 md:mb-4 bg-gradient-to-r from-primary via-primary-dark to-primary-light bg-clip-text text-transparent">Track Your Reports</h1>
        <p className="text-secondary opacity-70 font-medium max-w-xl mx-auto">
          Enter a Ticket ID manually or select from your recent submission history below.
        </p>
      </div>

      <div className="grid gap-6 md:gap-8">
        {/* Latest Submission Card */}
        {history.length > 0 && (() => {
          const latest = history[0];
          const statusFlow = ["Submitted", "In Review", "Confirmed", "Mitigated", "Closed"];
          const currentIdx = statusFlow.indexOf(latest.status);
          const isFalsePositive = latest.status === "False Positive";
          const getTypeIcon = (type: string) => {
            switch (type.toLowerCase()) {
              case "website": return <Globe className="size-4" />;
              case "sms": return <MessageSquare className="size-4" />;
              case "whatsapp": return (
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
              );
              case "email": return <Mail className="size-4" />;
              default: return <MoreHorizontal className="size-4" />;
            }
          };
          return (
            <Link href={`/report/${latest.ticket_id}`} className="card p-5 md:p-6 shadow-xl border-neutral-border hover:border-primary/30 transition-all block group">
              <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4">
                <div className="p-1 md:p-1.5 rounded-md md:rounded-lg bg-primary/5 text-primary">
                  <AlertTriangle className="size-4" />
                </div>
                <span className="text-xs font-bold text-secondary/60 tracking-wide">LATEST SUBMISSION</span>
                <ChevronRight className="size-4 text-secondary/20 ml-auto group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-5">
                <div>
                  <p className="text-xs font-semibold text-secondary/60 mb-0.5 md:mb-1">Ticket ID</p>
                  <p className="text-sm md:text-base font-bold text-secondary">{latest.ticket_id}</p>
                  <p className="text-xs font-medium text-secondary/70 flex items-center gap-0.5 md:gap-1 mt-0.5">
                    <Clock className="size-3" />
                    {formatDateTime(latest.created_at).full}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-secondary/60 mb-0.5 md:mb-1">Type</p>
                  <div className="flex items-center gap-1 md:gap-1.5">
                    <div className="p-0.5 md:p-1 rounded bg-neutral-page border border-neutral-border text-primary">
                      {getTypeIcon(latest.type)}
                    </div>
                    <span className="text-xs md:text-sm font-bold text-secondary">{latest.type}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-secondary/60 mb-0.5 md:mb-1">Indicator</p>
                  <p className="text-xs md:text-sm font-bold text-secondary break-all line-clamp-1">{latest.url || latest.sender_numbers || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-secondary/60 mb-0.5 md:mb-1">Risk Score</p>
                  <p className={cn("text-base md:text-lg font-bold", latest.risk_score >= 75 ? "text-risk-high" : latest.risk_score >= 35 ? "text-risk-medium" : "text-risk-low")}>
                    {latest.risk_score}
                    <span className="text-xs font-semibold text-secondary/60 ml-0.5 md:ml-1">/ 100</span>
                  </p>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="pt-3 md:pt-4 border-t border-neutral-border">
                <div className="flex items-center gap-0.5 md:gap-1">
                  {isFalsePositive ? (
                    <>
                      {statusFlow.slice(0, 3).map((s, i) => (
                        <div key={s} className="flex items-center gap-0.5 md:gap-1 flex-1 min-w-0">
                          <span className={cn(
                            "text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-sm md:rounded-md border whitespace-nowrap truncate transition-all",
                            i < currentIdx
                              ? "bg-green-50 text-green-700 border-green-200"
                              : i === currentIdx
                                ? "bg-amber-50 text-amber-700 border-amber-200 ring-2 ring-amber-200"
                                : "bg-neutral-page text-secondary/50 border-neutral-border"
                          )}>
                            {s}
                          </span>
                          {i < statusFlow.length - 1 && (
                            <div className={cn("h-px flex-1 min-w-[8px]", i < currentIdx ? "bg-green-300" : "bg-neutral-border")} />
                          )}
                        </div>
                      ))}
                      <span className="text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-sm md:rounded-md border whitespace-nowrap truncate bg-red-50 text-red-700 border-red-200 ring-2 ring-red-200">
                        False Positive
                      </span>
                    </>
                  ) : (
                    statusFlow.map((s, i) => (
                      <div key={s} className="flex items-center gap-0.5 md:gap-1 flex-1 min-w-0">
                        <span className={cn(
                          "text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-sm md:rounded-md border whitespace-nowrap truncate transition-all",
                          i < currentIdx
                            ? "bg-green-50 text-green-700 border-green-200"
                            : i === currentIdx
                              ? "bg-primary/10 text-primary border-primary/30 ring-2 ring-primary/20"
                              : "bg-neutral-page text-secondary/50 border-neutral-border"
                        )}>
                          {s}
                        </span>
                        {i < statusFlow.length - 1 && (
                          <div className={cn("h-px flex-1 min-w-[8px]", i < currentIdx ? "bg-green-300" : "bg-neutral-border")} />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Link>
          );
        })()}

        {/* Search Section */}
        <div className="card p-4 md:p-5 shadow-xl border-neutral-border">
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
