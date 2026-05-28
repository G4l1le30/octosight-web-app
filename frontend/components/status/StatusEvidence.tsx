import React from "react";
import { Ticket } from "@/types/ticket";

interface StatusEvidenceProps {
  result: Ticket;
}

export const StatusEvidence: React.FC<StatusEvidenceProps> = ({ result }) => {
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

  const screenshotPaths = result.screenshot_paths?.split(",").filter(Boolean) ?? [];
  const attachmentPaths = result.attachment_paths?.split(",").filter(Boolean) ?? [];

  return (
    <div className="space-y-6">
      {/* Evidence Screenshots */}
      {screenshotPaths.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
          <p className="text-sm font-bold text-secondary tracking-wide mb-3">
            Evidence Screenshots
          </p>
          <div className="space-y-3">
            {screenshotPaths.map((path, i) => {
              const filename = path.split("/").pop() || path;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-neutral-page/50 border border-neutral-border/50 rounded-xl group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-neutral-border text-secondary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-secondary truncate max-w-[150px] sm:max-w-[200px]">
                      {filename}
                    </span>
                  </div>
                  <button
                    onClick={() => openEvidenceFile(path)}
                    className="text-xs font-bold text-secondary underline hover:text-secondary/80 transition-colors px-2 py-1"
                  >
                    Open
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attachments */}
      {attachmentPaths.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
          <p className="text-sm font-bold text-secondary tracking-wide mb-3">
            Attachments
          </p>
          <div className="space-y-3">
            {attachmentPaths.map((path, i) => {
              const filename = path.split("/").pop() || path;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-neutral-page/50 border border-neutral-border/50 rounded-xl group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-neutral-border text-secondary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                        <polyline points="13 2 13 9 20 9" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-secondary truncate max-w-[150px] sm:max-w-[200px]">
                      {filename}
                    </span>
                  </div>
                  <button
                    onClick={() => openEvidenceFile(path)}
                    className="text-xs font-bold text-secondary underline hover:text-secondary/80 transition-colors px-2 py-1"
                  >
                    Open
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
