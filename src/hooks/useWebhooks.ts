// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRoutes, createRoute, updateRoute, deleteRoute, fetchWebhookLogs } from '@/db/webhooks'
import type { CreateRouteInput, UpdateRouteInput, OutputRoute } from '@/db/webhooks'

/**
 * React Query hooks for webhook / output route management.
 */

/** Fetch all output routes for a workspace */
export function useWebhooks(workspaceId: string | undefined) {
    return useQuery({
        queryKey: ['webhooks', workspaceId],
        queryFn: () => fetchRoutes(workspaceId!),
        enabled: !!workspaceId,
    })
}

/** Create a new output route */
export function useCreateWebhook() {
    const queryClient = useQueryClient()

    return useMutation<OutputRoute, Error, CreateRouteInput>({
        mutationFn: createRoute,
        onSuccess: (route) => {
            void queryClient.invalidateQueries({ queryKey: ['webhooks', route.workspace_id] })
        },
    })
}

/** Update an existing output route */
export function useUpdateWebhook() {
    const queryClient = useQueryClient()

    return useMutation<OutputRoute, Error, { id: string; data: UpdateRouteInput; workspaceId: string }>({
        mutationFn: ({ id, data }) => updateRoute(id, data),
        onSuccess: (_updated, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['webhooks', variables.workspaceId] })
        },
    })
}

/** Delete an output route */
export function useDeleteWebhook() {
    const queryClient = useQueryClient()

    return useMutation<void, Error, { id: string; workspaceId: string }>({
        mutationFn: ({ id }) => deleteRoute(id),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['webhooks', variables.workspaceId] })
        },
    })
}

/** Fetch webhook delivery logs for a route */
export function useWebhookLogs(routeId: string | undefined) {
    return useQuery({
        queryKey: ['webhook-logs', routeId],
        queryFn: () => fetchWebhookLogs(routeId!),
        enabled: !!routeId,
    })
}
