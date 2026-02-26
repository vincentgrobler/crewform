// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    fetchTriggers, createTrigger, updateTriggerEnabled,
    deleteTrigger, fetchTriggerLog,
} from '@/db/triggers'
import type { AgentTrigger, CreateTriggerInput, TriggerLogEntry } from '@/db/triggers'

/** Fetch all triggers for an agent */
export function useTriggers(agentId: string | undefined) {
    return useQuery<AgentTrigger[]>({
        queryKey: ['triggers', agentId],
        queryFn: () => {
            if (!agentId) throw new Error('Missing agentId')
            return fetchTriggers(agentId)
        },
        enabled: !!agentId,
    })
}

/** Create a new trigger */
export function useCreateTrigger() {
    const queryClient = useQueryClient()

    return useMutation<AgentTrigger, Error, CreateTriggerInput>({
        mutationFn: (input) => createTrigger(input),
        onSuccess: (trigger) => {
            void queryClient.invalidateQueries({ queryKey: ['triggers', trigger.agent_id] })
        },
    })
}

/** Toggle trigger enabled/disabled */
export function useToggleTrigger() {
    const queryClient = useQueryClient()

    return useMutation<AgentTrigger, Error, { id: string; enabled: boolean; agentId: string }>({
        mutationFn: ({ id, enabled }) => updateTriggerEnabled(id, enabled),
        onSuccess: (_data, { agentId }) => {
            void queryClient.invalidateQueries({ queryKey: ['triggers', agentId] })
        },
    })
}

/** Delete a trigger */
export function useDeleteTrigger() {
    const queryClient = useQueryClient()

    return useMutation<undefined, Error, { id: string; agentId: string }>({
        mutationFn: async ({ id }) => {
            await deleteTrigger(id)
            return undefined
        },
        onSuccess: (_data, { agentId }) => {
            void queryClient.invalidateQueries({ queryKey: ['triggers', agentId] })
        },
    })
}

/** Fetch trigger log entries */
export function useTriggerLog(triggerId: string | undefined) {
    return useQuery<TriggerLogEntry[]>({
        queryKey: ['trigger-log', triggerId],
        queryFn: () => {
            if (!triggerId) throw new Error('Missing triggerId')
            return fetchTriggerLog(triggerId)
        },
        enabled: !!triggerId,
    })
}
