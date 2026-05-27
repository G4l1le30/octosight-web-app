export type IncidentType = "Website" | "SMS" | "WhatsApp" | "Email" | "Transaction";

export type TicketStatus = "Submitted" | "In Review" | "Confirmed" | "False Positive" | "Mitigated" | "Closed";

import { EducationRecommendation } from "./education";

export interface Ticket {
  id: number;
  ticket_id: string;
  type: IncidentType;
  url: string | null;
  summary: string | null;
  sender_numbers: string | null;
  risk_score: number;
  rule_score: number;
  ml_score: number;
  priority: "High" | "Medium" | "Low";
  status: TicketStatus;
  screenshot_paths: string | null;
  attachment_paths: string | null;
  extracted_text: string | null;
  flags: string | null;
  analysis_results: string | null;
  education_recommendation: EducationRecommendation | null;
  admin_notes: string | null;
  investigation_notes: string | null;
  bank_name: string | null;
  bank_account: string | null;
  reference_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketAuditLog {
  id: number;
  ticket_id: string;
  admin_id: string | null;
  admin_name: string;
  action_taken: string;
  old_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
}


export type ReportFormData =
  | { type: "Website"; url: string; summary?: string; senderNumbers?: string; incidentDate: string; bankName?: string; bankAccount?: string; referenceNumber?: string }
  | { type: "SMS"; url?: string; summary?: string; senderNumbers: string; incidentDate: string; bankName?: string; bankAccount?: string; referenceNumber?: string }
  | { type: "WhatsApp"; url?: string; summary?: string; senderNumbers: string; incidentDate: string; bankName?: string; bankAccount?: string; referenceNumber?: string }
  | { type: "Email"; url?: string; summary?: string; senderNumbers: string; incidentDate: string; bankName?: string; bankAccount?: string; referenceNumber?: string }
  | { type: "Transaction"; url?: string; summary?: string; senderNumbers: string; incidentDate: string; bankName?: string; bankAccount?: string; referenceNumber?: string };

export interface DashboardStats {
  total: number;
  avgScore: string;
  highRisk: number;
  typeDist: { name: string; value: number }[];
  trendData: { name: string; incidents: number }[];
  flagDist: { name: string; value: number }[];
}
