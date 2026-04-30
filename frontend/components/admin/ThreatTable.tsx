import React from "react";
import Link from "next/link";
import { Ticket } from "@/types/ticket";
import { cn } from "@/lib/utils";

interface ThreatTableProps {
  tickets: Ticket[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const ThreatTable: React.FC<ThreatTableProps> = ({
  tickets,
  loading = false,
  emptyMessage = "No matching reports found.",
  className
}) => {
  if (loading) {
    return <div className="py-20 text-center opacity-40 font-bold">Loading threat data...</div>;
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left">
        <thead className="bg-neutral-page text-sm font-bold text-secondary border-b border-neutral-border">
          <tr>
            <th className="px-6 py-4 w-[20%]">Ticket</th>
            <th className="px-6 py-4 w-[15%]">Indicator / Target</th>
            <th className="px-6 py-4">Priority</th>
            <th className="px-6 py-4">Risk Score</th>
            <th className="px-6 py-4">Key Findings</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-border">
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-10 text-center opacity-40">{emptyMessage}</td>
            </tr>
          ) : (
            tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-neutral-page/50 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-bold text-base text-secondary">{ticket.ticket_id}</span>
                    <span className="text-xs opacity-70 font-normal text-secondary">
                      {new Date(ticket.created_at).toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-secondary opacity-60 mb-1">{ticket.type}</span>
                    <span 
                      className="text-sm font-normal text-secondary break-all line-clamp-1" 
                      title={(ticket.type === 'SMS' || ticket.type === 'WhatsApp') ? (ticket.sender_numbers || "N/A") : (ticket.url || "N/A")}
                    >
                      {(ticket.type === 'SMS' || ticket.type === 'WhatsApp') ? (ticket.sender_numbers || "N/A") : (ticket.url || "N/A")}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    ticket.priority === 'High' ? 'text-risk-high' :
                    ticket.priority === 'Medium' ? 'text-risk-medium' :
                    'text-risk-low'
                  )}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm" style={{
                      backgroundColor: ticket.risk_score > 70 ? '#e31e2415' : ticket.risk_score > 30 ? '#f9731615' : '#00a65115',
                      color: ticket.risk_score > 70 ? '#e31e24' : ticket.risk_score > 30 ? '#f97316' : '#00a651'
                    }}>
                      {ticket.risk_score}
                    </div>
                    <div className="h-1.5 w-16 bg-neutral-border rounded-full overflow-hidden hidden md:block">
                      <div className="h-full rounded-full transition-all duration-1000" style={{
                        width: `${ticket.risk_score}%`,
                        backgroundColor: ticket.risk_score > 70 ? '#e31e24' : ticket.risk_score > 30 ? '#f97316' : '#00a651'
                      }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-1">
                    {ticket.flags ? ticket.flags.split(',').slice(0, 2).map((f, i) => (
                      <span key={i} className="text-[10px] font-bold border border-neutral-border text-secondary/70 px-2 py-0.5 rounded uppercase tracking-wider">
                        {f.replace(/_/g, ' ')}
                      </span>
                    )) : <span className="text-xs text-secondary/40">None</span>}
                    {ticket.flags && ticket.flags.split(',').length > 2 && (
                      <span className="text-[10px] font-bold text-secondary/50">+{ticket.flags.split(',').length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={cn(
                    "text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap border uppercase",
                    ticket.status === 'False Positive' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                    ticket.status === 'Confirmed' ? 'bg-risk-high/10 text-risk-high border-risk-high/20' :
                    ticket.status === 'Mitigated' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                    ticket.status === 'Closed' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                    'bg-primary/10 text-primary border-primary/20'
                  )}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <Link 
                    href={`/admin/investigate/${ticket.ticket_id}`}
                    className="text-xs font-bold text-secondary hover:text-primary transition-colors bg-white border border-neutral-border px-4 py-2 rounded-xl shadow-sm inline-block"
                  >
                    Investigate
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
