import React from "react";
import { Ticket } from "@/types/ticket";

interface InvestigateEvidenceProps {
  ticket: Ticket;
  onDownloadAttachment: (hashedPath: string) => void;
}

export const InvestigateEvidence: React.FC<InvestigateEvidenceProps> = ({ ticket, onDownloadAttachment }) => {
  const screenshotPaths = ticket.screenshot_paths?.split(",").filter(Boolean) ?? [];
  const attachmentPaths = ticket.attachment_paths?.split(",").filter(Boolean) ?? [];

  const openEvidenceFile = async (path: string) => {
    if (!path) return;

    // Supabase paths contain "/" (e.g. "OCTO-xxx/screenshot_yyy.png").
    // Always request a signed URL from the backend for these.
    // Legacy local-only flat filenames (no "/") fall back to /uploads/.
    if (!path.includes("/")) {
      window.open(`/uploads/${path}`, "_blank");
      return;
    }

    try {
      const response = await fetch(
        `/api/v1/evidence/signed-url?filename=${encodeURIComponent(path)}`
      );
      if (!response.ok) {
        // Fallback: try serving from local uploads mount
        window.open(`/uploads/${path}`, "_blank");
        return;
      }
      const data = await response.json();
      window.open(data.preview_url, "_blank");
    } catch (error) {
      console.error("Failed to open evidence file:", error);
      window.open(`/uploads/${path}`, "_blank");
    }
  };

  return (
    <div className="card p-6 md:p-8 h-full">
      <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-secondary">
        Incident Evidence
      </h3>

      <div className="space-y-4 md:space-y-6">
        <div>
          <span className="text-xs md:text-sm font-bold block mb-2 md:mb-3 text-secondary">
            User Summary
          </span>
          <div className="bg-neutral-page/50 p-3 md:p-4 rounded-lg md:rounded-xl border border-neutral-border text-xs md:text-sm font-medium text-secondary/80 leading-relaxed max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar">
            &quot;{ticket.summary || "No summary provided."}&quot;
          </div>
        </div>

        {screenshotPaths.length > 0 && (
          <div>
            <span className="text-xs md:text-sm font-bold block mb-3 md:mb-4 text-secondary">
              Evidence Screenshots
            </span>
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {screenshotPaths.map((path, i) => {
                const filename = path.split("/").pop() || path;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 md:p-4 bg-neutral-page border border-neutral-border rounded-lg md:rounded-xl group transition-all"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-1 md:p-1.5 bg-neutral-border/30 rounded-md md:rounded-lg text-secondary/60">
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
                      <span className="text-xs font-semibold text-secondary truncate max-w-[250px] sm:max-w-none">
                        {filename}
                      </span>
                    </div>
                    <button
                      onClick={() => openEvidenceFile(path)}
                      className="px-2 md:px-3 py-1 md:py-1.5 bg-secondary text-white text-xs font-bold rounded-md md:rounded-lg hover:bg-secondary/90 transition-all"
                    >
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {ticket.extracted_text && (
          <div>
            <span className="text-xs md:text-sm font-bold block mb-2 md:mb-3 text-secondary">
              Extracted OCR Text
            </span>
            <div className="bg-neutral-page/50 p-3 md:p-4 rounded-lg md:rounded-xl border border-neutral-border text-xs md:text-sm font-medium text-secondary/80 leading-relaxed whitespace-pre-wrap max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar">
              {ticket.extracted_text}
            </div>
          </div>
        )}

        {attachmentPaths.length > 0 && (
          <div>
            <span className="text-xs md:text-sm font-bold block mb-3 md:mb-4 text-secondary">
              Attachments
            </span>
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {attachmentPaths.map((path, i) => {
                const filename = path.split("/").pop() || path;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-neutral-page border border-neutral-border rounded-lg md:rounded-xl"
                  >
                    <div className="w-6 md:w-8 h-6 md:h-8 bg-neutral-border/30 text-secondary/60 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 md:w-4 h-3 md:h-4"
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
                      <p className="text-xs md:text-sm font-bold truncate text-secondary">
                        {filename}
                      </p>
                      <p className="text-xs font-medium text-secondary/60 opacity-70">
                        Security Restricted
                      </p>
                    </div>
                    <button
                      onClick={() => onDownloadAttachment(path)}
                      className="px-2 md:px-3 py-1 md:py-1.5 bg-secondary text-white text-xs font-bold rounded-md md:rounded-lg hover:bg-secondary/90 transition-all"
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
