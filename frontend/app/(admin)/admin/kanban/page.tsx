"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getRiskLevel, RISK } from "@/constants/colors";

interface KanbanTicket {
  id: string;
  ticket_id: string;
  type: string;
  summary: string;
  priority: string;
  risk_score: number;
  status: string;
  url: string;
}

const STATUS_COLUMNS = [
  "Submitted",
  "In Review",
  "Need More Info",
  "Confirmed",
  "False Positive",
  "Mitigated",
  "Closed",
];

function PriorityLabel({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    High: "bg-risk-high/10 text-risk-high border-risk-high/20",
    Medium: "bg-risk-medium/10 text-risk-medium border-risk-medium/20",
    Low: "bg-risk-low/10 text-risk-low border-risk-low/20",
  };
  return (
    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", colors[priority] || "bg-gray-100 text-gray-600")}>
      {priority}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    Website: "bg-blue-100 text-blue-700",
    SMS: "bg-green-100 text-green-700",
    WhatsApp: "bg-emerald-100 text-emerald-700",
    Email: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", colors[type] || "bg-gray-100 text-gray-600")}>
      {type}
    </span>
  );
}

function KanbanCard({ ticket }: { ticket: KanbanTicket }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.ticket_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const riskLevel = getRiskLevel(ticket.risk_score);
  const riskColor = RISK[riskLevel];
  const priorityColors: Record<string, string> = {
    High: "bg-risk-high",
    Medium: "bg-risk-medium",
    Low: "bg-risk-low",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-neutral-border shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing overflow-hidden"
      {...attributes}
      {...listeners}
    >
      {/* Priority color strip */}
      <div className={cn("h-1.5", priorityColors[ticket.priority] || "bg-gray-300")} />
      <div className="p-2.5 space-y-1.5">
        {/* Row: ticket_id + risk_score */}
        <div className="flex items-center justify-between">
          <Link
            href={`/admin/investigate/${ticket.ticket_id}`}
            className="text-xs font-bold text-primary hover:underline truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {ticket.ticket_id}
          </Link>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1"
            style={{ backgroundColor: riskColor.hex + "20", color: riskColor.hex }}
          >
            {ticket.risk_score?.toFixed(0) || "0"}
          </span>
        </div>
        {/* Summary */}
        <p className="text-[11px] text-secondary/70 line-clamp-2 leading-snug">
          {ticket.summary || "No summary"}
        </p>
        {/* Footer: type + priority */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <TypeBadge type={ticket.type || ""} />
          <PriorityLabel priority={ticket.priority} />
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  tickets,
}: {
  status: string;
  tickets: KanbanTicket[];
}) {
  const columnColors: Record<string, string> = {
    Submitted: "border-blue-400 bg-blue-50/30",
    "In Review": "border-amber-400 bg-amber-50/30",
    "Need More Info": "border-purple-400 bg-purple-50/30",
    Confirmed: "border-risk-high bg-red-50/30",
    "False Positive": "border-green-400 bg-green-50/30",
    Mitigated: "border-teal-400 bg-teal-50/30",
    Closed: "border-gray-400 bg-gray-50/30",
  };
  const headerBg: Record<string, string> = {
    Submitted: "bg-blue-500",
    "In Review": "bg-amber-500",
    "Need More Info": "bg-purple-500",
    Confirmed: "bg-risk-high",
    "False Positive": "bg-green-500",
    Mitigated: "bg-teal-500",
    Closed: "bg-gray-500",
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border-2 min-w-[250px] max-w-[280px] flex-shrink-0 bg-white/60",
        columnColors[status] || "border-gray-300",
      )}
    >
      {/* Trello-style column header */}
      <div className="px-3 py-2.5 flex items-center gap-2 border-b border-neutral-border/50">
        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", headerBg[status])} />
        <h3 className="text-sm font-bold text-secondary">{status}</h3>
        <span className="text-xs font-bold text-secondary/50 bg-gray-100 px-1.5 py-0.5 rounded-full ml-auto">
          {tickets.length}
        </span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[150px] max-h-[calc(100vh-200px)]">
        <SortableContext items={tickets.map((t) => t.ticket_id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <KanbanCard key={ticket.ticket_id} ticket={ticket} />
          ))}
        </SortableContext>
        {tickets.length === 0 && (
          <p className="text-xs text-secondary/40 text-center py-10 font-medium">currently No tickets</p>
        )}
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const [tickets, setTickets] = useState<KanbanTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/v1/tickets?per_page=200&sort_by=created_at&sort_dir=desc");
      const data = await res.json();
      const items = data.data || data || [];
      setTickets(
        items.map((t: any) => ({
          id: t.ticket_id || t.id,
          ticket_id: t.ticket_id || t.id,
          type: t.type,
          summary: t.summary,
          priority: t.priority,
          risk_score: t.risk_score || 0,
          status: t.status || "Submitted",
          url: t.url,
        })),
      );
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(() => fetchTickets(true), 15000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const grouped = STATUS_COLUMNS.map((status) => ({
    status,
    tickets: tickets.filter((t) => t.status === status),
  }));

  const activeTicket = activeId ? tickets.find((t) => t.ticket_id === activeId) : null;

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ticketId = String(active.id);
    const targetColumn = String(over.data.current?.sortable?.containerId || over.id);

    // Find the target status from column name
    const targetStatus = STATUS_COLUMNS.find(
      (s) => s === targetColumn || tickets.some((t) => t.ticket_id === targetColumn && t.status === s),
    );

    if (!targetStatus) return;

    // Optimistic update
    setTickets((prev) =>
      prev.map((t) => (t.ticket_id === ticketId ? { ...t, status: targetStatus } : t)),
    );

    try {
      const res = await fetch(`/api/v1/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Failed to update status");
        fetchTickets();
      } else {
        toast.success(`Moved ${ticketId} to ${targetStatus}`);
      }
    } catch {
      toast.error("Connection error");
      fetchTickets();
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-secondary">Kanban Board</h1>
        <p className="text-secondary/40 mt-2">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary">Kanban Board</h1>
          <p className="text-secondary font-medium opacity-80 text-sm">Drag and drop tickets to update status</p>
        </div>
        <span className="text-sm text-secondary/70">{tickets.length} tickets</span>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {grouped.map(({ status, tickets: colTickets }) => (
            <div key={status} className="flex-shrink-0">
              <KanbanColumn status={status} tickets={colTickets} />
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTicket && (
            <div className="bg-white rounded-lg border-2 border-primary/40 shadow-xl opacity-90 overflow-hidden w-[250px] rotate-3">
              <div className="h-1.5 bg-primary" />
              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">{activeTicket.ticket_id}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">{activeTicket.risk_score?.toFixed(0)}</span>
                </div>
                <p className="text-[11px] text-secondary/70 line-clamp-2">{activeTicket.summary}</p>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
