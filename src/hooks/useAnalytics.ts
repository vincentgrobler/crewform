// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useQuery } from '@tanstack/react-query'
import {
    fetchCompletionOverTime,
    fetchCostByAgent,
    fetchStatusDistribution,
    fetchTopModels,
} from '@/db/analytics'
import type { DailyCompletion, AgentCost, StatusCount, ModelUsage } from '@/db/analytics'

const STALE_TIME = 60 * 1000 // 60 seconds

/** Task completion over time (area chart data) */
export function useCompletionOverTime(workspaceId: string | null, startDate: string, endDate: string) {
    const { data = [], isLoading, error } = useQuery<DailyCompletion[]>({
        queryKey: ['analytics-completion', workspaceId, startDate, endDate],
        queryFn: () => fetchCompletionOverTime(workspaceId ?? '', startDate, endDate),
        enabled: !!workspaceId,
        staleTime: STALE_TIME,
        refetchOnWindowFocus: true,
    })
    return { data, isLoading, error }
}

/** Cost by agent (bar chart data) */
export function useCostByAgent(workspaceId: string | null, startDate: string, endDate: string) {
    const { data = [], isLoading, error } = useQuery<AgentCost[]>({
        queryKey: ['analytics-cost-agent', workspaceId, startDate, endDate],
        queryFn: () => fetchCostByAgent(workspaceId ?? '', startDate, endDate),
        enabled: !!workspaceId,
        staleTime: STALE_TIME,
        refetchOnWindowFocus: true,
    })
    return { data, isLoading, error }
}

/** Status distribution (donut chart data) */
export function useStatusDistribution(workspaceId: string | null, startDate: string, endDate: string) {
    const { data = [], isLoading, error } = useQuery<StatusCount[]>({
        queryKey: ['analytics-status', workspaceId, startDate, endDate],
        queryFn: () => fetchStatusDistribution(workspaceId ?? '', startDate, endDate),
        enabled: !!workspaceId,
        staleTime: STALE_TIME,
        refetchOnWindowFocus: true,
    })
    return { data, isLoading, error }
}

/** Top models by usage (bar chart data) */
export function useTopModels(workspaceId: string | null, startDate: string, endDate: string) {
    const { data = [], isLoading, error } = useQuery<ModelUsage[]>({
        queryKey: ['analytics-models', workspaceId, startDate, endDate],
        queryFn: () => fetchTopModels(workspaceId ?? '', startDate, endDate),
        enabled: !!workspaceId,
        staleTime: STALE_TIME,
        refetchOnWindowFocus: true,
    })
    return { data, isLoading, error }
}
