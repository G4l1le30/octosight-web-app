export interface ActivityItem {
  id: number;
  activity_type: string;
  description: string;
  actor_id: string | null;
  ticket_id: string | null;
  metadata_json: string | null;
  created_at: string;
}

export interface ActivityListResponse {
  items: ActivityItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
