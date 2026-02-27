// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { supabase } from '@/lib/supabase'
import type { TeamRun, TeamMessage, TeamHandoff } from '@/types'

/**
 * Supabase data access layer for team runs, messages, and handoffs.
 */

// ─── Team Runs ───────────────────────────────────────────────────────────────

/** Fetch all runs for a team */
export async function fetchTeamRuns(teamId: string): Promise<TeamRun[]> {
    const result = await supabase
        .from('team_runs')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

    if (result.error) throw result.error
    return result.data as TeamRun[]
}

/** Fetch a single team run by ID */
export async function fetchTeamRun(runId: string): Promise<TeamRun> {
    const result = await supabase
        .from('team_runs')
        .select('*')
        .eq('id', runId)
        .single()

    if (result.error) throw result.error
    return result.data as TeamRun
}

/** Create a new team run */
export interface CreateTeamRunInput {
    team_id: string
    workspace_id: string
    input_task: string
    created_by: string
}

export async function createTeamRun(input: CreateTeamRunInput): Promise<TeamRun> {
    const result = await supabase
        .from('team_runs')
        .insert({
            ...input,
            status: 'pending',
        })
        .select()
        .single()

    if (result.error) throw result.error
    return result.data as TeamRun
}

/** Re-run a failed/completed/cancelled team run: reset to pending, clear progress */
export async function rerunTeamRun(id: string): Promise<TeamRun> {
    const result = await supabase
        .from('team_runs')
        .update({
            status: 'pending',
            output: null,
            current_step_idx: null,
            error_message: null,
            started_at: null,
            completed_at: null,
            claimed_by_runner: null,
            tokens_total: 0,
            cost_estimate_usd: 0,
        })
        .eq('id', id)
        .select()
        .single()

    if (result.error) throw result.error
    return result.data as TeamRun
}

// ─── Team Messages ───────────────────────────────────────────────────────────

/** Fetch messages for a run, ordered chronologically */
export async function fetchTeamMessages(runId: string): Promise<TeamMessage[]> {
    const result = await supabase
        .from('team_messages')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: true })

    if (result.error) throw result.error
    return result.data as TeamMessage[]
}

// ─── Team Handoffs ───────────────────────────────────────────────────────────

/** Fetch handoffs for a run, ordered chronologically */
export async function fetchTeamHandoffs(runId: string): Promise<TeamHandoff[]> {
    const result = await supabase
        .from('team_handoffs')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: true })

    if (result.error) throw result.error
    return result.data as TeamHandoff[]
}
