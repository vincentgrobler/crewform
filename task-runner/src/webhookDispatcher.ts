// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { supabase } from './supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OutputRoute {
    id: string;
    workspace_id: string;
    name: string;
    destination_type: 'http' | 'slack' | 'discord' | 'telegram' | 'teams' | 'asana';
    config: Record<string, unknown>;
    events: string[];
    is_active: boolean;
}

interface WebhookPayload {
    event: string;
    task_id: string | null;
    team_run_id: string | null;
    task_title: string;
    agent_name: string;
    status: string;
    result_preview: string | null;
    result_full: string | null;
    error: string | null;
    timestamp: string;
}

interface TeamRunInfo {
    id: string;
    team_id: string;
    workspace_id: string;
    status: string;
    input_task: string;
    output?: string | null;
    error_message?: string | null;
}

interface TaskInfo {
    id: string;
    title: string;
    workspace_id: string;
    status: string;
    result?: string | null;
    error?: string | null;
}

interface AgentInfo {
    name: string;
}

// ─── Main dispatcher ────────────────────────────────────────────────────────

/**
 * Fire webhooks for a task event. Never throws — failures are logged but
 * never block the task completion flow.
 */
export async function dispatchWebhooks(
    task: TaskInfo,
    agent: AgentInfo,
    event: string,
): Promise<void> {
    try {
        // 1. Fetch active routes for this workspace + event
        const { data: routes, error } = await supabase
            .from('output_routes')
            .select('*')
            .eq('workspace_id', task.workspace_id)
            .eq('is_active', true)
            .contains('events', [event]);

        if (error || !routes || routes.length === 0) return;

        // 2. Build payload
        const payload: WebhookPayload = {
            event,
            task_id: task.id,
            team_run_id: null,
            task_title: task.title,
            agent_name: agent.name,
            status: task.status,
            result_preview: task.result ? task.result.substring(0, 500) : null,
            result_full: task.result ?? null,
            error: task.error ?? null,
            timestamp: new Date().toISOString(),
        };

        // 3. Dispatch to each route (fire-and-forget, parallel)
        const promises = (routes as OutputRoute[]).map((route) =>
            deliverWithRetry(route, task.id, event, payload),
        );
        await Promise.allSettled(promises);

        // 4. Also dispatch to Zapier subscriptions
        void dispatchZapierHooks(task.workspace_id, event, payload);
    } catch (err: unknown) {
        // Never let webhook errors bubble up
        console.error('[Webhooks] Dispatch error:', err instanceof Error ? err.message : String(err));
    }
}

/**
 * Fire webhooks for a team run event (team_run.completed, team_run.failed).
 * Never throws — failures are logged but never block the run flow.
 */
export async function dispatchTeamRunWebhooks(
    teamRun: TeamRunInfo,
    teamName: string,
    event: string,
): Promise<void> {
    try {
        const { data: routes, error } = await supabase
            .from('output_routes')
            .select('*')
            .eq('workspace_id', teamRun.workspace_id)
            .eq('is_active', true)
            .contains('events', [event]);

        if (error || !routes || routes.length === 0) return;

        const payload: WebhookPayload = {
            event,
            task_id: null,
            team_run_id: teamRun.id,
            task_title: teamRun.input_task,
            agent_name: teamName,
            status: teamRun.status,
            result_preview: teamRun.output ? teamRun.output.substring(0, 500) : null,
            result_full: teamRun.output ?? null,
            error: teamRun.error_message ?? null,
            timestamp: new Date().toISOString(),
        };

        const promises = (routes as OutputRoute[]).map((route) =>
            deliverWithRetry(route, teamRun.id, event, payload),
        );
        await Promise.allSettled(promises);

        // Also dispatch to Zapier subscriptions
        void dispatchZapierHooks(teamRun.workspace_id, event, payload);
    } catch (err: unknown) {
        console.error('[Webhooks] Team run dispatch error:', err instanceof Error ? err.message : String(err));
    }
}

