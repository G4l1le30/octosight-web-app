"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getRiskLevel, RISK } from "@/constants/colors";
import { usePermissions } from "@/hooks/usePermissions";

interface KanbanTicket {
  id: string;
  ticket_id: string;
  type: string;
  summary: string;
  priority: string;
  risk_score: number;
  status: string;
  url: string;
  created_at?: string;
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

const PRIORITY_WEIGHT: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

function sortByPriority(tickets: KanbanTicket[]) {
  return [...tickets].sort((a, b) => {
    const priorityDiff =
      (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    const riskDiff = (b.risk_score || 0) - (a.risk_score || 0);
    if (riskDiff !== 0) return riskDiff;
    return (
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime()
    );
  });
}

function PriorityLabel({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    High: "bg-risk-high/10 text-risk-high border-risk-high/20",
    Medium: "bg-risk-medium/10 text-risk-medium border-risk-medium/20",
    Low: "bg-risk-low/10 text-risk-low border-risk-low/20",
  };
  return (
    <span
      className={cn(
        "text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full border",
        colors[priority] || "bg-gray-100 text-secondary border-gray-200",
      )}
    >
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
    <span
      className={cn(
        "text-xs font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full",
        colors[type] || "bg-gray-100 text-secondary",
      )}
    >
      {type}
    </span>
  );
}

function KanbanCard({ ticket, canDrag }: { ticket: KanbanTicket; canDrag: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ticket.ticket_id,
    disabled: !canDrag,
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
      className={cn("bg-white rounded-lg md:rounded-xl border border-neutral-border shadow-sm hover:shadow-md transition-all overflow-hidden", canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default")}
      {...attributes}
      {...listeners}
    >
      <div
        className={cn(
          "h-1 md:h-1.5",
          priorityColors[ticket.priority] || "bg-gray-300",
        )}
      />
      <div className="p-2 md:p-3 space-y-1.5 md:space-y-2">
        <div className="flex items-start justify-between gap-2 md:gap-3">
          <Link
            href={`/admin/investigate/${ticket.ticket_id}`}
            className="text-xs font-bold text-secondary hover:text-primary hover:underline truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {ticket.ticket_id}
          </Link>
          <span
            className="text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shrink-0"
            style={{
              backgroundColor: riskColor.hex + "20",
              color: riskColor.hex,
            }}
          >
            {ticket.risk_score?.toFixed(0) || "0"}
          </span>
        </div>
        <p className="text-xs md:text-sm text-secondary/80 line-clamp-2 leading-normal">
          {ticket.summary || "No summary"}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 pt-0.5 md:pt-1">
          <TypeBadge type={ticket.type || ""} />
          <PriorityLabel priority={ticket.priority} />
          <span className="text-xs font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-neutral-page text-secondary border border-neutral-border">
            {ticket.status}
          </span>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  tickets,
  canDrag,
}: {
  status: string;
  tickets: KanbanTicket[];
  canDrag: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: status });
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
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg md:rounded-xl border border-neutral-border min-w-[250px] max-w-[280px] flex-shrink-0 bg-white",
        columnColors[status] ? "" : "border-gray-300",
      )}
    >
      <div className="px-2 md:px-3 py-2 md:py-2.5 flex items-center gap-1.5 md:gap-2 border-b border-neutral-border/50 bg-neutral-page/60">
        <div
          className={cn("w-2 md:w-2.5 h-2 md:h-2.5 rounded-full shrink-0", headerBg[status])}
        />
        <h3 className="text-xs md:text-sm font-bold text-secondary">{status}</h3>
        <span className="text-xs font-bold text-secondary/60 bg-gray-100 px-1 md:px-1.5 py-0.5 rounded-full ml-auto">
          {tickets.length}
        </span>
      </div>
      <div className="flex-1 p-2 md:p-3 space-y-2 md:space-y-3 overflow-y-auto min-h-[150px] max-h-[calc(100vh-200px)]">
        <SortableContext
          id={status}
          items={tickets.map((t) => t.ticket_id)}
          strategy={verticalListSortingStrategy}
        >
          {tickets.map((ticket) => (
            <KanbanCard key={ticket.ticket_id} ticket={ticket} canDrag={canDrag} />
          ))}
        </SortableContext>
        {tickets.length === 0 && (
          <p className="text-xs text-secondary/60 text-center py-8 md:py-10 font-medium">
            No tickets
          </p>
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  tickets?: KanbanTicket[];
  compact?: boolean;
}

export default function KanbanBoard({
  tickets: initialTickets,
  compact,
}: KanbanBoardProps) {
  const { can } = usePermissions();
  const [tickets, setTickets] = useState<KanbanTicket[]>(initialTickets || []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialTickets);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch(
        "/api/v1/tickets?per_page=200&sort_by=created_at&sort_dir=desc",
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to fetch tickets: ${res.status}`);
      }
      const data = await res.json();
      const items = data.items || data.data || [];
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
          created_at: t.created_at,
        })),
      );
    } catch (err) {
      setTickets([]);
      setError(err instanceof Error ? err.message : "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialTickets) {
      setTickets(initialTickets);
      setLoading(false);
      return;
    }
    fetchTickets();
  }, [fetchTickets, initialTickets]);

  const grouped = STATUS_COLUMNS.map((status) => ({
    status,
    tickets: sortByPriority(tickets.filter((t) => t.status === status)).slice(
      0,
      compact ? 4 : status === "Closed" ? 10 : undefined,
    ),
  }));

  const activeTicket = activeId
    ? tickets.find((t) => t.ticket_id === activeId)
    : null;

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ticketId = String(active.id);
    const targetColumn = String(
      over.data.current?.sortable?.containerId || over.id,
    );

    const targetStatus = STATUS_COLUMNS.find(
      (s) =>
        s === targetColumn ||
        tickets.some((t) => t.ticket_id === targetColumn && t.status === s),
    );

    if (!targetStatus) return;

    setTickets((prev) =>
      prev.map((t) =>
        t.ticket_id === ticketId ? { ...t, status: targetStatus } : t,
      ),
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
        fetchTickets(true);
      } else {
        toast.success(`Moved ${ticketId} to ${targetStatus}`);
      }
    } catch {
      toast.error("Connection error");
      fetchTickets(true);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event: DragStartEvent) =>
        setActiveId(String(event.active.id))
      }
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          "flex gap-3 md:gap-4 overflow-x-auto pb-3 md:pb-4",
          compact && "max-h-[420px]",
        )}
      >
        {loading && (
          <div className="text-xs md:text-sm font-semibold text-secondary/60 p-3 md:p-4">
            Loading tickets...
          </div>
        )}
        {!loading && error && (
          <div className="text-xs md:text-sm font-semibold text-risk-high p-3 md:p-4">
            {error}
          </div>
        )}
        {!loading && !error && grouped.map(({ status, tickets: colTickets }) => (
          <div key={status} className="flex-shrink-0">
            <KanbanColumn status={status} tickets={colTickets} canDrag={can("investigate.update_status")} />
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeTicket && (() => {
          const riskLvl = getRiskLevel(activeTicket.risk_score);
          const riskClr = RISK[riskLvl];
          const barColors: Record<string, string> = {
            High: "bg-risk-high",
            Medium: "bg-risk-medium",
            Low: "bg-risk-low",
          };
          return (
            <div className="bg-white rounded-md md:rounded-lg border-2 border-neutral-border shadow-xl opacity-90 overflow-hidden w-[250px] rotate-3">
              <div className={cn("h-1 md:h-1.5", barColors[activeTicket.priority] || "bg-gray-300")} />
              <div className="p-2 md:p-3 space-y-1 md:space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-secondary">
                    {activeTicket.ticket_id}
                  </span>
                  <span
                    className="text-xs font-bold px-1 md:px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: riskClr.hex + "20", color: riskClr.hex }}
                  >
                    {activeTicket.risk_score?.toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-secondary/80 line-clamp-2">
                  {activeTicket.summary}
                </p>
              </div>
            </div>
          );
        })()}
      </DragOverlay>
    </DndContext>
  );
}
