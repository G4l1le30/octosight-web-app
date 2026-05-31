"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Ticket } from "@/types/ticket";
import { cn, formatDateTime } from "@/lib/utils";
import { RISK } from "@/constants/colors";
import { toast } from "sonner";

const COLUMNS = [
  { id: "Submitted", label: "Submitted", color: "bg-blue-500" },
  { id: "In Review", label: "In Review", color: "bg-amber-500" },
  { id: "Confirmed", label: "Confirmed", color: "bg-red-500" },
  { id: "Mitigated", label: "Mitigated", color: "bg-cyan-500" },
  { id: "Closed", label: "Closed", color: "bg-slate-500" },
] as const;

export default function KanbanPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/tickets?per_page=100&sort_by=created_at&sort_dir=desc");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.items ?? []);
      setTickets(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const getColumnTickets = (status: string) =>
    tickets.filter((t) => t.status === status);

  const handleDragStart = (ticketId: string) => {
    setDraggedId(ticketId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const ticketId = draggedId;
    setDraggedId(null);
    if (!ticketId) return;

    const ticket = tickets.find((t) => t.ticket_id === ticketId);
    if (!ticket || ticket.status === newStatus) return;

    // Optimistic update
    setTickets((prev) =>
      prev.map((t) => (t.ticket_id === ticketId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/v1/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(`Moved to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
      fetchTickets(); // Revert
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center font-bold opacity-40">Loading Kanban...</div>
    );
  }

  return (
    <div className="bg-neutral-page min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Kanban Board</h1>
            <p className="text-secondary/60 text-sm">Drag tickets between status columns</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="text-sm font-bold text-primary hover:underline px-3 py-1.5 rounded-lg">
              Dashboard
            </Link>
            <Link href="/admin/triage" className="text-sm font-bold text-primary hover:underline px-3 py-1.5 rounded-lg">
              Triage
            </Link>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTickets = getColumnTickets(col.id);
            return (
              <div
                key={col.id}
                className="flex-shrink-0 w-72 md:w-80"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("w-3 h-3 rounded-full", col.color)} />
                  <h3 className="font-bold text-sm text-secondary">{col.label}</h3>
                  <span className="text-xs font-bold text-secondary/40 bg-neutral-page px-2 py-0.5 rounded-full">
                    {colTickets.length}
                  </span>
                </div>
                <div
                  className={cn(
                    "space-y-2 min-h-[200px] p-2 rounded-xl transition-colors",
                    "bg-white border-2 border-dashed border-neutral-border",
                    "hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  {colTickets.map((ticket) => (
                    <div
                      key={ticket.id ?? ticket.ticket_id}
                      draggable
                      onDragStart={() => handleDragStart(ticket.ticket_id)}
                      className={cn(
                        "bg-white rounded-xl border border-neutral-border p-3 cursor-grab active:cursor-grabbing",
                        "hover:shadow-md transition-all",
                        draggedId === ticket.ticket_id && "opacity-50 scale-95"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-secondary/60">{ticket.ticket_id}</span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            color: ticket.risk_score >= 75 ? RISK.high.hex : ticket.risk_score >= 35 ? RISK.medium.hex : RISK.low.hex,
                          }}
                        >
                          {ticket.risk_score}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-secondary line-clamp-2 mb-2">
                        {ticket.summary || ticket.url || ticket.type}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            ticket.priority === "High"
                              ? "text-risk-high border-risk-high/20 bg-risk-high/5"
                              : ticket.priority === "Medium"
                                ? "text-risk-medium border-risk-medium/20 bg-risk-medium/5"
                                : "text-risk-low border-risk-low/20 bg-risk-low/5"
                          )}
                        >
                          {ticket.priority}
                        </span>
                        <span className="text-[10px] text-secondary/40">{ticket.type}</span>
                      </div>
                    </div>
                  ))}
                  {colTickets.length === 0 && (
                    <div className="py-8 text-center text-xs text-secondary/30 font-medium">
                      No tickets
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
