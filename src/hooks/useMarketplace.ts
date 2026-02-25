// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useQuery } from '@tanstack/react-query'
import { fetchMarketplaceAgents, fetchMarketplaceTags } from '@/db/marketplace'
import type { MarketplaceQueryOptions } from '@/db/marketplace'
import type { Agent } from '@/types'

const STALE_TIME = 5 * 60 * 1000 // 5 minutes — marketplace data doesn't change often

/** Fetch marketplace agents with search, tag filter, and sort */
export function useMarketplaceAgents(options: MarketplaceQueryOptions) {
    const { data = [], isLoading, error, refetch } = useQuery<Agent[]>({
        queryKey: ['marketplace-agents', options.search, options.tags, options.sort],
        queryFn: () => fetchMarketplaceAgents(options),
        staleTime: STALE_TIME,
    })
    return { agents: data, isLoading, error, refetch }
}

/** Fetch all unique marketplace tags for the filter UI */
export function useMarketplaceTags() {
    const { data = [], isLoading } = useQuery<string[]>({
        queryKey: ['marketplace-tags'],
        queryFn: fetchMarketplaceTags,
        staleTime: STALE_TIME,
    })
    return { tags: data, isLoading }
}
