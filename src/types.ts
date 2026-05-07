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

export enum AIGovernanceDecision {
  APPROVED = "approved",
  NEEDS_INFO = "needs-more-info",
  REJECTED = "rejected",
}

export interface AIGovernanceCase {
  id: string;
  created_at: string;
  decided_at: string | null;
  approved_date: string;
  next_review_date: string;
  status: ProjectStatus;
  decision: AIGovernanceDecision | null;
  registry_status: "pending" | "active" | "rejected";

  requestor_name: string;
  requestor_department: string;
  initiative_title: string;
  initiative_description: string;
  use_type: string;
  intended_purpose: string;
  users_scope: string;
  markets_affected: string;
  data_types: string;
  system_integrations: string;
  ai_tool: string;
  human_in_loop: string;
  regulated_process: string;
  bias_risk: string;
  strategic_driver: string;
  deadline: string;
  additional_context: string;
  tier: "T1" | "T2" | "T3";
  tier_score: number;
  flags: string[];

  dpo_approved: boolean;
  security_approved: boolean;
  architecture_approved: boolean;
  assessment_notes: string;
}

export interface TransformationCase {
  id: string;
  created_at: string;
  decided_at: string | null;
  status: ProjectStatus;
  decision: ProjectDecision | null;
  project_title: string;
  requestor_name: string;
  requestor_department: string;
  department?: string; // Backward compatibility
  teams_involved: string;
  markets_affected: string;
  duration: string;
  tier: string;
  tshirt: TshirtSize;
  problem_statement: string;
  expected_outcome: string;
  volume_per_month: string;
  hours_per_case: string;
  team_profile: string;
  annual_fte_cost: string;
  annual_hours: string;
  fte_saving_est: string;
  soft_benefits: string;
  strategic_driver: string;
  deadline: string;
  impl_cost: string;
  payback_months: string;
  flags: string[];
  score_problem: number;
  score_benefit: number;
  score_strategic: number;
  score_feasibility: number;
  score_urgency: number;
  score_data: number;
  assessment_notes: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
