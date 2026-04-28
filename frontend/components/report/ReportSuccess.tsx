import React from "react";
import Link from "next/link";
import { Ticket } from "@/types/ticket";

interface ReportSuccessProps {
  ticketData: Ticket;
  onReset: () => void;
}

const ReportSuccess: React.FC<ReportSuccessProps> = ({ ticketData, onReset }) => {
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
          <button onClick={onReset} className="btn-primary">Submit Another Report</button>
          <Link href="/status" className="text-sm font-bold text-primary hover:underline">Track Status</Link>
        </div>
      </div>
    </div>
  );
};

export default ReportSuccess;
