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
}

export enum ProjectDecision {
  GO = "go",
  HOLD = "hold",
  NOGO = "nogo",
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
  decided_at: string | null;
  status: ProjectStatus;
  decision: ProjectDecision | null;

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
  ai_tool?: string;
  use_type?: string;
  users_scope?: string;
  data_types?: string;
  system_integrations?: string;
  human_in_loop?: string;
  regulated_process?: string;
  intended_purpose?: string;
  tier_score?: number;

  // Admin Scoring (Unified)
  score_1: number;
  score_2: number;
  score_3: number;
  score_4: number;
  score_5: number;
  score_6: number;

  // T3 Governance
  dpo_approved?: boolean;
  security_approved?: boolean;
  architecture_approved?: boolean;
  approved_date?: string;
  next_review_date?: string;
  registry_status?: 'pending' | 'active' | 'rejected';
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
