// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/types'

/** Fetch a single task by ID */
async function fetchTaskById(id: string): Promise<Task | null> {
    const result = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()

    if (result.error) {
        if (result.error.code === 'PGRST116') return null
        throw result.error
    }
    return result.data as Task
}

/**
 * React Query hook for fetching a single task.
 */
export function useTask(taskId: string | null) {
    const { data: task, isLoading, error } = useQuery<Task | null>({
        queryKey: ['task', taskId],
        queryFn: () => fetchTaskById(taskId ?? ''),
        enabled: !!taskId,
        staleTime: 10 * 1000,
    })

    return { task: task ?? null, isLoading, error }
}
