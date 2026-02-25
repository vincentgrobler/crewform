// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { z } from 'zod'

/**
 * Zod schemas for team creation and pipeline configuration.
 */

export const pipelineStepSchema = z.object({
    agent_id: z.string().min(1, 'Select an agent for this step'),
    step_name: z.string().min(1, 'Step name is required').max(100),
    instructions: z.string().max(5000).default(''),
    expected_output: z.string().max(2000).default(''),
    on_failure: z.enum(['retry', 'stop', 'skip']).default('stop'),
    max_retries: z.number().int().min(0).max(5).default(1),
})

export const teamSchema = z.object({
    name: z
        .string()
        .min(1, 'Team name is required')
        .max(100, 'Team name must be 100 characters or less')
        .trim(),
    description: z
        .string()
        .max(1000, 'Description must be 1,000 characters or less')
        .default(''),
    mode: z.enum(['pipeline']).default('pipeline'), // Only pipeline for MVP
})

export type TeamFormData = z.infer<typeof teamSchema>
export type PipelineStepFormData = z.infer<typeof pipelineStepSchema>
