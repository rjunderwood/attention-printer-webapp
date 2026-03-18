export interface CampaignConfig {
  campaign: string;
  product: string;
  content_types: string[];
  regions: string[];
  platforms: string[];
  posts_per_day: number;
  rest_pattern: boolean[];
  content_low_threshold: number;
  daily_cycle: {
    enabled: boolean;
    notification_hour: number;
    notification_minute: number;
    confirmation_window_minutes: number;
  };
}

export interface PlanGroup {
  name: string;
  content_type: string | null;
  region?: string;
  count?: number;
}

export interface Plan {
  campaign: string;
  updated_at: string;
  groups: PlanGroup[];
}

export interface PlanResponse {
  campaign: string;
  plan: Plan;
  paused_creators: string[];
}

export interface PlanSetRequest {
  content_type: string | null;
  region?: string;
  count?: number;
  group?: string;
}

export interface PreviewAssignment {
  creator: string;
  group: string;
  content_type: string | null;
  region: string;
  action: "post" | "rest" | "paused";
}

export interface PlanPreview {
  campaign: string;
  date: string;
  total: number;
  posting: number;
  resting: number;
  paused: number;
  groups: Record<string, PreviewAssignment[]>;
  assignments: Record<string, Omit<PreviewAssignment, "creator">>;
}

export type CycleStatus =
  | "none"
  | "pending"
  | "confirmed"
  | "auto_confirmed"
  | "generating"
  | "complete"
  | "complete_with_failures"
  | "failed";

export interface PlanStatus {
  status: CycleStatus;
  message?: string;
  target_date?: string;
  notification_sent_at?: string;
  confirmed_at?: string | null;
  confirmed_by?: string | null;
  generation_started_at?: string | null;
  generation_completed_at?: string | null;
  creators_posting?: number;
  creators_resting?: number;
  creators_paused?: number;
}

export interface Creator {
  name: string;
  region: string;
  active: boolean;
}

export interface CreatorsResponse {
  campaign: string;
  creators: Creator[];
}

export interface ContentLevelEntry {
  creator: string;
  text_pack: string;
  text_type: string;
  remaining: number;
}

export interface ContentLevels {
  campaign: string;
  threshold: number;
  exhausted: ContentLevelEntry[];
  low: ContentLevelEntry[];
  total_issues: number;
}

export interface HistorySummary {
  total: number;
  posted: number;
  failed: number;
  resting: number;
  by_group: Record<string, { total: number; posted: number; failed: number }>;
}

export interface HistoryEntry {
  date: string;
  summary: HistorySummary;
  plan_snapshot: { groups: PlanGroup[] };
}

export interface HistoryResponse {
  campaign: string;
  history: HistoryEntry[];
}

export interface HistoryDetailAssignment {
  group: string;
  content_type: string | null;
  region: string;
  action: string;
  status: string;
  scheduled?: number;
  error?: string;
}

export interface HistoryDetail {
  date: string;
  campaign: string;
  plan_snapshot: { groups: PlanGroup[] };
  assignments: Record<string, HistoryDetailAssignment>;
  summary: HistorySummary;
}

export interface OrchestratorStatus {
  last_main_run: string;
  last_main_run_minutes_ago: number;
  last_deep_run: string;
  last_deep_run_minutes_ago: number;
  total_runs: number;
  last_errors: string[];
  creator_status: Record<
    string,
    {
      status: string;
      max_posts_possible: number;
      days_available: number;
      last_deep_check?: string;
    }
  >;
}
