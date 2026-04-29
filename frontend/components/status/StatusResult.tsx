import React from "react";
import { Ticket } from "@/types/ticket";

interface StatusResultProps {
  result: Ticket;
}

const StatusResult: React.FC<StatusResultProps> = ({ result }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="card overflow-hidden">
        <div
          className={`p-1 ${result.risk_score > 70 ? "bg-risk-high" : result.risk_score > 30 ? "bg-risk-medium" : "bg-risk-low"}`}
        ></div>
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-sm font-bold text-secondary">
                Ticket ID
              </span>
              <h2 className="text-2xl font-black">{result.ticket_id}</h2>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-secondary">
                Current Status
              </span>
              <div className="mt-1">
                <span
                  className={`px-3 py-1 rounded-lg text-sm font-bold border ${
                    result.status.toLowerCase() === "submitted"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : result.status.toLowerCase() === "in review"
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : result.status.toLowerCase() === "confirmed"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : result.status.toLowerCase() === "false positive"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : result.status.toLowerCase() === "mitigated"
                              ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                              : result.status.toLowerCase() === "closed"
                                ? "bg-gray-100 text-gray-700 border-gray-200"
                                : "bg-neutral-page text-secondary border-neutral-border"
                  }`}
                >
                  {result.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold text-secondary">
                  Automated Risk Score
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <span
                    className={`text-3xl font-black ${result.risk_score > 70 ? "text-risk-high" : result.risk_score > 30 ? "text-risk-medium" : "text-risk-low"}`}
                  >
                    {result.risk_score}/100
                  </span>
                  <div className="flex-1 h-2 bg-neutral-border rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${result.risk_score}%`,
                        backgroundColor:
                          result.risk_score > 70
                            ? "#e31e24"
                            : result.risk_score > 30
                              ? "#f97316"
                              : "#00a651",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-secondary">
                  Incident Type
                </p>
                <p className="text-base font-medium">{result.type}</p>
              </div>
              {result.url && (
                <div>
                  <p className="text-sm font-bold text-secondary">Target URL</p>
                  <p className="text-base font-medium break-all opacity-90">
                    {result.url}
                  </p>
                </div>
              )}
              {result.sender_numbers && (
                <div>
                  <p className="text-sm font-bold text-secondary">
                    Reported Sender
                  </p>
                  <p className="text-base font-medium truncate">
                    {result.sender_numbers}
                  </p>
                </div>
              )}
              {/* User Summary */}
              <div>
                <p className="text-sm font-bold text-secondary mb-2">
                  User Summary
                </p>
                <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar bg-neutral-page/50 p-3 rounded-xl border border-neutral-border/50">
                  <p className="text-xs font-medium text-secondary/80 leading-relaxed whitespace-pre-wrap">
                    &quot;{result.summary || "No summary provided."}&quot;
                  </p>
                </div>
              </div>

              {/* Extracted OCR Text */}
              {result.extracted_text && (
                <div>
                  <p className="text-sm font-bold text-secondary mb-2">
                    Extracted OCR Text
                  </p>
                  <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar bg-neutral-page/50 p-3 rounded-lg border border-neutral-border/50">
                    <p className="text-xs font-medium text-secondary/80 leading-relaxed whitespace-pre-wrap">
                      {result.extracted_text}
                    </p>
                  </div>
                </div>
              )}


            </div>

            <div className="space-y-6">
              <div className="bg-neutral-page p-6 rounded-xl border border-neutral-border shadow-sm">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Analysis Detail
                </h3>
                <div className="space-y-4">
                  {(() => {
                    let details = {
                      typosquatting: "Safe",
                      keywords: "Clean",
                      attachments: result.attachment_names
                        ? "Detected"
                        : "Clean",
                      ocr: result.extracted_text ? "Complete" : "N/A",
                    };

                    try {
                      if (result.analysis_results) {
                        details = {
                          ...details,
                          ...JSON.parse(result.analysis_results),
                        };
                      }
                    } catch (e) {
                      console.error("Failed to parse analysis results", e);
                    }

                    return (
                      <ul className="text-sm space-y-3 font-bold opacity-90">
                        <li className="flex justify-between">
                          <span>Typosquatting Rules:</span>
                          <span
                            className={
                              details.typosquatting !== "Safe" &&
                              details.typosquatting !== "Verified Domain"
                                ? "text-risk-high"
                                : "text-green-600"
                            }
                          >
                            {details.typosquatting}
                          </span>
                        </li>
                        <li className="flex justify-between">
                          <span>OCR Evidence Analysis:</span>
                          <span
                            className={
                              details.ocr === "Complete" ? "text-green-600" : ""
                            }
                          >
                            {details.ocr}
                          </span>
                        </li>
                        <li className="flex justify-between">
                          <span>Keyword Analysis:</span>
                          <span
                            className={
                              details.keywords !== "Clean"
                                ? "text-risk-high"
                                : "text-green-600"
                            }
                          >
                            {details.keywords}
                          </span>
                        </li>
                        <li className="flex justify-between">
                          <span>Malicious Attachment:</span>
                          <span
                            className={
                              details.attachments !== "Clean"
                                ? "text-risk-high"
                                : "text-green-600"
                            }
                          >
                            {details.attachments}
                          </span>
                        </li>
                      </ul>
                    );
                  })()}
                </div>
              </div>

              {result.investigation_notes && (
                <div className="bg-neutral-page p-6 rounded-xl border border-neutral-border shadow-sm">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Investigation Notes
                  </h3>
                  <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-sm font-medium text-secondary/70 leading-relaxed italic">
                      &quot;{result.investigation_notes}&quot;
                    </p>
                  </div>
                </div>
              )}

              {/* Evidence Screenshots */}
              {result.screenshot_paths && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                  <p className="text-sm font-bold text-secondary mb-3">
                    Evidence Screenshots
                  </p>
                  <div className="space-y-2">
                    {result.screenshot_paths.split(",").map((path, i) => {
                      const filename = path.split("/").pop() || path;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-xl group transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-white rounded-lg border border-primary/20 text-primary">
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
                            <span className="text-xs font-bold text-secondary truncate max-w-[150px] sm:max-w-[200px]">
                              {filename}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              window.open(`/uploads/${filename}`, "_blank")
                            }
                            className="text-xs font-bold text-primary hover:underline transition-colors px-2 py-1"
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
              {result.attachment_names && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                  <p className="text-sm font-bold text-secondary mb-3">
                    Attachments
                  </p>
                  <div className="space-y-2">
                    {result.attachment_names.split(",").map((f, i) => {
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-xl group transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-white rounded-lg border border-primary/20 text-primary">
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
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                <polyline points="13 2 13 9 20 9" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-secondary truncate max-w-[150px] sm:max-w-[200px]">
                              {f}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-sm font-normal opacity-90">
              Submitted on{" "}
              {new Date(result.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              •{" "}
              {new Date(result.created_at).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
            <div className="flex gap-2">
              <button className="text-sm font-bold px-4 py-2 border border-neutral-border rounded-lg hover:bg-neutral-page transition-all">
                Report Accuracy Issue
              </button>
              <button className="text-sm font-bold px-4 py-2 bg-secondary text-white rounded-lg">
                Notify Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusResult;
