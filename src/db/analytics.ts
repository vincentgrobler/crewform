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

// ─── Cost Over Time ──────────────────────────────────────────────────────────

export interface DailyCost {
    date: string       // 'YYYY-MM-DD'
    cost: number
    tokens: number
    cumulative: number
}

/** Fetch daily cost time-series between start and end dates */
export async function fetchCostOverTime(
    workspaceId: string,
    startDate: string,
    endDate: string,
): Promise<DailyCost[]> {
    const { data, error } = await supabase
        .from('agent_tasks')
        .select('cost_estimate_usd, tokens_used, completed_at')
        .eq('workspace_id', workspaceId)
        .gte('completed_at', startDate)
        .lte('completed_at', endDate)
        .in('status', ['completed', 'failed'])

    if (error) throw error

    // Group by day
    const dayMap = new Map<string, { cost: number; tokens: number }>()
    for (const row of data as Array<{ cost_estimate_usd: number | null; tokens_used: number | null; completed_at: string }>) {
        if (!row.completed_at) continue
        const day = row.completed_at.slice(0, 10)
        const entry = dayMap.get(day) ?? { cost: 0, tokens: 0 }
        entry.cost += row.cost_estimate_usd ?? 0
        entry.tokens += row.tokens_used ?? 0
        dayMap.set(day, entry)
    }

    // Fill days + compute cumulative
    const result: DailyCost[] = []
    let cumulative = 0
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
        const dayStr = current.toISOString().slice(0, 10)
        const entry = dayMap.get(dayStr) ?? { cost: 0, tokens: 0 }
        cumulative += entry.cost
        result.push({ date: dayStr, cost: entry.cost, tokens: entry.tokens, cumulative })
        current.setDate(current.getDate() + 1)
    }

    return result
}

// ─── Time Saved ──────────────────────────────────────────────────────────────

export interface TimeSavedData {
    agentMinutes: number      // Total agent processing time
    manualEstimate: number    // Estimated manual equivalent (5× multiplier)
    timeSavedMinutes: number  // Delta
    taskCount: number
    avgSecondsPerTask: number
}

/** Estimate time saved by agents compared to manual work */
export async function fetchTimeSaved(
    workspaceId: string,
    startDate: string,
    endDate: string,
): Promise<TimeSavedData> {
    const { data, error } = await supabase
        .from('agent_tasks')
        .select('started_at, completed_at')
        .eq('workspace_id', workspaceId)
        .eq('status', 'completed')
        .gte('completed_at', startDate)
        .lte('completed_at', endDate)
        .not('started_at', 'is', null)
        .not('completed_at', 'is', null)

    if (error) throw error

    let totalSeconds = 0
    let count = 0

    for (const row of data as Array<{ started_at: string; completed_at: string }>) {
        const start = new Date(row.started_at).getTime()
        const end = new Date(row.completed_at).getTime()
        const duration = (end - start) / 1000
        if (duration > 0 && duration < 3600) { // Cap at 1 hour to exclude outliers
            totalSeconds += duration
            count++
        }
    }

    const agentMinutes = totalSeconds / 60
    const avgSecondsPerTask = count > 0 ? totalSeconds / count : 0
    const manualEstimate = agentMinutes * 5 // 5× multiplier
    const timeSavedMinutes = manualEstimate - agentMinutes

    return { agentMinutes, manualEstimate, timeSavedMinutes, taskCount: count, avgSecondsPerTask }
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

export interface TaskExportRow {
    date: string
    task_title: string
    agent_name: string
    status: string
    model: string
    tokens: number
    cost_usd: number
    duration_seconds: number
}

/** Fetch all task data for CSV export */
export async function fetchTasksForExport(
    workspaceId: string,
    startDate: string,
    endDate: string,
): Promise<TaskExportRow[]> {
    const [taskResult, agentResult] = await Promise.all([
        supabase
            .from('agent_tasks')
            .select('task_id, agent_id, status, model_used, tokens_used, cost_estimate_usd, started_at, completed_at')
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

    // Fetch task titles
    const taskIds = [...new Set((taskResult.data as Array<{ task_id: string }>).map(r => r.task_id))]
    const titleMap = new Map<string, string>()

    if (taskIds.length > 0) {
        const titleResult = await supabase
            .from('tasks')
            .select('id, title')
            .in('id', taskIds)

        if (!titleResult.error) {
            for (const t of titleResult.data as Array<{ id: string; title: string }>) {
                titleMap.set(t.id, t.title)
            }
        }
    }

    return (taskResult.data as Array<{
        task_id: string; agent_id: string; status: string;
        model_used: string | null; tokens_used: number | null; cost_estimate_usd: number | null;
        started_at: string | null; completed_at: string | null
    }>).map(row => {
        const durationMs = row.started_at && row.completed_at
            ? new Date(row.completed_at).getTime() - new Date(row.started_at).getTime()
            : 0
        return {
            date: row.completed_at?.slice(0, 10) ?? '',
            task_title: titleMap.get(row.task_id) ?? 'Unknown',
            agent_name: agentMap.get(row.agent_id) ?? 'Unknown',
            status: row.status,
            model: row.model_used ?? '',
            tokens: row.tokens_used ?? 0,
            cost_usd: row.cost_estimate_usd ?? 0,
            duration_seconds: Math.round(durationMs / 1000),
        }
    }).sort((a, b) => a.date.localeCompare(b.date))
}
