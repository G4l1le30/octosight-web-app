"use client";
import { useState } from "react";
import Link from "next/link";

export default function ReportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ticketData, setTicketData] = useState(null);

  const [formData, setFormData] = useState({
    type: "Website",
    url: "",
    summary: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/v1/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to submit report");

      const data = await response.json();
      setTicketData(data);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted && ticketData) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <div className="card p-12">
          <div className="w-20 h-20 bg-risk-low/10 text-risk-low rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black mb-4">Report Submitted</h1>
          <p className="text-secondary-light mb-2">
            Thank you for your report. Your Ticket ID is <span className="font-bold text-secondary">{ticketData.ticket_id}</span>.
          </p>
          <div className="bg-neutral-page p-4 rounded-lg mb-8 inline-block">
            <p className="text-xs font-black uppercase opacity-40 mb-1">Initial Risk Score</p>
            <p className={`text-2xl font-black ${ticketData.risk_score > 70 ? 'text-risk-high' : 'text-risk-medium'}`}>
              {ticketData.risk_score} / 100
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => setSubmitted(false)} className="btn-primary">Submit Another Report</button>
            <Link href="/status" className="text-sm font-bold text-primary hover:underline">Track Status</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black mb-4">Report Phishing Incident</h1>
        <p className="text-secondary-light">Help us protect the community by reporting suspicious activities.</p>
      </div>

      {error && (
        <div className="bg-risk-high/10 text-risk-high p-4 rounded-lg mb-6 font-bold text-sm text-center">
          Error: {error}. Is the backend running?
        </div>
      )}

      <div className="card p-8 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-black uppercase tracking-wider text-secondary/60">Incident Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Website', 'SMS', 'WhatsApp', 'Email'].map((type) => (
                <label key={type} className="relative flex items-center justify-center p-3 border-2 border-neutral-border rounded-lg cursor-pointer hover:border-primary/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                  <input 
                    type="radio" 
                    name="type" 
                    className="hidden" 
                    checked={formData.type === type}
                    onChange={() => setFormData({...formData, type})}
                  />
                  <span className="text-sm font-bold">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-black uppercase tracking-wider text-secondary/60">Suspicious URL / Link</label>
            <input 
              type="text" 
              id="url" 
              placeholder="https://clmbniaga.com/login" 
              className="w-full p-4 border-2 border-neutral-border rounded-lg focus:border-primary outline-none transition-all font-medium"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="summary" className="text-sm font-black uppercase tracking-wider text-secondary/60">Brief Summary</label>
            <textarea 
              id="summary" 
              rows="3" 
              placeholder="Received an SMS claiming my account was blocked and asking me to click this link..." 
              className="w-full p-4 border-2 border-neutral-border rounded-lg focus:border-primary outline-none transition-all font-medium"
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
            ></textarea>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : "Analyze & Submit Report"}
            </button>
            <p className="text-center text-xs opacity-50 mt-4 italic">
              By submitting, you agree to share this data for security analysis purposes.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
