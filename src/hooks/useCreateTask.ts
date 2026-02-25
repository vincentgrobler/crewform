// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask } from '@/db/tasks'
import type { CreateTaskInput } from '@/db/tasks'
import type { Task } from '@/types'

/**
 * React Query mutation for creating a task.
 */
export function useCreateTask() {
    const queryClient = useQueryClient()

    return useMutation<Task, Error, CreateTaskInput>({
        mutationFn: createTask,
        onSuccess: (created) => {
            void queryClient.invalidateQueries({ queryKey: ['tasks', created.workspace_id] })
        },
    })
}
