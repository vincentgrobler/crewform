/**
 * Trigger Scheduler — evaluates CRON triggers and creates tasks automatically.
 *
 * Runs every 60s inside the task runner. Queries all enabled CRON triggers,
 * checks if they're due based on last_fired_at, creates tasks, and logs firings.
 */

import { supabase } from './supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CronTriggerRow {
    id: string;
    agent_id: string;
    workspace_id: string;
    cron_expression: string;
    task_title_template: string;
    task_description_template: string;
    context_options: string[];
    last_fired_at: string | null;
}

// ─── CRON Parser ────────────────────────────────────────────────────────────

/**
 * Lightweight CRON expression evaluator.
 * Supports standard 5-field cron: minute hour day-of-month month day-of-week
 * Supports: wildcard, specific values, ranges, steps, lists
 */
function matchesCronField(field: string, value: number, max: number): boolean {
    if (field === '*') return true;

    for (const part of field.split(',')) {
        // Step: */5 or 1-10/2
        if (part.includes('/')) {
            const [range, stepStr] = part.split('/');
            const step = parseInt(stepStr, 10);
            if (isNaN(step) || step <= 0) continue;

            let start = 0;
            let end = max;

            if (range !== '*') {
                if (range.includes('-')) {
                    const [s, e] = range.split('-');
                    start = parseInt(s, 10);
                    end = parseInt(e, 10);
                } else {
                    start = parseInt(range, 10);
                }
            }

            for (let i = start; i <= end; i += step) {
                if (i === value) return true;
            }
            continue;
        }

        // Range: 1-5
        if (part.includes('-')) {
            const [s, e] = part.split('-');
            const start = parseInt(s, 10);
            const end = parseInt(e, 10);
            if (value >= start && value <= end) return true;
            continue;
        }

        // Exact value
        if (parseInt(part, 10) === value) return true;
    }

    return false;
}

/**
 * Check if a CRON expression matches a given date.
 */
function cronMatchesDate(expression: string, date: Date): boolean {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return false;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    return (
        matchesCronField(minute, date.getMinutes(), 59) &&
        matchesCronField(hour, date.getHours(), 23) &&
        matchesCronField(dayOfMonth, date.getDate(), 31) &&
        matchesCronField(month, date.getMonth() + 1, 12) &&
        matchesCronField(dayOfWeek, date.getDay(), 6)
    );
}

/**
 * Check if a CRON trigger is due to fire.
 * A trigger is due if:
 * 1. The current time matches the CRON expression
 * 2. It hasn't fired in the current matching minute
 */
function isTriggerDue(cronExpression: string, lastFiredAt: string | null): boolean {
    const now = new Date();

    if (!cronMatchesDate(cronExpression, now)) return false;

    // Check if already fired in this minute
    if (lastFiredAt) {
        const last = new Date(lastFiredAt);
        if (
            last.getFullYear() === now.getFullYear() &&
            last.getMonth() === now.getMonth() &&
            last.getDate() === now.getDate() &&
            last.getHours() === now.getHours() &&
            last.getMinutes() === now.getMinutes()
        ) {
            return false; // Already fired this minute
        }
    }

    return true;
}

// ─── Template Rendering ─────────────────────────────────────────────────────

function renderTemplate(template: string): string {
    const now = new Date();
    return template
        .replace(/\{\{date\}\}/g, now.toISOString().split('T')[0])
        .replace(/\{\{time\}\}/g, now.toTimeString().split(' ')[0])
        .replace(/\{\{datetime\}\}/g, now.toISOString());
}

// ─── Context Enrichment ─────────────────────────────────────────────────────

/** Available context data sources */
type ContextOption = 'task_summary' | 'team_activity' | 'agent_usage';

/**
 * Build a context block by querying yesterday's workspace data.
 * Returns a formatted string to append to the task description.
 */
