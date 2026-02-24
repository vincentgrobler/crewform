// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Workspace } from '@/types'

/**
 * Fetches the first workspace for the current user.
 * In MVP, each user has exactly one workspace (auto-created on signup).
 * This will be expanded to workspace switching in Phase 2.
 */
async function fetchWorkspace(userId: string): Promise<Workspace | null> {
    const result = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

    if (result.error) {
        // PGRST116 = no rows found - user has no workspace yet
        if (result.error.code === 'PGRST116') return null
        throw result.error
    }

    return result.data as Workspace
}

export function useWorkspace() {
    const { user } = useAuth()

    const { data: workspace, isLoading, error } = useQuery({
        queryKey: ['workspace', user?.id],
        queryFn: () => fetchWorkspace(user?.id ?? ''),
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // 5 minutes — workspace rarely changes
    })

    return {
        workspace: workspace ?? null,
        workspaceId: workspace?.id ?? null,
        isLoading,
        error,
    }
}
