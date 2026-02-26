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

// ─── Main Scheduler ─────────────────────────────────────────────────────────

let isEvaluating = false;

export async function evaluateTriggers(): Promise<void> {
    if (isEvaluating) return;
    isEvaluating = true;

    try {
        // Fetch all enabled CRON triggers
        const result = await supabase
            .from('agent_triggers')
            .select('id, agent_id, workspace_id, cron_expression, task_title_template, task_description_template, last_fired_at')
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
                const description = renderTemplate(trigger.task_description_template);

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
