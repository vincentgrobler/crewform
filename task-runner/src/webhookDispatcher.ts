// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { supabase } from './supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OutputRoute {
    id: string;
    workspace_id: string;
    name: string;
    destination_type: 'http' | 'slack' | 'discord' | 'telegram';
    config: Record<string, unknown>;
    events: string[];
    is_active: boolean;
}

interface WebhookPayload {
    event: string;
    task_id: string;
    task_title: string;
    agent_name: string;
    status: string;
    result_preview: string | null;
    error: string | null;
    timestamp: string;
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
            task_title: task.title,
            agent_name: agent.name,
            status: task.status,
            result_preview: task.result ? task.result.substring(0, 500) : null,
            error: task.error ?? null,
            timestamp: new Date().toISOString(),
        };

        // 3. Dispatch to each route (fire-and-forget, parallel)
        const promises = (routes as OutputRoute[]).map((route) =>
            deliverWithRetry(route, task.id, event, payload),
        );
        await Promise.allSettled(promises);
    } catch (err: unknown) {
        // Never let webhook errors bubble up
        console.error('[Webhooks] Dispatch error:', err instanceof Error ? err.message : String(err));
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
                            text: `${emoji} *Task ${payload.status}*: ${payload.task_title}\n*Agent:* ${payload.agent_name}`,
                        },
                    },
                    ...(payload.result_preview
                        ? [
                            {
                                type: 'section',
                                text: {
                                    type: 'mrkdwn',
                                    text: `\`\`\`${payload.result_preview}\`\`\``,
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
                title: `${emoji} Task ${payload.status}`,
                description: payload.task_title,
                color,
                fields: [
                    { name: 'Agent', value: payload.agent_name, inline: true },
                    { name: 'Status', value: payload.status, inline: true },
                    ...(payload.result_preview
                        ? [{ name: 'Result', value: `\`\`\`${payload.result_preview.substring(0, 1000)}\`\`\`` }]
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

    let text = `${emoji} *Task ${payload.status}*\n\n`;
    text += `*Title:* ${escapeMarkdown(payload.task_title)}\n`;
    text += `*Agent:* ${escapeMarkdown(payload.agent_name)}\n`;

    if (payload.result_preview) {
        text += `\n\`\`\`\n${payload.result_preview.substring(0, 3000)}\n\`\`\``;
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
