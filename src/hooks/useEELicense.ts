// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useQuery } from '@tanstack/react-query'
import { fetchEELicense } from '@/db/eeLicense'
import type { EELicense } from '@/db/eeLicense'
import { FEATURE_MIN_PLAN } from '@/lib/featureFlags'

/** Plan hierarchy — higher index = more features */
const PLAN_HIERARCHY: Record<string, number> = {
    free: 0,
    pro: 1,
    team: 2,
    enterprise: 3,
}

function planLevel(plan: string): number {
    return PLAN_HIERARCHY[plan.toLowerCase()] ?? 0
}

/**
 * React Query hook to fetch and cache the active EE license for a workspace.
 * Returns license data and helper methods for feature checking.
 */
export function useEELicense(workspaceId: string | undefined) {
    const { data: license, isLoading } = useQuery<EELicense | null>({
        queryKey: ['ee-license', workspaceId],
        queryFn: () => fetchEELicense(workspaceId ?? ''),
        enabled: !!workspaceId,
        staleTime: 5 * 60 * 1000,       // Cache for 5 minutes
        refetchOnWindowFocus: false,
    })

    const isEnterprise = !!license
    const plan = license?.plan ?? 'free'

    /**
     * Check if a specific EE feature is enabled by the workspace license.
     * First checks the explicit features array (for custom overrides),
     * then falls back to plan-level entitlements from FEATURE_MIN_PLAN.
     */
    function hasFeature(feature: string): boolean {
        if (!license) return false

        // Explicit feature in license record
        if (license.features.includes(feature)) return true

        // Plan-based entitlement: if the workspace plan >= feature's minimum plan
        const minPlan = FEATURE_MIN_PLAN[feature]
        if (minPlan && planLevel(plan) >= planLevel(minPlan)) return true

        return false
    }

    return {
        license,
        isLoading,
        isEnterprise,
        plan,
        hasFeature,
    }
}
