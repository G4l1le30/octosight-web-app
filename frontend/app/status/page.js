"use client";
import { useState } from "react";

export default function StatusPage() {
  const [ticketId, setTicketId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ticketId) return;
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/tickets/${ticketId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Ticket not found. Please check your ID.");
        throw new Error("Failed to fetch ticket status.");
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black mb-4">Track Your Report</h1>
        <p className="text-secondary-light">Enter your Ticket ID to see the real-time analysis and mitigation status.</p>
      </div>

      <div className="card p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input 
            type="text" 
            placeholder="Enter Ticket ID (e.g., OCTO-9921)" 
            className="flex-1 p-4 border-2 border-neutral-border rounded-lg focus:border-primary outline-none transition-all font-mono text-sm uppercase"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value.toUpperCase())}
          />
          <button type="submit" disabled={loading} className="btn-primary px-8 flex items-center gap-2">
            {loading ? "Searching..." : "Track"}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-risk-high/10 text-risk-high p-4 rounded-lg mb-6 font-bold text-sm text-center">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="card overflow-hidden">
            <div className={`p-1 ${result.risk_score > 70 ? 'bg-risk-high' : result.risk_score > 30 ? 'bg-risk-medium' : 'bg-risk-low'}`}></div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-[10px] font-black uppercase text-secondary/40">Ticket ID</span>
                  <h2 className="text-2xl font-black">{result.ticket_id}</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-secondary/40">Current Status</span>
                  <p className="text-primary font-black uppercase text-sm">{result.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-secondary/40">Automated Risk Score</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className={`text-3xl font-black ${result.risk_score > 70 ? 'text-risk-high' : result.risk_score > 30 ? 'text-risk-medium' : 'text-risk-low'}`}>
                        {result.risk_score}/100
                      </span>
                      <div className="flex-1 h-2 bg-neutral-border rounded-full">
                        <div className="h-full rounded-full" style={{
                          width: `${result.risk_score}%`,
                          backgroundColor: result.risk_score > 70 ? '#e31e24' : result.risk_score > 30 ? '#f97316' : '#00a651'
                        }}></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-secondary/40">Incident Type</p>
                    <p className="font-bold">{result.type}</p>
                  </div>
                  {result.url && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-secondary/40">Target URL</p>
                      <p className="text-sm font-mono break-all opacity-70">{result.url}</p>
                    </div>
                  )}
                  {result.sender_numbers && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-secondary/40">Reported Sender</p>
                      <p className="text-sm font-bold truncate">{result.sender_numbers}</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-neutral-page p-6 rounded-xl border border-neutral-border">
                  <h3 className="text-sm font-black mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Analysis Detail
                  </h3>
                  <div className="space-y-4">
                    <ul className="text-xs space-y-3 font-bold opacity-60">
                      <li className="flex justify-between"><span>Typosquatting Rules:</span> <span>PROCESSED</span></li>
                      <li className="flex justify-between"><span>OCR Evidence Analysis:</span> <span>{result.extracted_text ? 'COMPLETE' : 'N/A'}</span></li>
                      <li className="flex justify-between"><span>Keyword Analysis:</span> <span>ACTIVE</span></li>
                      <li className="flex justify-between"><span>Malicious Attachment:</span> <span>{result.attachment_names ? 'DETECTED' : 'CLEAN'}</span></li>
                    </ul>
                    
                    {result.attachment_names && (
                      <div className="pt-4 border-t border-neutral-border/50">
                        <p className="text-[10px] font-black uppercase text-risk-high mb-2">Caution: Suspicious Files</p>
                        <div className="text-[9px] font-bold opacity-50 space-y-1">
                          {result.attachment_names.split(',').map((f, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="text-risk-high">⚠️</span> {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {result.screenshot_paths && (
                <div className="mb-8">
                  <p className="text-[10px] font-black uppercase text-secondary/40 mb-4">Evidence Screenshots</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.screenshot_paths.split(',').map((path, i) => (
                      <div key={i} className="bg-neutral-page border border-neutral-border rounded-xl overflow-hidden relative group">
                        <img 
                          src={`http://127.0.0.1:8000/uploads/${path}`} 
                          alt="Screenshot" 
                          className="w-full h-auto object-contain max-h-[500px] opacity-80 group-hover:opacity-100 transition-all"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                          <span className="text-[8px] font-black uppercase text-white bg-secondary/60 px-2 py-1 rounded">View Only</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] font-bold opacity-30 mt-2 italic text-center">* Downloads are disabled for security reasons</p>
                </div>
              )}

              <div className="pt-6 border-t border-neutral-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p className="text-xs font-bold opacity-40 italic">Submitted on {new Date(result.created_at).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <button className="text-xs font-black px-4 py-2 border border-neutral-border rounded-lg hover:bg-neutral-page transition-all">Report Accuracy Issue</button>
                  <button className="text-xs font-black px-4 py-2 bg-secondary text-white rounded-lg">Notify Support</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
