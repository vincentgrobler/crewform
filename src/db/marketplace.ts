// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { supabase } from '@/lib/supabase'
import type { Agent } from '@/types'

export type MarketplaceSortOption = 'installs' | 'rating' | 'newest'

export interface MarketplaceQueryOptions {
    search?: string
    tags?: string[]
    sort?: MarketplaceSortOption
}

/** Fetch published marketplace agents with optional filtering and sorting */
export async function fetchMarketplaceAgents(
    options: MarketplaceQueryOptions = {},
): Promise<Agent[]> {
    let query = supabase
        .from('agents')
        .select('*')
        .eq('is_published', true)

    // Search by name or description
    if (options.search?.trim()) {
        const term = `%${options.search.trim()}%`
        query = query.or(`name.ilike.${term},description.ilike.${term}`)
    }

    // Filter by tags (agents must contain ALL selected tags)
    if (options.tags && options.tags.length > 0) {
        query = query.contains('marketplace_tags', options.tags)
    }

    // Sort
    switch (options.sort) {
        case 'rating':
            query = query.order('rating_avg', { ascending: false })
            break
        case 'newest':
            query = query.order('created_at', { ascending: false })
            break
        case 'installs':
        default:
            query = query.order('install_count', { ascending: false })
            break
    }

    const { data, error } = await query

    if (error) throw error
    return data as Agent[]
}

/** Get all unique tags from published agents */
export async function fetchMarketplaceTags(): Promise<string[]> {
    const { data, error } = await supabase
        .from('agents')
        .select('marketplace_tags')
        .eq('is_published', true)

    if (error) throw error

    const tagSet = new Set<string>()
    for (const row of data as Array<{ marketplace_tags: string[] }>) {
        for (const tag of row.marketplace_tags) {
            tagSet.add(tag)
        }
    }

    return Array.from(tagSet).sort()
}
