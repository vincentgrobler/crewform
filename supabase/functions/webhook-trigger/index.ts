// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

/**
 * Webhook Trigger Edge Function
 *
 * Receives inbound POST requests at /webhook-trigger?token={token}
 * and creates a task for the associated agent.
 *
 * Auth: token-based (the webhook_token IS the auth — no JWT/API key needed).
 * Rate limit: 60 fires per hour per token.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { ok, badRequest, notFound, methodNotAllowed, serverError } from '../_shared/response.ts';

// ─── Rate Limiter (in-memory, per-isolate) ──────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 60;

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(token: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(token);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(token, { count: 1, windowStart: now });
        return true;
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return false;
    }

    entry.count++;
    return true;
}

// ─── Template Helpers ───────────────────────────────────────────────────────

function resolveTemplate(template: string): string {
    const now = new Date();
    return template
        .replace(/\{\{date\}\}/g, now.toISOString().split('T')[0])
        .replace(/\{\{time\}\}/g, now.toTimeString().split(' ')[0])
        .replace(/\{\{datetime\}\}/g, now.toISOString());
}

// ─── Response Helper ────────────────────────────────────────────────────────

function tooManyRequests(): Response {
    return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 60 requests per hour per webhook.' }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': '60',
            },
        },
    );
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
    const cors = handleCors(req);
    if (cors) return cors;

    if (req.method !== 'POST') {
        return methodNotAllowed();
    }

    try {
        const url = new URL(req.url);
        const token = url.searchParams.get('token');

        if (!token) {
            return badRequest('Missing required "token" query parameter');
        }

        // ── Rate limit ──────────────────────────────────────────────────
        if (!checkRateLimit(token)) {
            return tooManyRequests();
        }

        // ── Service client (bypasses RLS) ───────────────────────────────
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // ── Look up trigger by token ────────────────────────────────────
        const { data: trigger, error: triggerError } = await supabase
            .from('agent_triggers')
            .select('id, agent_id, workspace_id, trigger_type, task_title_template, task_description_template, enabled')
            .eq('webhook_token', token)
            .eq('trigger_type', 'webhook')
            .single();

        if (triggerError || !trigger) {
            return notFound('Webhook trigger');
        }

        const triggerRecord = trigger as {
            id: string;
            agent_id: string;
            workspace_id: string;
            trigger_type: string;
            task_title_template: string;
            task_description_template: string;
            enabled: boolean;
        };

        if (!triggerRecord.enabled) {
            return badRequest('This webhook trigger is currently disabled');
        }

        // ── Parse optional POST body ────────────────────────────────────
        let payload: Record<string, unknown> = {};
        try {
            const contentType = req.headers.get('content-type') ?? '';
            if (contentType.includes('application/json')) {
                payload = (await req.json()) as Record<string, unknown>;
            }
        } catch {
            // Non-JSON or empty body — that's fine, proceed with empty payload
        }

        // ── Resolve templates ───────────────────────────────────────────
        const taskTitle = resolveTemplate(triggerRecord.task_title_template);
        let taskDescription = resolveTemplate(triggerRecord.task_description_template);

        // Append webhook payload context if provided
        if (Object.keys(payload).length > 0) {
            const payloadSummary = JSON.stringify(payload, null, 2);
            taskDescription = taskDescription
                ? `${taskDescription}\n\n---\n\n**Webhook Payload:**\n\`\`\`json\n${payloadSummary}\n\`\`\``
                : `**Webhook Payload:**\n\`\`\`json\n${payloadSummary}\n\`\`\``;
        }

        // ── Create the task ─────────────────────────────────────────────
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .insert({
                title: taskTitle,
                description: taskDescription,
                workspace_id: triggerRecord.workspace_id,
                assigned_agent_id: triggerRecord.agent_id,
                status: 'pending',
                priority: 'medium',
                metadata: {
                    source: 'webhook_trigger',
                    trigger_id: triggerRecord.id,
                    webhook_payload: payload,
                },
            })
            .select('id, title, status, created_at')
            .single();

        if (taskError) {
            // Log failure
            await supabase.from('trigger_log').insert({
                trigger_id: triggerRecord.id,
                status: 'failed',
                error: taskError.message,
            });
            return serverError(`Failed to create task: ${taskError.message}`);
        }

        // ── Update trigger last_fired_at ────────────────────────────────
        await supabase
            .from('agent_triggers')
            .update({ last_fired_at: new Date().toISOString() })
            .eq('id', triggerRecord.id);

        // ── Log success ─────────────────────────────────────────────────
        const taskRecord = task as { id: string; title: string; status: string; created_at: string };
        await supabase.from('trigger_log').insert({
            trigger_id: triggerRecord.id,
            task_id: taskRecord.id,
            status: 'fired',
        });

        return ok({
            success: true,
            task_id: taskRecord.id,
            task_title: taskRecord.title,
            task_status: taskRecord.status,
            message: `Task created and queued for agent execution.`,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return serverError(message);
    }
});
