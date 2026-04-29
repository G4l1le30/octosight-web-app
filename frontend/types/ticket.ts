export type IncidentType = "Website" | "SMS" | "WhatsApp" | "Email";

export type TicketStatus = "Submitted" | "In Review" | "Confirmed" | "False Positive" | "Mitigated" | "Closed";

export interface Ticket {
  id: number;
  ticket_id: string;
  type: IncidentType;
  url: string | null;
  summary: string | null;
  sender_numbers: string | null;
  risk_score: number;
  priority: "High" | "Medium" | "Low";
  status: TicketStatus;
  screenshot_paths: string | null;
  attachment_names: string | null;
  attachment_paths: string | null;
  extracted_text: string | null;
  flags: string | null;
  analysis_results: string | null;
  admin_notes: string | null;
  investigation_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ReportFormData =
  | { type: "Website"; url: string; summary: string; senderNumbers?: string; incidentDate: string }
  | { type: "SMS"; url?: string; summary: string; senderNumbers: string; incidentDate: string }
  | { type: "WhatsApp"; url?: string; summary: string; senderNumbers: string; incidentDate: string }
  | { type: "Email"; url?: string; summary: string; senderNumbers: string; incidentDate: string };

export interface DashboardStats {
  total: number;
  avgScore: string;
  highRisk: number;
  typeDist: { name: string; value: number }[];
  trendData: { name: string; incidents: number }[];
  flagDist: { name: string; value: number }[];
}
