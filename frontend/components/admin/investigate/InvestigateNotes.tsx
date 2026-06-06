"use client";

import React, { useState } from "react";
import { Ticket } from "@/types/ticket";
import { Sparkles, Loader2, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

interface InvestigateNotesProps {
  ticket: Ticket;
  notes: string;
  setNotes: (notes: string) => void;
}

export const InvestigateNotes: React.FC<InvestigateNotesProps> = ({
  ticket,
  notes,
  setNotes,
}) => {
  const { can } = usePermissions();
  const [loadingAI, setLoadingAI] = useState(false);
  // Keep previous notes so admin can undo
  const [prevNotes, setPrevNotes] = useState<string | null>(null);

  const handleGenerateSuggestion = async () => {
    setLoadingAI(true);
    try {
      const res = await fetch(
        `/api/v1/tickets/${ticket.ticket_id}/generate-notes`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to generate suggestion");
      const data = await res.json();
      if (data.suggestion) {
        // Save current notes before overwriting
        setPrevNotes(notes);
        // Type the suggestion directly into the textarea
        setNotes(data.suggestion);
      }
    } catch {
      toast.error("Could not generate AI suggestion. Please try again.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleUndo = () => {
    if (prevNotes !== null) {
      setNotes(prevNotes);
      setPrevNotes(null);
    }
  };

  const handleKeep = () => {
    setPrevNotes(null);
  };

  const aiActive = prevNotes !== null;

  return (
    <div className="card p-6 md:p-8 h-full flex flex-col gap-3 md:gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg md:text-xl font-bold text-secondary">
          Investigation Notes
        </h3>

        {/* Gemini AI suggestion trigger */}
        {can("investigate.generate_notes") && (
          <button
            onClick={handleGenerateSuggestion}
            disabled={loadingAI}
            title="Generate AI suggestion for investigation notes"
            className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 text-xs font-bold rounded-md md:rounded-lg text-secondary/80 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loadingAI ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5 group-hover:text-primary" />
            )}
          </button>
        )}
      </div>

      {/* Notes textarea — suggestion lands here directly */}
      {can("investigate.update_notes") ? (
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            // If admin edits after AI fill, clear undo state
            if (aiActive) setPrevNotes(null);
          }}
          placeholder="Record investigation findings, domain whois info, or escalation notes here..."
          className={`flex-1 min-h-[150px] md:min-h-[200px] w-full p-3 md:p-4 text-sm bg-neutral-page border rounded-xl focus:border-primary outline-none transition-all font-normal text-black leading-relaxed resize-none ${aiActive ? "border-primary/50 ring-1 ring-primary/20" : "border-neutral-border"
            }`}
        />
      ) : (
        <div className="flex-1 min-h-[150px] md:min-h-[200px] w-full p-3 md:p-4 text-sm bg-neutral-page border border-neutral-border rounded-xl font-normal text-secondary/80 leading-relaxed whitespace-pre-wrap">
          {notes || "No investigation notes recorded yet."}
        </div>
      )}

      {/* Undo / Keep buttons — only visible after AI fills the textarea */}
      {aiActive && (
        <div className="flex items-center justify-end gap-1.5 md:gap-2 px-0.5 md:px-1">
          <div className="flex gap-1.5 md:gap-2">
            <button
              onClick={handleUndo}
              className="flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg text-xs font-bold text-secondary/80 hover:text-secondary border border-neutral-border hover:border-secondary/30 transition-all"
            >
              <RotateCcw className="size-3" />
              Undo
            </button>
            <button
              onClick={handleKeep}
              className="flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary/90 transition-all"
            >
              <Check className="size-3" />
              Keep
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
