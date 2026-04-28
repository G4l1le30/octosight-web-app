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
  admin_notes: string | null;
  investigation_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportFormData {
  type: IncidentType;
  url: string;
  summary: string;
  senderNumbers: string;
}

export interface DashboardStats {
  total: number;
  avgScore: string;
  highRisk: number;
  typeDist: { name: string; value: number }[];
  trendData: { name: string; incidents: number }[];
  flagDist: { name: string; value: number }[];
}