async function buildContextBlock(
    workspaceId: string,
    options: string[],
): Promise<string> {
    if (options.length === 0) return '';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday);
    startOfYesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const sections: string[] = [];

    for (const option of options) {
        switch (option as ContextOption) {
            case 'task_summary': {
                const { data: tasks } = await supabase
                    .from('tasks')
                    .select('id, title, status, assigned_agent_id, created_at')
                    .eq('workspace_id', workspaceId)
                    .gte('created_at', startOfYesterday.toISOString())
                    .lte('created_at', endOfYesterday.toISOString())
                    .order('created_at', { ascending: false });

                const taskList = (tasks ?? []) as Array<{ id: string; title: string; status: string; assigned_agent_id: string | null; created_at: string }>;
                const completed = taskList.filter(t => t.status === 'completed').length;
                const failed = taskList.filter(t => t.status === 'failed').length;
                const pending = taskList.filter(t => t.status === 'pending' || t.status === 'dispatched').length;

                let section = `## Task Summary (Yesterday)\n`;
                section += `Total: ${taskList.length} | Completed: ${completed} | Failed: ${failed} | Pending: ${pending}\n`;
                if (taskList.length > 0) {
                    section += `\nTasks:\n`;
                    for (const t of taskList.slice(0, 20)) {
                        section += `- [${t.status.toUpperCase()}] ${t.title}\n`;
                    }
                    if (taskList.length > 20) section += `... and ${taskList.length - 20} more\n`;
                }
                sections.push(section);
                break;
            }

            case 'team_activity': {
                const { data: delegations } = await supabase
                    .from('delegations')
                    .select('id, parent_task_id, child_task_id, status, created_at')
                    .eq('workspace_id', workspaceId)
                    .gte('created_at', startOfYesterday.toISOString())
                    .lte('created_at', endOfYesterday.toISOString());

                const delegationList = (delegations ?? []) as Array<{ id: string; status: string }>;
                const accepted = delegationList.filter(d => d.status === 'accepted').length;
                const revised = delegationList.filter(d => d.status === 'revised').length;
                const pendingDel = delegationList.filter(d => d.status === 'pending').length;

                let section = `## Team Activity (Yesterday)\n`;
                section += `Total delegations: ${delegationList.length} | Accepted: ${accepted} | Revised: ${revised} | Pending: ${pendingDel}\n`;
                sections.push(section);
                break;
            }

            case 'agent_usage': {
                const { data: usage } = await supabase
                    .from('usage_records')
                    .select('agent_id, tokens_used, cost_estimate_usd, model')
                    .eq('workspace_id', workspaceId)
                    .gte('created_at', startOfYesterday.toISOString())
                    .lte('created_at', endOfYesterday.toISOString());

                const usageList = (usage ?? []) as Array<{ agent_id: string; tokens_used: number; cost_estimate_usd: number; model: string }>;
                const totalTokens = usageList.reduce((sum, u) => sum + (u.tokens_used ?? 0), 0);
                const totalCost = usageList.reduce((sum, u) => sum + (u.cost_estimate_usd ?? 0), 0);
                const uniqueAgents = new Set(usageList.map(u => u.agent_id)).size;

                let section = `## Agent Usage (Yesterday)\n`;
                section += `Executions: ${usageList.length} | Agents used: ${uniqueAgents} | Total tokens: ${totalTokens.toLocaleString()} | Est. cost: $${totalCost.toFixed(4)}\n`;

                // Group by model
                const modelMap = new Map<string, { count: number; tokens: number }>(); 
                for (const u of usageList) {
                    const key = u.model ?? 'unknown';
                    const entry = modelMap.get(key) ?? { count: 0, tokens: 0 };
                    entry.count++;
                    entry.tokens += u.tokens_used ?? 0;
                    modelMap.set(key, entry);
                }
                if (modelMap.size > 0) {
                    section += `\nBy model:\n`;
                    for (const [model, stats] of modelMap) {
                        section += `- ${model}: ${stats.count} runs, ${stats.tokens.toLocaleString()} tokens\n`;
                    }
                }
                sections.push(section);
                break;
            }
        }
    }

    if (sections.length === 0) return '';
    return `\n\n---\n\n# Workspace Data Context\n\n${sections.join('\n')}`;
}

// ─── Main Scheduler ─────────────────────────────────────────────────────────

let isEvaluating = false;

export async function evaluateTriggers(): Promise<void> {
    if (isEvaluating) return;
    isEvaluating = true;

    try {
        // Fetch all enabled CRON triggers
        const result = await supabase
            .from('agent_triggers')
            .select('id, agent_id, workspace_id, cron_expression, task_title_template, task_description_template, context_options, last_fired_at')
            .eq('trigger_type', 'cron')
            .eq('enabled', true)
            .not('cron_expression', 'is', null);

        const triggers = result.data as CronTriggerRow[] | null;
        if (result.error) {
            console.error('[TriggerScheduler] Error fetching triggers:', result.error.message);
            return;
        }
        if (!triggers || triggers.length === 0) return;

        for (const trigger of triggers) {
            try {
                if (!isTriggerDue(trigger.cron_expression, trigger.last_fired_at)) continue;

                console.log(`[TriggerScheduler] Firing trigger ${trigger.id} for agent ${trigger.agent_id}`);

                // Create the task
                const title = renderTemplate(trigger.task_title_template);
                let description = renderTemplate(trigger.task_description_template);

                // Enrich with workspace data if context options are selected
                const contextOptions = trigger.context_options ?? [];
                if (contextOptions.length > 0) {
                    try {
                        const contextBlock = await buildContextBlock(trigger.workspace_id, contextOptions);
                        description += contextBlock;
                    } catch (ctxErr: unknown) {
                        const msg = ctxErr instanceof Error ? ctxErr.message : String(ctxErr);
                        console.warn(`[TriggerScheduler] Failed to build context for trigger ${trigger.id}: ${msg}`);
                    }
                }

                const taskResult = await supabase
                    .from('tasks')
                    .insert({
                        workspace_id: trigger.workspace_id,
                        title,
                        description,
                        assigned_agent_id: trigger.agent_id,
                        status: 'pending',
                        priority: 'medium',
                        created_by: trigger.agent_id, // Agent self-creates
                        scheduled_for: new Date().toISOString(),
                    })
                    .select('id')
                    .single();

                if (taskResult.error) {
                    // Log failure
                    await supabase.from('trigger_log').insert({
                        trigger_id: trigger.id,
                        status: 'failed',
                        error: taskResult.error.message,
                    });
                    console.error(`[TriggerScheduler] Failed to create task for trigger ${trigger.id}:`, taskResult.error.message);
                    continue;
                }

                const taskId = (taskResult.data as { id: string }).id;

                // Update last_fired_at
                await supabase
                    .from('agent_triggers')
                    .update({ last_fired_at: new Date().toISOString() })
                    .eq('id', trigger.id);

                // Log success
                await supabase.from('trigger_log').insert({
                    trigger_id: trigger.id,
                    task_id: taskId,
                    status: 'fired',
                });

                console.log(`[TriggerScheduler] Created task ${taskId} from trigger ${trigger.id}`);
            } catch (err: unknown) {
                const errMsg = err instanceof Error ? err.message : String(err);
                console.error(`[TriggerScheduler] Error processing trigger ${trigger.id}: ${errMsg}`);
            }
        }
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[TriggerScheduler] Unexpected error: ${errMsg}`);
    } finally {
        isEvaluating = false;
    }
}

export const TRIGGER_EVAL_INTERVAL_MS = 60_000; // 60 seconds