/**
 * Dispatch to any Zapier REST Hook subscriptions for this workspace + event.
 * Never throws — failures are logged but never block the calling flow.
 */
async function dispatchZapierHooks(
    workspaceId: string,
    event: string,
    payload: WebhookPayload,
): Promise<void> {
    try {
        const { data: subs, error } = await supabase
            .from('zapier_subscriptions')
            .select('id, target_url')
            .eq('workspace_id', workspaceId)
            .eq('event', event);

        if (error || !subs || subs.length === 0) return;

        const deliveries = (subs as Array<{ id: string; target_url: string }>).map(async (sub) => {
            try {
                const resp = await fetch(sub.target_url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(10000),
                });

                if (!resp.ok) {
                    console.warn(`[Zapier] Hook ${sub.id} returned ${resp.status}`);
                    // If Zapier returns 410 Gone, the subscription was cancelled — clean it up
                    if (resp.status === 410) {
                        await supabase.from('zapier_subscriptions').delete().eq('id', sub.id);
                        console.log(`[Zapier] Removed stale subscription ${sub.id}`);
                    }
                }
            } catch (err: unknown) {
                console.error(`[Zapier] Hook ${sub.id} failed:`, err instanceof Error ? err.message : String(err));
            }
        });

        await Promise.allSettled(deliveries);
    } catch (err: unknown) {
        console.error('[Zapier] Dispatch error:', err instanceof Error ? err.message : String(err));
    }
}

// ─── Delivery with 1 retry ──────────────────────────────────────────────────

async function deliverWithRetry(
    route: OutputRoute,
    taskId: string,
    event: string,
    payload: WebhookPayload,
): Promise<void> {
    let lastError: string | null = null;
    let statusCode: number | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            if (attempt > 0) {
                await sleep(5000);
            }

            const result = await deliver(route, payload);
            statusCode = result.statusCode;

            if (result.ok) {
                await logDelivery(route.id, taskId, event, 'success', statusCode, null, payload);
                return;
            }

            lastError = `HTTP ${result.statusCode}`;
        } catch (err: unknown) {
            lastError = err instanceof Error ? err.message : String(err);
        }
    }

    // Both attempts failed
    await logDelivery(route.id, taskId, event, 'failed', statusCode, lastError, payload);
    console.error(`[Webhooks] Failed to deliver to "${route.name}" (${route.destination_type}): ${lastError}`);
}

// ─── Destination handlers ───────────────────────────────────────────────────

async function deliver(
    route: OutputRoute,
    payload: WebhookPayload,
): Promise<{ ok: boolean; statusCode: number }> {
    switch (route.destination_type) {
        case 'http':
            return deliverHTTP(route, payload);
        case 'slack':
            return deliverSlack(route, payload);
        case 'discord':
            return deliverDiscord(route, payload);
        case 'telegram':
            return deliverTelegram(route, payload);
        case 'teams':
            return deliverTeams(route, payload);
        case 'asana':
            return deliverAsana(route, payload);
        default:
            throw new Error(`Unknown destination type: ${route.destination_type}`);
    }
}

// ── HTTP ─────────────────────────────────────────────────────────────────────

async function deliverHTTP(
    route: OutputRoute,
    payload: WebhookPayload,
): Promise<{ ok: boolean; statusCode: number }> {
    const url = route.config.url as string;
    const secret = route.config.secret as string | undefined;

    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'CrewForm-Webhook/1.0',
    };

    if (secret) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign'],
        );
        const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
        const hex = Array.from(new Uint8Array(sig))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        headers['X-CrewForm-Signature'] = `sha256=${hex}`;
    }

    const resp = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000),
    });

    return { ok: resp.ok, statusCode: resp.status };
}

// ── Slack ────────────────────────────────────────────────────────────────────

