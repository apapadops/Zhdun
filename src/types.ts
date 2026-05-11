/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum StrategicDriver {
  AI_TRANSFORMATION = "AI transformation",
  CORPORATE_GOVERNANCE = "Corporate governance",
  OPERATING_MODEL = "Operating model improvement",
  CUSTOMER_GROWTH = "Customer growth",
  REGULATORY = "Regulatory compliance",
}

export enum ProjectStatus {
  PENDING = "pending",
  REVIEW = "review",
  DECIDED = "decided",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  NEEDS_INFO = "needs_info",
}

export enum ProjectDecision {
  GO = "go",
  HOLD = "hold",
  NOGO = "nogo",
}

export enum AIDecision {
  APPROVED = "approved",
  NEEDS_INFO = "needs_info",
  REJECTED = "rejected",
}

export enum TshirtSize {
  S = "S",
  M = "M",
  L = "L",
  XL = "XL",
}

export enum CaseType {
  PROJECT = "project",
  AI = "ai",
  HYBRID = "hybrid",
}

export interface UnifiedCase {
  // Identity and Status
  id: string;
  userId: string;
  created_at: string;
  updatedAt?: any; // Firestore server timestamp
  decided_at: string | null;
  status: ProjectStatus;
  decision: ProjectDecision | AIDecision | null;

  // Classification
  case_type: CaseType;
  tier: "T1" | "T2" | "T3";

  // Common Fields
  requestor_name: string;
  requestor_department: string;
  requestor_email?: string;
  project_title: string;
  problem_statement: string;
  expected_outcome: string;
  markets_affected: string;
  strategic_driver: string;
  deadline: string;
  flags: string[];
  assessment_notes: string;

  // Project / ROI Fields
  teams_involved?: string;
  duration?: string;
  tshirt?: TshirtSize;
  volume_per_month?: string;
  hours_per_case?: string;
  team_profile?: string;
  annual_fte_cost?: string;
  annual_hours?: string;
  fte_saving_est?: string;
  soft_benefits?: string;
  impl_cost?: string;
  payback_months?: string;

  // AI Governance Fields
  initiative_description?: string;
  additional_context?: string;
  expected_benefits?: string;
  ai_tool?: string;
  use_type?: string;
  users_scope?: string;
  data_types?: string;
  system_integrations?: string;
  human_in_loop?: string;
  regulated_process?: string;
  intended_purpose?: string;
  tier_score?: number;
  
  // AI model tracking
  ai_model_name?: string;
  ai_is_external_data?: boolean;
  ai_data_subjects?: string;

  // Admin Scoring (Semantic Names)
  score_problem: number;
  score_benefit: number;
  score_strategic: number;
  score_feasibility: number;
  score_urgency: number;
  score_data: number;

  // T3 Governance
  dpo_approved?: boolean;
  security_approved?: boolean;
  architecture_approved?: boolean;
  approved_date?: string;
  next_review_date?: string;
  registry_status?: 'pending' | 'active' | 'rejected';
  
  // Decision Details
  rejection_reason?: string;
  needs_info_details?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
