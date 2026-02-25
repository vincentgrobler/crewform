// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTeamRun } from '@/db/teamRuns'
import type { CreateTeamRunInput } from '@/db/teamRuns'
import type { TeamRun } from '@/types'

/**
 * React Query mutation for creating a team run ("Run Team" button).
 */
export function useCreateTeamRun() {
    const queryClient = useQueryClient()

    return useMutation<TeamRun, Error, CreateTeamRunInput>({
        mutationFn: createTeamRun,
        onSuccess: (created) => {
            void queryClient.invalidateQueries({ queryKey: ['team-runs', created.team_id] })
        },
    })
}
