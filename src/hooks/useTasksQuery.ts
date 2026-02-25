// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useQuery } from '@tanstack/react-query'
import { fetchTasks } from '@/db/tasks'
import type { TaskFilters } from '@/db/tasks'
import type { Task } from '@/types'

/**
 * React Query hook for fetching tasks with filters.
 */
export function useTasksQuery(workspaceId: string | null, filters?: TaskFilters) {
    const {
        data: tasks,
        isLoading,
        error,
        refetch,
    } = useQuery<Task[]>({
        queryKey: ['tasks', workspaceId, filters],
        queryFn: () => fetchTasks(workspaceId ?? '', filters),
        enabled: !!workspaceId,
        staleTime: 15 * 1000, // 15 seconds — tasks change frequently
    })

    return { tasks: tasks ?? [], isLoading, error, refetch }
}