async function deliverSlack(
    route: OutputRoute,
    payload: WebhookPayload,
): Promise<{ ok: boolean; statusCode: number }> {
    const url = route.config.webhook_url as string;
    const emoji = payload.status === 'completed' ? '✅' : '❌';
    const color = payload.status === 'completed' ? '#22c55e' : '#ef4444';

    const slackBody = {
        attachments: [
            {
                color,
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `${emoji} *${payload.team_run_id ? 'Team Run' : 'Task'} ${payload.status}*: ${payload.task_title}\n*${payload.team_run_id ? 'Team' : 'Agent'}:* ${payload.agent_name}`,
                        },
                    },
                    ...(payload.result_full
                        ? [
                            {
                                type: 'section',
                                text: {
                                    type: 'mrkdwn',
                                    text: payload.result_full.length > 2900
                                        ? `\`\`\`${payload.result_full.substring(0, 2900)}\`\`\`\n_Output truncated (${payload.result_full.length} chars). Full output available via HTTP webhook._`
                                        : `\`\`\`${payload.result_full}\`\`\``,
                                },
                            },
                        ]
                        : []),
                    ...(payload.error
                        ? [
                            {
                                type: 'section',
                                text: {
                                    type: 'mrkdwn',
                                    text: `*Error:* ${payload.error}`,
                                },
                            },
                        ]
                        : []),
                ],
            },
        ],
    };

    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackBody),
        signal: AbortSignal.timeout(10000),
    });

    return { ok: resp.ok, statusCode: resp.status };
}

// ── Discord ─────────────────────────────────────────────────────────────────

async function deliverDiscord(
    route: OutputRoute,
    payload: WebhookPayload,
): Promise<{ ok: boolean; statusCode: number }> {
    const url = route.config.webhook_url as string;
    const color = payload.status === 'completed' ? 0x22c55e : 0xef4444;
    const emoji = payload.status === 'completed' ? '✅' : '❌';

    const discordBody = {
        embeds: [
            {
                title: `${emoji} ${payload.team_run_id ? 'Team Run' : 'Task'} ${payload.status}`,
                description: payload.task_title,
                color,
                fields: [
                    { name: payload.team_run_id ? 'Team' : 'Agent', value: payload.agent_name, inline: true },
                    { name: 'Status', value: payload.status, inline: true },
                    ...(payload.result_full
                        ? [{
                            name: 'Result',
                            value: payload.result_full.length > 1000
                                ? `\`\`\`${payload.result_full.substring(0, 950)}\`\`\`\n_Truncated (${payload.result_full.length} chars)_`
                                : `\`\`\`${payload.result_full}\`\`\``,
                        }]
                        : []),
                    ...(payload.error ? [{ name: 'Error', value: payload.error }] : []),
                ],
                timestamp: payload.timestamp,
            },
        ],
    };

    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordBody),
        signal: AbortSignal.timeout(10000),
    });

    return { ok: resp.ok, statusCode: resp.status };
}

// ── Telegram ────────────────────────────────────────────────────────────────

async function deliverTelegram(
    route: OutputRoute,
    payload: WebhookPayload,
): Promise<{ ok: boolean; statusCode: number }> {
    const botToken = route.config.bot_token as string;
    const chatId = route.config.chat_id as string;
    const emoji = payload.status === 'completed' ? '✅' : '❌';

    let text = `${emoji} *${payload.team_run_id ? 'Team Run' : 'Task'} ${payload.status}*\n\n`;
    text += `*Title:* ${escapeMarkdown(payload.task_title)}\n`;
    text += `*${payload.team_run_id ? 'Team' : 'Agent'}:* ${escapeMarkdown(payload.agent_name)}\n`;

    if (payload.result_full) {
        const resultText = payload.result_full.length > 3500
            ? `${payload.result_full.substring(0, 3500)}\n\n... truncated (${payload.result_full.length} chars)`
            : payload.result_full;
        text += `\n\`\`\`\n${resultText}\n\`\`\``;
    }
    if (payload.error) {
        text += `\n⚠️ *Error:* ${escapeMarkdown(payload.error)}`;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(10000),
    });

    return { ok: resp.ok, statusCode: resp.status };
}

