// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { supabase } from '@/lib/supabase'

// ─── Completion Over Time ────────────────────────────────────────────────────

export interface DailyCompletion {
    date: string       // 'YYYY-MM-DD'
    completed: number
    failed: number
    total: number
}

/** Fetch daily task completion counts between start and end dates */
export async function fetchCompletionOverTime(
    workspaceId: string,
    startDate: string,
    endDate: string,
): Promise<DailyCompletion[]> {
    const { data, error } = await supabase
        .from('agent_tasks')
        .select('status, completed_at')
        .eq('workspace_id', workspaceId)
        .gte('completed_at', startDate)
        .lte('completed_at', endDate)
        .in('status', ['completed', 'failed'])

    if (error) throw error

    // Group by day
    const dayMap = new Map<string, DailyCompletion>()

    for (const row of data as Array<{ status: string; completed_at: string }>) {
        if (!row.completed_at) continue
        const day = row.completed_at.slice(0, 10) // 'YYYY-MM-DD'

        let entry = dayMap.get(day)
        if (!entry) {
            entry = { date: day, completed: 0, failed: 0, total: 0 }
            dayMap.set(day, entry)
        }

        entry.total++
        if (row.status === 'completed') entry.completed++
        if (row.status === 'failed') entry.failed++
    }

    // Fill in missing days with zeros
    const result: DailyCompletion[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
        const dayStr = current.toISOString().slice(0, 10)
        result.push(dayMap.get(dayStr) ?? { date: dayStr, completed: 0, failed: 0, total: 0 })
        current.setDate(current.getDate() + 1)
    }

    return result
}

// ─── Cost By Agent ───────────────────────────────────────────────────────────

export interface AgentCost {
    agentName: string
    cost: number
}

/** Fetch total cost per agent in the date range */
export async function fetchCostByAgent(
    workspaceId: string,
    startDate: string,
    endDate: string,
): Promise<AgentCost[]> {
    const [taskResult, agentResult] = await Promise.all([
        supabase
            .from('agent_tasks')
            .select('agent_id, cost_estimate_usd')
            .eq('workspace_id', workspaceId)
            .gte('created_at', startDate)
            .lte('created_at', endDate),
        supabase
            .from('agents')
            .select('id, name')
            .eq('workspace_id', workspaceId),
    ])

    if (taskResult.error) throw taskResult.error
    if (agentResult.error) throw agentResult.error

    const agentMap = new Map<string, string>()
    for (const a of agentResult.data as Array<{ id: string; name: string }>) {
        agentMap.set(a.id, a.name)
    }

    const costMap = new Map<string, number>()
    for (const row of taskResult.data as Array<{ agent_id: string; cost_estimate_usd: number }>) {
        const prev = costMap.get(row.agent_id) ?? 0
        costMap.set(row.agent_id, prev + row.cost_estimate_usd)
    }

    return Array.from(costMap.entries())
        .map(([agentId, cost]) => ({
            agentName: agentMap.get(agentId) ?? 'Unknown',
            cost,
        }))
        .sort((a, b) => b.cost - a.cost)
}

// ─── Status Distribution ─────────────────────────────────────────────────────

export interface StatusCount {
    status: string
    count: number
    color: string
}

const STATUS_COLORS: Record<string, string> = {
    completed: '#22c55e',
    failed: '#ef4444',
    running: '#3b82f6',
    pending: '#6b7280',
    dispatched: '#06b6d4',
    cancelled: '#64748b',
}

/** Fetch task count per status in the date range */
export async function fetchStatusDistribution(
    workspaceId: string,
    startDate: string,
    endDate: string,
): Promise<StatusCount[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('workspace_id', workspaceId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

    if (error) throw error

    const countMap = new Map<string, number>()
    for (const row of data as Array<{ status: string }>) {
        countMap.set(row.status, (countMap.get(row.status) ?? 0) + 1)
    }

    return Array.from(countMap.entries())
        .map(([status, count]) => ({
            status: status.charAt(0).toUpperCase() + status.slice(1),
            count,
            color: STATUS_COLORS[status] ?? '#6b7280',
        }))
        .sort((a, b) => b.count - a.count)
}

// ─── Top Models By Usage ─────────────────────────────────────────────────────

export interface ModelUsage {
    model: string
    count: number
    tokens: number
}

/** Fetch usage count per model in the date range */
export async function fetchTopModels(
    workspaceId: string,
    startDate: string,
    endDate: string,
): Promise<ModelUsage[]> {
    const { data, error } = await supabase
        .from('agent_tasks')
        .select('model_used, tokens_used')
        .eq('workspace_id', workspaceId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .not('model_used', 'is', null)

    if (error) throw error

    const modelMap = new Map<string, ModelUsage>()
    for (const row of data as Array<{ model_used: string; tokens_used: number }>) {
        if (!row.model_used) continue
        let entry = modelMap.get(row.model_used)
        if (!entry) {
            entry = { model: row.model_used, count: 0, tokens: 0 }
            modelMap.set(row.model_used, entry)
        }
        entry.count++
        entry.tokens += row.tokens_used
    }

    return Array.from(modelMap.values()).sort((a, b) => b.count - a.count).slice(0, 10)
}
