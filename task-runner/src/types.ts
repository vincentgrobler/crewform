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
