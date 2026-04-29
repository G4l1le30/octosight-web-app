"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket } from "@/types/ticket";
import { StatusModal } from "@/components/ui/StatusModal";

export default function InvestigatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ticketId } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  // Download Modal State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    title: "",
    message: "",
  });

  const router = useRouter();

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/tickets/${ticketId}`);
      if (!res.ok) throw new Error("Ticket not found");
      const data = await res.json();
      setTicket(data);
      setNotes(data.investigation_notes || "");
      setStatus(data.status);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const openDownloadModal = (filename: string) => {
    setSelectedFile(filename);
    setShowDownloadModal(true);
    setDownloadPassword("");
    setDownloadError("");
  };

  const handleConfirmDownload = async () => {
    if (downloadPassword === "confirm") {
      try {
        const res = await fetch(`/api/v1/admin/download/${selectedFile}`);

        if (!res.ok) {
          setDownloadError("Download failed. Server returned an error.");
          return;
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = selectedFile;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);

        setShowDownloadModal(false);
        setDownloadPassword("");
      } catch (err) {
        console.error("Download Error:", err);
        setDownloadError("Connection error. Check if backend is running.");
      }
    } else {
      setDownloadError("Type 'confirm' to proceed with download.");
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status,
          investigation_notes: notes,
        }),
      });

      if (res.ok) {
        setModalConfig({
          isOpen: true,
          type: "success",
          title: "Update Successful",
          message: `Ticket ${ticketId} has been updated successfully.`,
        });
      } else {
        setModalConfig({
          isOpen: true,
          type: "error",
          title: "Update Failed",
          message: "Could not update the ticket. Please try again later.",
        });
      }
    } catch (err) {
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Connection Error",
        message: "An error occurred while connecting to the server.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center font-normal opacity-70">
        Loading investigation data...
      </div>
    );
  if (!ticket)
    return (
      <div className="p-20 text-center font-bold text-risk-high text-xl">
        Ticket # {ticketId} Not Found
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/triage"
            className="p-2 hover:bg-neutral-border rounded-full transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <h1 className="text-3xl font-black text-secondary">
            Investigate {ticket.ticket_id}
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="btn-primary px-8 py-2 text-sm font-bold"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Main Grid Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ROW 1: Target Indicator & Internal Notes */}
        <div className="lg:col-span-2">
          <div className="card p-8 h-full flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-secondary">
                  Target Indicator
                </h3>
                <p className="text-xl font-medium text-primary break-all">
                  {ticket.url || "N/A"}
                </p>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-bold text-secondary">Risk Score</h3>
                <p
                  className={`text-4xl font-black ${ticket.risk_score >= 80 ? "text-risk-high" : ticket.risk_score >= 50 ? "text-risk-medium" : "text-risk-low"}`}
                >
                  {ticket.risk_score.toFixed(0)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 py-8 border-y border-neutral-border">
              {/* Left Column: Metadata */}
              <div className="space-y-8">
                <div className="space-y-1">
                  <span className="text-sm font-bold block text-secondary">
                    Type
                  </span>
                  <span className="text-base font-medium text-secondary">
                    {ticket.type}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-sm font-bold block text-secondary">
                    Submitted
                  </span>
                  <span className="text-base font-medium text-secondary">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>

                {ticket.sender_numbers && (
                  <div className="space-y-1">
                    <span className="text-sm font-bold block text-secondary">
                      Sender Info
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ticket.sender_numbers.split(",").map((num, i) => (
                        <span
                          key={i}
                          className="bg-neutral-page border border-neutral-border px-3 py-1 rounded-lg font-medium text-sm text-secondary"
                        >
                          {num.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Status & Priority */}
              <div className="space-y-8">
                <div className="space-y-1">
                  <span className="text-sm font-bold block text-secondary">
                    Priority
                  </span>
                  <span
                    className={`inline-block font-bold text-base ${
                      ticket.priority === "High"
                        ? "text-risk-high"
                        : "text-risk-medium"
                    }`}
                  >
                    {ticket.priority}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-sm font-bold block text-secondary">
                    Status
                  </span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="text-base font-medium bg-neutral-page border border-neutral-border rounded px-4 py-2 outline-none focus:border-primary text-secondary transition-all appearance-none pr-10 cursor-pointer w-full md:w-auto"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1rem",
                    }}
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="In Review">In Review</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="False Positive">False Positive</option>
                    <option value="Mitigated">Mitigated</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <h3 className="text-lg font-bold mb-4 text-secondary">
                Detection Engine Flags
              </h3>
              <div className="flex flex-wrap gap-2">
                {ticket.flags ? (
                  ticket.flags.split(",").map((flag, idx) => (
                    <span
                      key={idx}
                      className="bg-secondary text-white text-xs font-bold px-3 py-1.5 rounded-full"
                    >
                      {flag.replace(/_/g, " ")}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-normal opacity-60 text-secondary">
                    No specific rule flags triggered.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-8 h-full flex flex-col">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-secondary">
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
        </div>

        {/* ROW 2: Incident Evidence & Mitigation Actions */}
        <div className="lg:col-span-2">
          <div className="card p-8 h-full">
            <h3 className="text-lg font-bold mb-6 text-secondary">
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
                              window.open(`/api/v1/uploads/${path}`, "_blank")
                            }
                            className="px-3 py-1.5 bg-risk-high text-white text-xs font-bold rounded-lg hover:bg-risk-high/90 transition-all"
                          >
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
                            onClick={() => openDownloadModal(hashedPath)}
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
        </div>

        <div className="lg:col-span-1">
          <div className="card p-8 bg-white border border-neutral-border shadow-sm h-full">
            <h3 className="text-lg font-bold text-secondary mb-6">
              Mitigation Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full py-3 bg-neutral-page hover:bg-primary/5 text-sm font-bold text-secondary rounded-xl transition-all text-left px-5 flex items-center justify-between group border border-neutral-border">
                Add to Internal Blacklist
                <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
                  →
                </span>
              </button>
              <button className="w-full py-3 bg-neutral-page hover:bg-primary/5 text-sm font-bold text-secondary rounded-xl transition-all text-left px-5 flex items-center justify-between group border border-neutral-border">
                Generate Warning Template
                <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
                  →
                </span>
              </button>
              <button className="w-full py-3 bg-neutral-page hover:bg-risk-medium/5 text-sm font-bold text-secondary rounded-xl transition-all text-left px-5 flex items-center justify-between group border border-neutral-border">
                Escalate to SOC Team
                <span className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Download Validation Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-secondary/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-200 border border-neutral-border">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-risk-high/10 text-risk-high rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-secondary">
                Secure Download
              </h3>
              <p className="text-secondary/60 text-sm mt-2 font-normal leading-relaxed">
                You are about to download potentially malicious content. Please
                type <span className="font-bold text-secondary">confirm</span>{" "}
                to proceed.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary opacity-80">
                  Confirmation
                </label>
                <input
                  type="text"
                  className={`w-full p-3 bg-neutral-page border rounded-xl outline-none transition-all font-normal text-sm ${downloadError ? "border-risk-high focus:border-risk-high" : "border-neutral-border focus:border-primary"}`}
                  placeholder="Type 'confirm'..."
                  value={downloadPassword}
                  onChange={(e) => setDownloadPassword(e.target.value)}
                  autoFocus
                />
                {downloadError && (
                  <p className="text-xs font-bold text-risk-high mt-1">
                    {downloadError}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleConfirmDownload}
                  className="w-full py-3 bg-risk-high text-white rounded-xl font-bold text-xs hover:bg-risk-high/90 transition-all shadow-lg shadow-risk-high/20"
                >
                  Confirm Download
                </button>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="w-full py-2 font-bold text-xs text-secondary/40 hover:text-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Dialog Modal */}
      <StatusModal
        {...modalConfig}
        onClose={() => {
          setModalConfig({ ...modalConfig, isOpen: false });
          if (modalConfig.type === "success") {
            router.push("/admin/triage");
          }
        }}
      />
    </div>
  );
}
