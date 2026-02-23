// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

/**
 * Core type definitions for CrewForm.
 *
 * Matches the SQL schema in supabase/migrations/001_core_schema.sql exactly.
 */

// ─── Workspace ────────────────────────────────────────────────────────────────

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
  plan: WorkspacePlan
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type WorkspacePlan = 'free' | 'pro' | 'team' | 'enterprise'

// ─── Workspace Member ─────────────────────────────────────────────────────────

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  joined_at: string
}

export type WorkspaceRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer'

// ─── Agent ────────────────────────────────────────────────────────────────────

export interface Agent {
  id: string
  workspace_id: string
  name: string
  description: string
  avatar_url: string | null
  model: string
  system_prompt: string
  temperature: number
  tools: string[]
  voice_profile: VoiceProfile | null
  status: AgentStatus
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AgentStatus = 'idle' | 'busy' | 'offline'

export interface VoiceProfile {
  tone?: 'formal' | 'casual' | 'technical' | 'creative' | 'empathetic' | 'custom'
  custom_instructions?: string
  output_format_hints?: string
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export interface Team {
  id: string
  workspace_id: string
  name: string
  description: string
  mode: TeamMode
  config: PipelineConfig | OrchestratorConfig | CollaborationConfig
  created_at: string
  updated_at: string
}

export type TeamMode = 'pipeline' | 'orchestrator' | 'collaboration'

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

// ─── Team Member ──────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string
  team_id: string
  agent_id: string
  role: TeamMemberRole
  position: number
  config: Record<string, unknown>
}

export type TeamMemberRole = 'orchestrator' | 'worker' | 'reviewer'

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string
  workspace_id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigned_agent_id: string | null
  assigned_team_id: string | null
  result: Record<string, unknown> | null
  error: string | null
  metadata: Record<string, unknown>
  created_by: string
  created_at: string
  updated_at: string
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// ─── API Key ──────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string
  workspace_id: string
  provider: string
  encrypted_key: string
  key_hint: string
  is_valid: boolean
  created_at: string
  updated_at: string
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export type ProviderBillingModel = 'per-token' | 'subscription-quota' | 'unknown'

// ─── Database row types (for Supabase typed client) ──────────────────────────

export type WorkspaceRow = Workspace
export type WorkspaceMemberRow = WorkspaceMember
export type AgentRow = Agent
export type TeamRow = Team
export type TeamMemberRow = TeamMember
export type TaskRow = Task
export type ApiKeyRow = ApiKey
