"use client";

export const dynamic = "force-dynamic";

import KanbanBoard from "@/components/admin/KanbanBoard";

export default function KanbanPage() {
  return (
    <div className="flex-1 flex flex-col px-3 md:px-4 py-6 md:py-8">
      <div className="card px-6 md:px-8 py-4 md:py-5 flex flex-col flex-1">
        <div className="mb-3 md:mb-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-secondary">Kanban Board</h1>
            <p className="text-xs md:text-sm text-secondary/80 font-medium">Drag and drop tickets to update status</p>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <KanbanBoard />
        </div>
      </div>
    </div>
  );
}
