export interface RuleConfig {
  id: number;
  config_type: string;
  key: string;
  value: string | null;
  group: string | null;
  score: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}
