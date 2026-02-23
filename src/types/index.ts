// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

/**
 * Core type definitions for CrewForm.
 *
 * Based on FUNCTIONAL_REQUIREMENTS.md data models.
 */

// ─── Agent ────────────────────────────────────────────────────────────────────

export interface Agent {
  id: string
  name: string
  description: string
  prompt: string
  model: string
  provider: string
  avatar_url: string | null
  tools: string[]
  temperature: number
  max_tokens: number
  visibility: AgentVisibility
  team_id: string | null
  organisation_id: string | null
  created_by: string
  created_at: string
  updated_at: string
  // Computed / joined
  task_count?: number
  last_active?: string
  status?: AgentStatus
}

export type AgentVisibility = 'private' | 'team' | 'organisation'
export type AgentStatus = 'idle' | 'busy' | 'offline'

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigned_agent_id: string | null
  team_id: string
  organisation_id: string
  created_by: string
  started_at: string | null
  completed_at: string | null
  result: Record<string, unknown> | null
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// ─── Agent Task (execution record) ───────────────────────────────────────────

export interface AgentTask {
  id: string
  agent_id: string
  task_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  session_key: string | null
  started_at: string | null
  completed_at: string | null
  result: Record<string, unknown> | null
  error_message: string | null
  tokens_used: number
  cost_estimate: number
  model_used: string
  created_at: string
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export type TeamMode = 'orchestrator' | 'pipeline' | 'collaboration'
export type TeamStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error'

export interface Team {
  id: string
  workspace_id: string
  name: string
  description?: string
  mode: TeamMode
  status: TeamStatus
  config: PipelineConfig | OrchestratorConfig | CollaborationConfig
  created_by?: string
  created_at: string
  updated_at: string
}

export interface PipelineConfig {
  steps: PipelineStep[]
  auto_handoff: boolean
}

export interface PipelineStep {
  agent_id: string
  step_name: string
  instructions: string
  expected_output: string
  on_failure: 'retry' | 'stop' | 'skip'
  max_retries: number
  reviewer_agent_id?: string
  type?: 'sequential' | 'fan_out'
  parallel_agents?: string[]
  merge_agent_id?: string
  fan_out_failure?: 'fail_fast' | 'continue_on_partial'
  merge_instructions?: string
}

export interface OrchestratorConfig {
  brain_agent_id: string
  quality_threshold: number
  routing_strategy: string
  planner_enabled: boolean
  max_delegation_depth: number
}

export interface CollaborationConfig {
  speaker_selection: string
  max_turns: number
  termination_condition: string
  consensus_phrase: string
  facilitator_agent_id?: string
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  timezone: string
  created_at: string
  updated_at: string
}

// ─── Workspace ────────────────────────────────────────────────────────────────

export interface Workspace {
  id: string
  name: string
  slug: string
  organisation_id: string
  timezone: string
  created_by: string
  created_at: string
  updated_at: string
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export type ProviderBillingModel = 'per-token' | 'subscription-quota' | 'unknown'

export type UserRole = 'owner' | 'admin' | 'manager' | 'operator' | 'viewer'
