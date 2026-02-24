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
] as const
