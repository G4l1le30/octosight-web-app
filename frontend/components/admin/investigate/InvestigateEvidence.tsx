import React from "react";
import { Ticket } from "@/types/ticket";

interface InvestigateEvidenceProps {
  ticket: Ticket;
  onDownloadAttachment: (hashedPath: string) => void;
}

export const InvestigateEvidence: React.FC<InvestigateEvidenceProps> = ({ ticket, onDownloadAttachment }) => {
  return (
    <div className="card p-8 h-full">
      <h3 className="text-xl font-bold mb-6 text-secondary">
        Incident Evidence
      </h3>

      <div className="space-y-6">
        <div>
          <span className="text-base font-bold block mb-3 text-secondary">
            User Summary
          </span>
          <div className="bg-neutral-page/50 p-4 rounded-xl border border-neutral-border text-sm font-medium text-secondary/80 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
            &quot;{ticket.summary || "No summary provided."}&quot;
          </div>
        </div>

        {ticket.screenshot_paths && (
          <div>
            <span className="text-base font-bold block mb-4 text-secondary">
              Evidence Screenshots
            </span>
            <div className="grid grid-cols-1 gap-4">
              {ticket.screenshot_paths.split(",").map((path, i) => {
                const filename = path.split("/").pop() || path;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-risk-high/5 border border-risk-high/20 rounded-xl group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-risk-high/10 rounded-lg text-risk-high">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-secondary opacity-80 truncate max-w-[250px] sm:max-w-none">
                        {filename}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        window.open(`/uploads/${path}`, "_blank")
                      }
                      className="px-3 py-1.5 bg-risk-high text-white text-xs font-bold rounded-lg hover:bg-risk-high/90 transition-all"
                    >
                      {" "}
                      Open
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {ticket.extracted_text && (
          <div>
            <span className="text-base font-bold block mb-3 text-secondary">
              Extracted OCR Text
            </span>
            <div className="bg-neutral-page/50 p-4 rounded-xl border border-neutral-border text-sm font-medium text-secondary/80 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
              {ticket.extracted_text}
            </div>
          </div>
        )}

        {ticket.attachment_names && (
          <div>
            <span className="text-base font-bold block mb-4 text-secondary">
              Attachments
            </span>
            <div className="grid grid-cols-1 gap-4">
              {ticket.attachment_names.split(",").map((origName, i) => {
                const hashedPath =
                  ticket.attachment_paths?.split(",")[i] || origName;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 bg-risk-high/5 border border-risk-high/20 rounded-xl"
                  >
                    <div className="w-8 h-8 bg-risk-high/10 text-risk-high rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        ></path>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-secondary opacity-80">
                        {origName}
                      </p>
                      <p className="text-xs font-bold text-risk-high opacity-70">
                        Security Restricted
                      </p>
                    </div>
                    <button
                      onClick={() => onDownloadAttachment(hashedPath)}
                      className="px-3 py-1.5 bg-risk-high text-white text-xs font-bold rounded-lg hover:bg-risk-high/90 transition-all"
                    >
                      Download
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
