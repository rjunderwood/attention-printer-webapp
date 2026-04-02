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
  plan_group?: string;
  plan_action?: "post" | "rest" | "skip";
}

export interface CreatorsResponse {
  campaign: string;
  creators: Creator[];
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

// Templates

export type TemplateCategory = "faceless_slideshow" | "ugc_slideshow" | "ugc_video";
export type TemplateStatus = "pending" | "active";
export type SlideImageType = "generated_prompt" | "ugc_creator" | "fixed";

export interface TemplateListItem {
  name: string;
  category: TemplateCategory;
  status: TemplateStatus;
  slide_count?: number;
  reaction_duration?: number;
  clip?: string;
}

export interface TemplatesResponse {
  campaign: string;
  templates: TemplateListItem[];
}

export interface SlideImage {
  type: SlideImageType;
  prompt?: string;
  has_reference_image: boolean;
  has_fixed_image: boolean;
  reference_image_url: string | null;
  fixed_image_url: string | null;
}

export interface SlideText {
  position: string;
  text: string;
}

export interface Slide {
  slide_number: number;
  image: SlideImage;
  text: SlideText;
}

export interface ClipRequirementStatus {
  filename: string;
  present: boolean;
}

export interface ClipRequirements {
  type: string;
  required_languages?: string[];
  required_creators?: string[];
  status?: ClipRequirementStatus[];
}

export interface TemplateClip {
  filename: string;
  url: string;
}

export interface VideoConfig {
  status?: string;
  reaction_duration?: number;
  clip?: string;
  text?: {
    position?: string;
    duration?: number | string;
  };
}

export interface TemplateValidation {
  ready: boolean;
  missing: string[];
}

export interface TemplateDetail {
  campaign: string;
  name: string;
  category: TemplateCategory;
  status: TemplateStatus;
  caption?: string;
  writing_guide?: string;
  validation: TemplateValidation;
  // Slideshow fields
  slides?: Slide[];
  // UGC video fields
  config?: VideoConfig;
  text?: string;
  has_thumbnail?: boolean;
  thumbnail_url?: string;
  clips?: TemplateClip[];
  clip_requirements?: ClipRequirements;
}

// Plans New (template-based plan system)

export type PlanScope = "active" | "warmup";

export interface PlanNewContentItem {
  content_category: string;
  content_type: string;
}

export interface PlanNewGroup {
  name: string;
  content?: PlanNewContentItem[];
  rest?: boolean;
  region?: string;
  creator_type?: string;
  creators?: string[];
  count?: number;
}

export interface PlanNewTemplate {
  id: string;
  name: string;
  cycle_days: number;
  auto_rest?: boolean;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  days?: Record<string, { groups: PlanNewGroup[] }>;
}

export interface PlanNewConfirmation {
  target_date?: string;
  status: "pending" | "confirmed" | "auto_confirmed" | "generating" | "complete" | "complete_with_failures" | "failed";
  adjusted?: boolean;
  confirmed_at?: string | null;
  confirmed_by?: string | null;
}

export interface PlanNewWarmupCohortSummary {
  id: string;
  creators: string[];
  current_day: number;
  status: "in_progress" | "completed";
  started_at?: string;
}

export interface PlanNewShowResponse {
  campaign: string;
  scope: PlanScope;
  active: boolean;
  template_name?: string;
  template_id?: string;
  cycle_day?: number;
  cycle_days?: number;
  cycle_count?: number;
  auto_rest?: boolean;
  activated_at?: string;
  last_completed_date?: string;
  current_day_groups?: PlanNewGroup[];
  confirmation?: PlanNewConfirmation;
  // Warmup-specific
  active_cohorts?: PlanNewWarmupCohortSummary[];
  completed_cohorts?: PlanNewWarmupCohortSummary[];
}

export interface PlanNewPreviewAssignment {
  group: string;
  content?: PlanNewContentItem[];
  region?: string;
  types?: string[];
  action: "post" | "rest";
}

export interface PlanNewPreviewResponse {
  campaign: string;
  scope: PlanScope;
  date: string;
  template_id?: string;
  cycle_day?: number;
  cycle_count?: number;
  total: number;
  posting: number;
  resting: number;
  unassigned: number;
  assignments: Record<string, PlanNewPreviewAssignment>;
}

export interface PlanNewShortfall {
  creator: string;
  content_category: string;
  content_type: string;
  available: number;
  needed: number;
}

export interface PlanNewQueueCheckResponse {
  campaign: string;
  scope: PlanScope;
  date: string;
  shortfalls: PlanNewShortfall[];
  total_shortfalls: number;
}

export interface PlanNewTemplateValidation {
  campaign: string;
  template_id: string;
  valid: boolean;
  errors: string[];
}

export interface PlanNewCohort {
  id: string;
  creators: string[];
  current_day?: number;
  status: "in_progress" | "completed";
  started_at?: string;
  completed_at?: string | null;
}

export interface PlanNewCohortsResponse {
  campaign: string;
  template_id?: string;
  template_name?: string;
  cycle_days?: number;
  cohorts: PlanNewCohort[];
}

export interface PlanNewHistorySummary {
  total: number;
  posted: number;
  failed: number;
  resting: number;
  by_group: Record<string, { total: number; posted: number; failed: number }>;
}

export interface PlanNewHistoryEntry {
  date: string;
  template_id?: string;
  cycle_day?: number;
  cycle_count?: number;
  adjusted: boolean;
  summary: PlanNewHistorySummary;
}

export interface PlanNewHistoryDetail {
  date: string;
  campaign: string;
  template_id?: string;
  cycle_day?: number;
  cycle_count?: number;
  adjusted: boolean;
  plan_snapshot?: { groups: PlanNewGroup[] };
  assignments: Record<string, {
    group: string;
    content: PlanNewContentItem[];
    region?: string;
    action: string;
    status?: string;
    scheduled?: number;
  }>;
  summary: PlanNewHistorySummary;
}

export interface PlanNewHistoryResponse {
  campaign: string;
  scope: PlanScope;
  history: PlanNewHistoryEntry[] | PlanNewHistoryDetail;
}

export interface PlanNewAdjustment {
  date: string;
  template_id?: string;
  cycle_day?: number;
  cycle_count?: number;
  adjusted_at: string;
}

export interface PlanNewTemplateHistoryEntry {
  id: string;
  template_id: string;
  template_name: string;
  cycle_days: number;
  scope: PlanScope;
  activated_at: string;
  first_generation_at?: string;
  ended_at?: string | null;
  status: string;
  generation_count: number;
  cycles_completed: number;
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
