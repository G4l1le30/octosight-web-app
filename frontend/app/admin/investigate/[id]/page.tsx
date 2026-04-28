"use client";

import { useState, useEffect, use, useCallback, useMemo } from "react";
import Link from "next/link";
import { Ticket } from "@/types/ticket";

export default function InvestigatePage({ params }: { params: Promise<{ id: string }> }) {
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

  const ADMIN_AUTH = useMemo(() => btoa("admin:admin1234"), []);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/tickets/${ticketId}`, {
        headers: { "Authorization": `Basic ${ADMIN_AUTH}` }
      });
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
  }, [ticketId, ADMIN_AUTH]);

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
    if (downloadPassword === "admin1234") {
      try {
        const res = await fetch(`/api/v1/admin/download/${selectedFile}`, {
          headers: { "Authorization": `Basic ${ADMIN_AUTH}` }
        });
        
        if (!res.ok) {
          setDownloadError("Download failed. Server returned an error.");
          return;
        }
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
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
      setDownloadError("Incorrect authorization password.");
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Basic ${ADMIN_AUTH}`
        },
        body: JSON.stringify({
          status: status,
          investigation_notes: notes
        }),
      });
      if (res.ok) alert("Ticket updated successfully!");
    } catch (err) {
      alert("Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold opacity-40">Loading investigation data...</div>;
  if (!ticket) return <div className="p-20 text-center font-bold text-risk-high text-xl">Ticket # {ticketId} Not Found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/triage" className="p-2 hover:bg-neutral-border rounded-full transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-3xl font-black">Investigate {ticket.ticket_id}</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={handleUpdate} disabled={saving} className="btn-primary px-8">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Analysis & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <div className="card p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase opacity-40">Target Indicator</span>
                <p className="text-xl font-mono text-primary font-bold break-all">{ticket.url}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase opacity-40">Risk Score</span>
                <p className={`text-4xl font-black ${ticket.risk_score > 70 ? 'text-risk-high' : 'text-risk-medium'}`}>{ticket.risk_score}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-neutral-border">
              <div>
                <span className="text-[10px] font-black uppercase opacity-40 block mb-1">Type</span>
                <span className="font-bold">{ticket.type}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase opacity-40 block mb-1">Priority</span>
                <span className={`font-black text-xs px-2 py-0.5 rounded ${
                  ticket.priority === 'High' ? 'bg-risk-high/10 text-risk-high' : 'bg-risk-medium/10 text-risk-medium'
                }`}>{ticket.priority}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase opacity-40 block mb-1">Submitted</span>
                <span className="font-bold text-xs">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase opacity-40 block mb-1">Status</span>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="text-xs font-black bg-neutral-page border border-neutral-border rounded p-1 outline-none"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="In Review">In Review</option>
                  <option value="Confirmed">Confirmed (Phish)</option>
                  <option value="False Positive">False Positive</option>
                  <option value="Mitigated">Mitigated</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-black text-sm mb-4">Detection Engine Flags</h3>
              <div className="flex flex-wrap gap-2">
                {ticket.flags?.split(',').map((flag, idx) => (
                  <span key={idx} className="bg-secondary text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {flag.replace(/_/g, ' ')}
                  </span>
                ))}
                {!ticket.flags && <span className="text-xs italic opacity-40">No specific rule flags triggered.</span>}
              </div>
            </div>
          </div>

          {/* Evidence/Summary Section */}
          <div className="card p-8">
            <h3 className="font-black text-sm mb-4">Incident Evidence</h3>
            
            <div className="space-y-6">
              {ticket.sender_numbers && (
                <div>
                  <span className="text-[10px] font-black uppercase opacity-40 block mb-2">Sender Info</span>
                  <div className="flex flex-wrap gap-2">
                    {ticket.sender_numbers.split(',').map((num, i) => (
                      <span key={i} className="bg-neutral-page border border-neutral-border px-3 py-1 rounded-md font-bold text-xs">{num.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] font-black uppercase opacity-40 block mb-2">User Summary</span>
                <div className="bg-neutral-page p-4 rounded-xl border border-neutral-border text-sm italic opacity-70">
                  &quot;{ticket.summary || "No summary provided."}&quot;
                </div>
              </div>

              {ticket.screenshot_paths && (
                <div>
                  <span className="text-[10px] font-black uppercase opacity-40 block mb-2">Evidence Screenshots</span>
                  <div className="grid grid-cols-1 gap-6">
                    {ticket.screenshot_paths.split(',').map((path, i) => (
                      <div key={i} className="group relative rounded-xl overflow-hidden border border-neutral-border bg-black/5 flex justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={`http://127.0.0.1:8000/uploads/${path}`} 
                          alt="Evidence" 
                          className="max-w-full h-auto object-contain max-h-[600px] shadow-2xl transition-all"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-start justify-end p-4 gap-2">
                          <a 
                            href={`http://127.0.0.1:8000/uploads/${path}`} 
                            target="_blank" 
                            className="p-3 bg-white text-secondary rounded-xl font-black text-xs uppercase hover:bg-primary hover:text-white transition-all shadow-2xl"
                          >
                            View Original
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ticket.extracted_text && (
                <div>
                  <span className="text-[10px] font-black uppercase opacity-40 block mb-2">Extracted OCR Text</span>
                  <div className="bg-secondary/5 p-4 rounded-xl border border-dashed border-secondary/20 text-xs font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {ticket.extracted_text}
                  </div>
                </div>
              )}

              {ticket.attachment_names && (
                <div>
                  <span className="text-[10px] font-black uppercase opacity-40 block mb-2">Suspicious Attachments (Download Restricted)</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ticket.attachment_names.split(',').map((origName, i) => {
                      const hashedPath = ticket.attachment_paths?.split(',')[i] || origName;
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 bg-risk-high/5 border border-risk-high/20 rounded-lg">
                          <svg className="w-5 h-5 text-risk-high" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate text-risk-high">{origName}</p>
                            <p className="text-[10px] uppercase font-black opacity-40">Malicious Content - Proceed with Caution</p>
                          </div>
                          <button 
                            onClick={() => openDownloadModal(hashedPath)}
                            className="px-3 py-1 bg-risk-high text-white text-[10px] font-black rounded hover:bg-risk-high/80 transition-all uppercase"
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

        {/* Download Validation Modal */}
        {showDownloadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-secondary/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-risk-high/10 text-risk-high rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-secondary">Security Warning</h3>
                <p className="text-secondary-light text-sm mt-2">
                  Are you sure you want to download this?
                </p>
                <p className="text-[10px] font-bold text-risk-high uppercase mt-1 tracking-wider">Warning: Potential Phishing Payload</p>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-neutral-page rounded-lg border border-neutral-border flex items-center gap-3">
                  <svg className="w-4 h-4 text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <span className="text-xs font-bold truncate opacity-60">{selectedFile}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-40">Admin Authorization Password</label>
                  <input 
                    type="password" 
                    className={`w-full p-3 bg-neutral-page border rounded-lg outline-none transition-all font-bold text-sm ${downloadError ? 'border-risk-high focus:border-risk-high' : 'border-neutral-border focus:border-primary'}`}
                    placeholder="Enter admin password to confirm"
                    value={downloadPassword}
                    onChange={(e) => setDownloadPassword(e.target.value)}
                    autoFocus
                  />
                  {downloadError && <p className="text-[10px] font-bold text-risk-high">{downloadError}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowDownloadModal(false)}
                    className="flex-1 px-4 py-3 border-2 border-neutral-border rounded-xl font-black text-xs uppercase hover:bg-neutral-page transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmDownload}
                    className="flex-1 px-4 py-3 bg-risk-high text-white rounded-xl font-black text-xs uppercase hover:bg-risk-high/90 transition-all shadow-lg shadow-risk-high/20"
                  >
                    Yes, Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Investigation Tools */}
        <div className="space-y-8">
          <div className="card p-6">
            <h3 className="font-black text-sm mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Internal Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record investigation findings, domain whois info, or escalation notes here..."
              className="w-full h-64 p-4 text-sm bg-neutral-page border border-neutral-border rounded-xl focus:border-primary outline-none transition-all"
            ></textarea>
          </div>

          <div className="card p-6 bg-secondary text-white border-none shadow-lg">
            <h3 className="font-black text-sm mb-4 uppercase tracking-widest text-primary-light">Mitigation Actions</h3>
            <div className="space-y-3">
              <button className="w-full py-2 bg-white/10 hover:bg-primary text-xs font-black rounded-lg transition-all text-left px-4 flex items-center justify-between group">
                Add to Internal Blacklist
                <span className="opacity-0 group-hover:opacity-100 transition-all">→</span>
              </button>
              <button className="w-full py-2 bg-white/10 hover:bg-primary text-xs font-black rounded-lg transition-all text-left px-4 flex items-center justify-between group">
                Generate Warning Template
                <span className="opacity-0 group-hover:opacity-100 transition-all">→</span>
              </button>
              <button className="w-full py-2 bg-white/10 hover:bg-risk-medium text-xs font-black rounded-lg transition-all text-left px-4 flex items-center justify-between group">
                Escalate to SOC Team
                <span className="opacity-0 group-hover:opacity-100 transition-all">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