function escapeMarkdown(text: string): string {
    return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

// ── Microsoft Teams ─────────────────────────────────────────────────────────

async function deliverTeams(
    route: OutputRoute,
    payload: WebhookPayload,
): Promise<{ ok: boolean; statusCode: number }> {
    const url = route.config.webhook_url as string;
    const emoji = payload.status === 'completed' ? '✅' : '❌';

    // Build Adaptive Card payload for Teams Incoming Webhook
    const teamsBody = {
        type: 'message',
        attachments: [
            {
                contentType: 'application/vnd.microsoft.card.adaptive',
                content: {
                    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                    type: 'AdaptiveCard',
                    version: '1.4',
                    body: [
                        {
                            type: 'TextBlock',
                            size: 'Medium',
                            weight: 'Bolder',
                            text: `${emoji} ${payload.team_run_id ? 'Team Run' : 'Task'} ${payload.status}`,
                            color: payload.status === 'completed' ? 'Good' : 'Attention',
                        },
                        {
                            type: 'FactSet',
                            facts: [
                                { title: payload.team_run_id ? 'Prompt' : 'Task', value: payload.task_title },
                                { title: payload.team_run_id ? 'Team' : 'Agent', value: payload.agent_name },
                                { title: 'Status', value: payload.status },
                            ],
                        },
                        ...(payload.result_full
                            ? [
                                {
                                    type: 'TextBlock',
                                    text: payload.result_full.length > 2000
                                        ? `${payload.result_full.substring(0, 2000)}\n\n... truncated (${payload.result_full.length} chars)`
                                        : payload.result_full,
                                    wrap: true,
                                    fontType: 'Monospace',
                                    size: 'Small',
                                },
                            ]
                            : []),
                        ...(payload.error
                            ? [
                                {
                                    type: 'TextBlock',
                                    text: `⚠️ Error: ${payload.error}`,
                                    color: 'Attention',
                                    wrap: true,
                                },
                            ]
                            : []),
                    ],
                },
            },
        ],
    };

    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsBody),
        signal: AbortSignal.timeout(10000),
    });

    return { ok: resp.ok, statusCode: resp.status };
}

// ── Asana ────────────────────────────────────────────────────────────────────

async function deliverAsana(
    route: OutputRoute,
    payload: WebhookPayload,
): Promise<{ ok: boolean; statusCode: number }> {
    const pat = route.config.pat as string;
    const projectGid = route.config.project_gid as string;

    const emoji = payload.status === 'completed' ? '✅' : '❌';

    // Build task notes with event details
    let notes = `${emoji} ${payload.event.replace('.', ' ').replace(/_/g, ' ')}\n\n`;
    notes += `Task: ${payload.task_title}\n`;
    notes += `Agent: ${payload.agent_name}\n`;
    notes += `Status: ${payload.status}\n`;
    notes += `Time: ${payload.timestamp}\n`;

    if (payload.result_full) {
        notes += `\n--- Result ---\n${payload.result_full}`;
    }
    if (payload.error) {
        notes += `\n⚠️ Error: ${payload.error}`;
    }

    const asanaBody = {
        data: {
            name: `[CrewForm] ${payload.task_title} — ${payload.status}`,
            notes,
            projects: [projectGid],
        },
    };

    const resp = await fetch('https://app.asana.com/api/1.0/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${pat}`,
        },
        body: JSON.stringify(asanaBody),
        signal: AbortSignal.timeout(10000),
    });

    return { ok: resp.ok, statusCode: resp.status };
}

// ─── Logging ────────────────────────────────────────────────────────────────

async function logDelivery(
    routeId: string,
    taskId: string,
    event: string,
    status: 'success' | 'failed',
    statusCode: number | null,
    error: string | null,
    payload: WebhookPayload,
): Promise<void> {
    try {
        await supabase.from('webhook_logs').insert({
            route_id: routeId,
            task_id: taskId,
            event,
            status,
            status_code: statusCode,
            error,
            payload,
        });
    } catch (logErr: unknown) {
        console.error('[Webhooks] Failed to write log:', logErr instanceof Error ? logErr.message : String(logErr));
    }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
