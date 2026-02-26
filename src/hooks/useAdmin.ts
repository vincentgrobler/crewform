// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    checkIsSuperAdmin, fetchAllWorkspaces, fetchPlatformStats,
    overrideWorkspacePlan,
} from '@/db/admin'
import type { AdminWorkspace, PlatformStats } from '@/db/admin'

/** Check if current user is a super admin */
export function useSuperAdmin() {
    const { data: isSuperAdmin = false, isLoading } = useQuery<boolean>({
        queryKey: ['super-admin'],
        queryFn: checkIsSuperAdmin,
        staleTime: 10 * 60 * 1000,
    })
    return { isSuperAdmin, isLoading }
}

/** Fetch all workspaces (admin only) */
export function useAllWorkspaces() {
    return useQuery<AdminWorkspace[]>({
        queryKey: ['admin-workspaces'],
        queryFn: fetchAllWorkspaces,
        staleTime: 60 * 1000,
    })
}

/** Fetch platform stats (admin only) */
export function usePlatformStats() {
    return useQuery<PlatformStats>({
        queryKey: ['admin-stats'],
        queryFn: fetchPlatformStats,
        staleTime: 60 * 1000,
    })
}

/** Override a workspace's plan */
export function useOverridePlan() {
    const queryClient = useQueryClient()
    return useMutation<undefined, Error, { workspaceId: string; plan: string }>({
        mutationFn: async ({ workspaceId, plan }) => {
            await overrideWorkspacePlan(workspaceId, plan)
            return undefined
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin-workspaces'] })
            void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
        },
    })
}
