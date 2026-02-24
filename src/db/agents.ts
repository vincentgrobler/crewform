// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { supabase } from '@/lib/supabase'
import type { Agent } from '@/types'

/**
 * Supabase data access layer for agents.
 * All agent queries go through this module (per Ticket 2.5 db.* pattern).
 */

/** Fetch all agents for a workspace */
export async function fetchAgents(workspaceId: string): Promise<Agent[]> {
    const result = await supabase
        .from('agents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

    if (result.error) throw result.error
    return result.data as Agent[]
}

/** Fetch a single agent by ID */
export async function fetchAgentById(id: string): Promise<Agent | null> {
    const result = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .single()

    if (result.error) {
        if (result.error.code === 'PGRST116') return null
        throw result.error
    }
    return result.data as Agent
}
