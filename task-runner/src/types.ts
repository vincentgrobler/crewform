export type TaskStatus = 'pending' | 'dispatched' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
    id: string;
    workspace_id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigned_agent_id: string | null;
    assigned_team_id: string | null;
    result: string | null;
    error: string | null;
    metadata: Record<string, unknown> | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface Agent {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    provider: 'Anthropic' | 'OpenAI' | 'Google' | 'Mistral' | 'Groq' | 'Cohere' | 'OpenRouter' | 'Ollama';
    model: string;
    system_prompt: string;
}

export interface ApiKey {
    id: string;
    workspace_id: string;
    provider: string;
    encrypted_key: string;
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costEstimateUSD: number;
}

// ─── Team Run Types ──────────────────────────────────────────────────────────

export type TeamRunStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface TeamRun {
    id: string;
    team_id: string;
    workspace_id: string;
    status: TeamRunStatus;
    input_task: string;
    output: string | null;
    current_step_idx: number | null;
    tokens_total: number;
    cost_estimate_usd: number;
    started_at: string | null;
    completed_at: string | null;
    error_message: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface PipelineStep {
    agent_id: string;
    step_name: string;
    instructions: string;
    expected_output: string;
    on_failure: 'retry' | 'stop' | 'skip';
    max_retries: number;
}

export interface PipelineConfig {
    steps: PipelineStep[];
    auto_handoff: boolean;
}

export interface TeamConfig {
    mode: 'pipeline' | 'orchestrator' | 'collaboration';
    config: PipelineConfig;
}

export interface TeamHandoffContext {
    input: string;
    previous_output: string | null;
    step_index: number;
    step_name: string;
    accumulated_outputs: string[];
}
