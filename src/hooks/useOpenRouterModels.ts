// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useQuery } from '@tanstack/react-query'

interface OpenRouterModel {
    id: string
    name: string
    context_length?: number
    pricing?: {
        prompt: string
        completion: string
    }
}

interface ModelOption {
    value: string
    label: string
}

/**
 * Fetch live model list from OpenRouter's public models API.
 * Models are prefixed with 'openrouter/' to match our internal naming convention.
 *
 * Note: The /api/v1/models endpoint is public and doesn't require auth,
 * but we only enable the query when the user has an active OpenRouter key.
 */
export function useOpenRouterModels(enabled: boolean) {
    const {
        data: models,
        isLoading,
        error,
    } = useQuery<ModelOption[]>({
        queryKey: ['openrouter-models'],
        queryFn: async () => {
            const res = await fetch('https://openrouter.ai/api/v1/models')
            if (!res.ok) {
                throw new Error(`OpenRouter models API returned ${res.status}`)
            }
            const json = (await res.json()) as { data: OpenRouterModel[] }

            return json.data
                .filter((m) => !m.id.includes(':free')) // Exclude free-tier variants
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((m) => ({
                    value: `openrouter/${m.id}`,
                    label: m.name,
                }))
        },
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    })

    return { models: models ?? [], isLoading, error }
}
