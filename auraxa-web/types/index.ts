// ─── User & Auth ──────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  subscription_tier: "free" | "premium" | "pro";
  subscription_expires_at: string | null;
  analyses_used_month: number;
  advisor_msgs_used_month: number;
  created_at: string;
}

// ─── Analysis ─────────────────────────────────────────────────
export type AnalysisStatus = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  step?: string;
  progress?: number;
  error?: string;
};

export type AttachmentStyle = "secure" | "anxious" | "avoidant" | "disorganized";
export type ToxicityLevel = "low" | "medium" | "high" | "critical";
export type GhostingRisk = "low" | "medium" | "high";

export interface EmotionalScores {
  overall_score: number;         // 0-100
  compatibility_score: number;   // 0-100
  communication_balance: number; // 0-100 (50 = equal)
  toxicity_level: ToxicityLevel;
  attachment_style: AttachmentStyle;
  ghosting_risk: GhostingRisk;
  patterns_detected: string[];
  ai_narrative: string;
  speaker_a_percentage: number;
  speaker_b_percentage: number;
}

export interface TimelinePoint {
  timestamp: string;
  emotional_intensity: number;
  sentiment: "positive" | "neutral" | "negative";
  speaker: "a" | "b";
}

export interface AnalysisResult {
  id: string;
  user_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  input_type: "screenshot" | "text_export" | "json_export" | "paste";
  intent: "conversation" | "pattern" | "style";
  speakers: { a: string; b: string };
  scores: EmotionalScores;
  timeline: TimelinePoint[];
  message_count: number;
  date_range: { start: string; end: string };
  created_at: string;
}

// ─── Advisor ──────────────────────────────────────────────────
export interface AdvisorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface AdvisorSession {
  id: string;
  analysis_id: string;
  messages: AdvisorMessage[];
}

// ─── Reports ──────────────────────────────────────────────────
export interface Report {
  id: string;
  analysis_id: string;
  user_id: string;
  share_token: string;
  is_public: boolean;
  view_count: number;
  card_url: string | null;
  created_at: string;
  analysis: AnalysisResult;
}

// ─── Subscription ─────────────────────────────────────────────
export interface SubscriptionPlan {
  id: string;
  name: string;
  price_inr: number;
  price_usd: number;
  analyses_per_month: number;
  advisor_messages_per_month: number;
  features: string[];
}

// ─── Upload ───────────────────────────────────────────────────
export type SupportedFileType = "image/jpeg" | "image/png" | "image/heic" | "text/plain" | "application/json";

export interface UploadedFile {
  file: File;
  preview?: string;
  status: "idle" | "uploading" | "done" | "error";
  error?: string;
}

// ─── UI State ─────────────────────────────────────────────────
export type AnalysisIntent = "conversation" | "pattern" | "style";

export interface AnalyzeState {
  files: UploadedFile[];
  intent: AnalysisIntent;
  isProcessing: boolean;
  analysisId: string | null;
  status: AnalysisStatus | null;
}
// Alias — dashboard uses Analysis, other files use AnalysisResult
export type Analysis = AnalysisResult;