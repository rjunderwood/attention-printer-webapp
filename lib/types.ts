export interface CampaignConfig {
  campaign: string;
  product: string;
  content_types: string[];
  regions: string[];
  platforms: string[];
  creator_types: string[];
  posts_per_day: number;
  rest_pattern: boolean[];
  content_low_threshold: number;
  daily_cycle: {
    enabled: boolean;
    notification_hour: number;
    notification_minute: number;
    confirmation_window_minutes: number;
  };
  warmup?: {
    account_warmup_days: number;
    posting_warmup_target_posts: number;
  };
}

export interface PlanGroup {
  name: string;
  content_types: string[];
  region?: string;
  type?: string;
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
  content_types: string[];
  region?: string;
  type?: string;
  count?: number;
  group?: string;
}

export interface PreviewAssignment {
  creator: string;
  group: string;
  content_types: string[];
  region: string;
  type: string;
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

export type CreatorStatus =
  | "active"
  | "posting_warmup"
  | "paused"
  | "account_warmup"
  | "pending"
  | "archived";

export interface CreatorWarmup {
  account_warmup: {
    started_at: string | null;
    completed_at: string | null;
  };
  posting_warmup: {
    started_at: string | null;
    completed_at: string | null;
    target_posts: number;
    posts_completed: number;
  };
}

export interface Creator {
  name: string;
  region: string;
  type: string;
  status: CreatorStatus;
  inactive_reason?: string;
  warmup_device?: number;
  warmup?: CreatorWarmup;
  profile_picture_url: string;
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
  content_types: string[];
  region: string;
  type: string;
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

export interface Failure {
  post_bridge_id: string;
  platform: string;
  creator: string;
  media_id: string;
  error: string;
  error_category: string;
  scheduled_at: string;
  detected_at: string;
  status: string;
}

export interface FailuresResponse {
  campaign: string;
  failures: Failure[];
  count: number;
}

export interface WarmupProgress {
  creator: string;
  campaign: string;
  status: CreatorStatus;
  warmup_device?: number;
  account_warmup: {
    started_at: string | null;
    completed_at: string | null;
  };
  posting_warmup: {
    started_at: string | null;
    completed_at: string | null;
    target_posts: number;
    posts_completed: number;
    posts: string[];
  };
}

export interface WarmupPostResponse {
  message: string;
  promoted: boolean;
  progress: Omit<WarmupProgress, "creator" | "campaign">;
}

export interface WarmupPostPlatform {
  platform: string;
  account_id: string;
  scheduled_at: string;
  posted: boolean;
  failed: boolean;
  error: string | null;
}

export interface WarmupPost {
  creator: string;
  device_id: string;
  media_id: number;
  media_format: string;
  region: string;
  folder: string;
  all_posted: boolean;
  platforms: WarmupPostPlatform[];
}

export interface WarmupPostingResponse {
  date: string;
  posts: WarmupPost[];
}

export interface MarkPostedRequest {
  creator: string;
  date?: string;
  folder?: string;
  platform?: string;
}

export interface MarkPostedResult {
  creator: string;
  media_id: number;
  folder: string;
  platforms_marked: string[];
  all_posted: boolean;
  promoted: boolean;
}

export interface MarkPostedResponse {
  message: string;
  results: MarkPostedResult[];
  progress: Omit<WarmupProgress, "creator" | "campaign">;
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
