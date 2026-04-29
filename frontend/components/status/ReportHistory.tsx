"use client";

import React, { useState } from "react";
import { Ticket } from "@/types/ticket";
import { 
  History, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  Loader2,
  Globe,
  MessageSquare,
  Mail,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";

interface ReportHistoryProps {
  history: Ticket[];
  loading: boolean;
  onSelect: (ticket: Ticket) => void;
  selectedId?: number;
}

export function ReportHistory({ 
  history, 
  loading, 
  onSelect, 
  selectedId 
}: ReportHistoryProps) {
  const [visibleCount, setVisibleCount] = useState(10);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "submitted": return "bg-blue-50 text-blue-700 border-blue-200";
      case "in review": return "bg-orange-50 text-orange-700 border-orange-200";
      case "confirmed": return "bg-red-50 text-red-700 border-red-200";
      case "false positive": return "bg-green-50 text-green-700 border-green-200";
      case "mitigated": return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "closed": return "bg-gray-100 text-gray-600 border-gray-200";
      default: return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "website": return <Globe className="size-4" />;
      case "sms": return <MessageSquare className="size-4" />;
      case "whatsapp": return (
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      );
      case "email": return <Mail className="size-4" />;
      default: return <MoreHorizontal className="size-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="card p-8 border-neutral-border shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/5 text-primary">
            <History className="size-6" />
          </div>
          <h2 className="text-xl font-bold text-secondary">Submission History</h2>
        </div>
        <span className="text-xs font-bold text-secondary/40">{history.length} Reports Found</span>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="animate-spin size-8 text-primary mx-auto mb-4" />
          <p className="text-secondary/40 font-medium">Loading history...</p>
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-3">
          {history.slice(0, visibleCount).map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => onSelect(ticket)}
              className={`w-full grid grid-cols-1 sm:grid-cols-12 items-center gap-4 p-4 rounded-xl border transition-all text-left group ${
                selectedId === ticket.id 
                  ? "border-primary bg-primary/5 shadow-sm" 
                  : "border-neutral-border hover:border-primary/30 hover:bg-neutral-page"
              }`}
            >
              <div className="col-span-3">
                <p className="text-sm font-bold text-secondary">{ticket.ticket_id}</p>
                <p className="text-[10px] font-bold text-secondary/30 flex items-center gap-1 mt-0.5">
                  <Clock className="size-3" />
                  {formatDate(ticket.created_at)}
                </p>
              </div>
              
              <div className="col-span-5 flex items-center gap-3">
                <div className="p-1.5 rounded bg-neutral-page border border-neutral-border text-primary">
                  {getTypeIcon(ticket.type)}
                </div>
                <p className="text-xs font-bold text-secondary truncate max-w-full">
                  {ticket.url || ticket.sender_numbers || "No data"}
                </p>
              </div>

              <div className="col-span-2 flex justify-center">
                <span className={`text-[11px] font-black ${
                  ticket.risk_score > 70 ? "text-risk-high" : ticket.risk_score > 30 ? "text-risk-medium" : "text-green-600"
                }`}>
                  {ticket.risk_score}/100
                </span>
              </div>

              <div className="col-span-2 flex justify-end items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
                <ChevronRight className="size-4 text-secondary/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}

          {visibleCount < history.length && (
            <div className="pt-4 text-center">
              <button 
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="px-6 py-2 bg-neutral-page border border-neutral-border rounded-xl text-xs font-bold text-secondary hover:border-primary/30 hover:bg-white transition-all shadow-sm"
              >
                Show More Reports
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center bg-neutral-page rounded-xl border-2 border-dashed border-neutral-border">
          <p className="text-secondary/40 font-medium text-sm">You haven't submitted any reports yet.</p>
          <Link href="/report" className="text-primary font-bold text-sm hover:underline mt-2 inline-block">
            Submit your first report
          </Link>
        </div>
      )}
    </div>
  );
}
