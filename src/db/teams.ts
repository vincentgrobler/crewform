// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { supabase } from '@/lib/supabase'
import type { Team, TeamMember, TeamMode, PipelineConfig, OrchestratorConfig, CollaborationConfig } from '@/types'

/**
 * Supabase data access layer for teams and team members.
 */

// ─── Teams ───────────────────────────────────────────────────────────────────

/** Fetch all teams for a workspace */
export async function fetchTeams(workspaceId: string): Promise<Team[]> {
    const result = await supabase
        .from('teams')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

    if (result.error) throw result.error
    return result.data as Team[]
}

/** Fetch a single team by ID */
export async function fetchTeam(id: string): Promise<Team> {
    const result = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single()

    if (result.error) throw result.error
    return result.data as Team
}

/** Create a new team */
export interface CreateTeamInput {
    workspace_id: string
    name: string
    description: string
    mode: TeamMode
    config: PipelineConfig | OrchestratorConfig | CollaborationConfig
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
    const result = await supabase
        .from('teams')
        .insert(input)
        .select()
        .single()

    if (result.error) throw result.error
    return result.data as Team
}

/** Update a team's details */
export async function updateTeam(
    id: string,
    updates: Partial<Pick<Team, 'name' | 'description' | 'config' | 'mode'>>,
): Promise<Team> {
    const result = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (result.error) throw result.error
    return result.data as Team
}

/** Delete a team */
export async function deleteTeam(id: string): Promise<void> {
    const result = await supabase
        .from('teams')
        .delete()
        .eq('id', id)

    if (result.error) throw result.error
}

// ─── Team Members ────────────────────────────────────────────────────────────

/** Fetch all members of a team */
export async function fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
    const result = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .order('position', { ascending: true })

    if (result.error) throw result.error
    return result.data as TeamMember[]
}

/** Add a member to a team */
export async function addTeamMember(
    teamId: string,
    agentId: string,
    role: TeamMember['role'],
    position: number,
): Promise<TeamMember> {
    const result = await supabase
        .from('team_members')
        .insert({ team_id: teamId, agent_id: agentId, role, position })
        .select()
        .single()

    if (result.error) throw result.error
    return result.data as TeamMember
}

/** Remove a member from a team */
export async function removeTeamMember(id: string): Promise<void> {
    const result = await supabase
        .from('team_members')
        .delete()
        .eq('id', id)

    if (result.error) throw result.error
}

/** Batch-update member positions after reorder */
export async function updateMemberPositions(
    members: { id: string; position: number }[],
): Promise<void> {
    // Use individual updates (Supabase doesn't support batch upsert well for partial updates)
    for (const member of members) {
        const result = await supabase
            .from('team_members')
            .update({ position: member.position })
            .eq('id', member.id)

        if (result.error) throw result.error
    }
}
