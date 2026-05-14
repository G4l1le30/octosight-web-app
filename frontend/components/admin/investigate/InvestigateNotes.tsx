import React from "react";

interface InvestigateNotesProps {
  notes: string;
  setNotes: (notes: string) => void;
}

export const InvestigateNotes: React.FC<InvestigateNotesProps> = ({
  notes,
  setNotes,
}) => {
  return (
    <div className="card p-8 h-full flex flex-col">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-secondary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Investigation Notes
      </h3>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Record investigation findings, domain whois info, or escalation notes here..."
        className="flex-1 w-full p-4 text-sm bg-neutral-page border border-neutral-border rounded-xl focus:border-primary outline-none transition-all font-normal text-black leading-relaxed resize-none"
      ></textarea>
    </div>
  );
};
