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

/** Create a new agent */
export interface CreateAgentInput {
    workspace_id: string
    name: string
    description: string
    model: string
    system_prompt: string
    temperature: number
    tools: string[]
    avatar_url?: string | null
}

export async function createAgent(input: CreateAgentInput): Promise<Agent> {
    const result = await supabase
        .from('agents')
        .insert(input)
        .select()
        .single()

    if (result.error) throw result.error
    return result.data as Agent
}

/** Update an existing agent */
export type UpdateAgentInput = Partial<Omit<CreateAgentInput, 'workspace_id'>>

export async function updateAgent(id: string, input: UpdateAgentInput): Promise<Agent> {
    const result = await supabase
        .from('agents')
        .update(input)
        .eq('id', id)
        .select()
        .single()

    if (result.error) throw result.error
    return result.data as Agent
}

/** Delete an agent */
export async function deleteAgent(id: string): Promise<void> {
    const result = await supabase
        .from('agents')
        .delete()
        .eq('id', id)

    if (result.error) throw result.error
}
