// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { z } from 'zod'

/**
 * Zod schema for agent creation / editing.
 * Validates all fields before Supabase insert.
 */
export const agentSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name must be 100 characters or less')
        .trim(),
    description: z
        .string()
        .max(500, 'Description must be 500 characters or less')
        .default(''),
    model: z
        .string()
        .min(1, 'Model is required'),
    system_prompt: z
        .string()
        .max(10000, 'System prompt must be 10,000 characters or less')
        .default(''),
    temperature: z
        .number()
        .min(0, 'Temperature must be 0 or higher')
        .max(2, 'Temperature must be 2 or lower')
        .default(0.7),
    tools: z
        .array(z.string())
        .default([]),
})

export type AgentFormData = z.infer<typeof agentSchema>

/**
 * Validates agent form data and returns either parsed data or field errors.
 */
export function validateAgentForm(data: unknown): {
    success: boolean
    data?: AgentFormData
    errors?: Record<string, string>
} {
    const result = agentSchema.safeParse(data)

    if (result.success) {
        return { success: true, data: result.data }
    }

    const errors: Record<string, string> = {}
    for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string') {
            errors[field] = issue.message
        }
    }
    return { success: false, errors }
}

/** Available models grouped by provider */
export const MODEL_OPTIONS = [
    {
        provider: 'Anthropic',
        models: [
            { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
            { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
        ],
    },
    {
        provider: 'OpenAI',
        models: [
            { value: 'gpt-4o', label: 'GPT-4o' },
            { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        ],
    },
    {
        provider: 'Google',
        models: [
            { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
            { value: 'gemini-2.5-pro-preview-05-06', label: 'Gemini 2.5 Pro' },
        ],
    },
    {
        provider: 'OpenRouter',
        models: [] as { value: string; label: string }[], // Populated dynamically
    },
    {
        provider: 'Mistral',
        models: [
            { value: 'mistral-large-latest', label: 'Mistral Large' },
            { value: 'codestral-latest', label: 'Codestral' },
            { value: 'mistral-small-latest', label: 'Mistral Small' },
        ],
    },
    {
        provider: 'Groq',
        models: [
            { value: 'groq/llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
            { value: 'groq/llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
            { value: 'groq/mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
        ],
    },
    {
        provider: 'Cohere',
        models: [
            { value: 'command-r-plus', label: 'Command R+' },
            { value: 'command-r', label: 'Command R' },
        ],
    },
    {
        provider: 'Together',
        models: [
            { value: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', label: 'Llama 3.1 405B Turbo' },
            { value: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', label: 'Llama 3.1 70B Turbo' },
            { value: 'mistralai/Mixtral-8x22B-Instruct-v0.1', label: 'Mixtral 8x22B' },
            { value: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'Qwen 2.5 72B Turbo' },
        ],
    },
    {
        provider: 'NVIDIA',
        models: [
            { value: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Nemotron 70B' },
            { value: 'meta/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
        ],
    },
    {
        provider: 'Hugging Face',
        models: [
            { value: 'meta-llama/Llama-3.1-70B-Instruct', label: 'Llama 3.1 70B' },
            { value: 'mistralai/Mistral-7B-Instruct-v0.3', label: 'Mistral 7B v0.3' },
            { value: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B' },
        ],
    },
    {
        provider: 'Venice',
        models: [
            { value: 'llama-3.3-70b', label: 'Llama 3.3 70B' },
            { value: 'deepseek-r1-671b', label: 'DeepSeek R1 671B' },
        ],
    },
    {
        provider: 'MiniMax',
        models: [
            { value: 'MiniMax-Text-01', label: 'MiniMax Text 01' },
            { value: 'abab6.5s-chat', label: 'Abab 6.5s Chat' },
        ],
    },
    {
        provider: 'Moonshot',
        models: [
            { value: 'moonshot-v1-128k', label: 'Moonshot V1 128K' },
            { value: 'moonshot-v1-32k', label: 'Moonshot V1 32K' },
            { value: 'moonshot-v1-8k', label: 'Moonshot V1 8K' },
        ],
    },
]

export type ModelGroup = typeof MODEL_OPTIONS[number]

/**
 * Filter MODEL_OPTIONS to only include providers whose ID is in the active list.
 * Provider IDs are lowercase (e.g. 'anthropic', 'openai').
 */
export function getActiveModelOptions(activeProviderIds: string[]) {
    const activeSet = new Set(activeProviderIds.map((id) => id.toLowerCase()))
    return MODEL_OPTIONS.filter((group) => activeSet.has(group.provider.toLowerCase()))
}

/**
 * Merge dynamic models into the static model options.
 * Used for providers like OpenRouter whose model list is fetched live.
 */
export function mergeModelOptions(
    staticOptions: ModelGroup[],
    dynamicModels: { provider: string; models: { value: string; label: string }[] }[],
): ModelGroup[] {
    const dynamicMap = new Map(
        dynamicModels.map((d) => [d.provider.toLowerCase(), d.models]),
    )

    return staticOptions.map((group) => {
        const dynamic = dynamicMap.get(group.provider.toLowerCase())
        if (dynamic && dynamic.length > 0) {
            return { ...group, models: dynamic }
        }
        return group
    })
}

/**
 * Derive the provider from a model name.
 * Used at save time to ensure provider and model are always in sync.
 */
export function inferProviderFromModel(model: string): string {
    const m = model.toLowerCase()
    // Prefix checks first — must take priority over keyword matches
    if (m.startsWith('openrouter/')) return 'openrouter'
    if (m.startsWith('groq/')) return 'groq'
    // Keyword matches
    if (m.includes('claude')) return 'anthropic'
    if (m.includes('gpt') || m.includes('o1') || m.includes('o3')) return 'openai'
    if (m.includes('gemini')) return 'google'
    if (m.includes('mistral') || m.includes('codestral')) return 'mistral'
    if (m.includes('command-r')) return 'cohere'
    // New providers
    if (m.includes('togethercomputer') || m.includes('together/')) return 'together'
    if (m.includes('nvidia/') || m.includes('nim/') || m.includes('nemotron')) return 'nvidia'
    if (m.includes('minimax') || m.includes('abab')) return 'minimax'
    if (m.includes('moonshot')) return 'moonshot'
    if (m.includes('venice') || m.includes('deepseek-r1')) return 'venice'
    return 'unknown'
}
