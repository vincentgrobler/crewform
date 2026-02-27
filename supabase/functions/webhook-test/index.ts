// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

/**
 * Webhook Test Edge Function
 *
 * Sends a test payload to a configured output route to verify it is working.
 * Called from the frontend "Send Test" button.
 *
 * Auth: Supabase JWT (user must own the workspace).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { ok, badRequest, notFound, unauthorized, serverError, methodNotAllowed } from '../_shared/response.ts';

// ─── Types ──────────────────────────────────────────────────────────────────

interface OutputRoute {
    id: string;
    workspace_id: string;
    name: string;
    destination_type: string;
    config: Record<string, unknown>;
    events: string[];
    is_active: boolean;
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
    const cors = handleCors(req);
    if (cors) return cors;

    if (req.method !== 'POST') {
        return methodNotAllowed();
    }

    try {
        // ── Auth ────────────────────────────────────────────────────────
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return unauthorized('Missing Authorization header');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        // Verify user JWT
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: authError } = await userClient.auth.getUser();
        if (authError || !user) {
            return unauthorized('Invalid token');
        }

        // ── Parse body ──────────────────────────────────────────────────
        const body = (await req.json()) as { route_id?: string };
        if (!body.route_id) {
            return badRequest('Missing route_id');
        }

        // ── Fetch route (service role to bypass RLS for validation) ──────
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

        const { data: route, error: routeError } = await serviceClient
            .from('output_routes')
            .select('*')
            .eq('id', body.route_id)
            .single();

        if (routeError || !route) {
            return notFound('Output route');
        }

        const routeRecord = route as OutputRoute;

        // ── Verify user owns the workspace ──────────────────────────────
        const { data: workspace, error: wsError } = await serviceClient
            .from('workspaces')
            .select('owner_id')
            .eq('id', routeRecord.workspace_id)
            .single();

        if (wsError || !workspace) {
            return notFound('Workspace');
        }

        const ownerId = (workspace as { owner_id: string }).owner_id;
        if (ownerId !== user.id) {
            return unauthorized('You do not own this workspace');
        }

        // ── Build test payload ──────────────────────────────────────────
        const testPayload = {
            event: 'webhook.test',
            task_id: null,
            team_run_id: null,
            task_title: 'Test Webhook Delivery',
            agent_name: 'CrewForm Test',
            status: 'test',
            result_preview: 'This is a test payload from CrewForm to verify your webhook endpoint is working correctly.',
            error: null,
            timestamp: new Date().toISOString(),
        };

        // ── Deliver based on destination type ───────────────────────────
        let url: string;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        switch (routeRecord.destination_type) {
            case 'http':
                url = routeRecord.config.url as string;
                break;
            case 'slack':
            case 'discord':
            case 'teams':
                url = routeRecord.config.webhook_url as string;
                break;
            case 'telegram': {
                const botToken = routeRecord.config.bot_token as string;
                const chatId = routeRecord.config.chat_id as string;
                url = `https://api.telegram.org/bot${botToken}/sendMessage`;
                const resp = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: '✅ *CrewForm Webhook Test*\n\nThis is a test message to verify your Telegram webhook is working correctly.',
                        parse_mode: 'MarkdownV2',
                    }),
                    signal: AbortSignal.timeout(10000),
                });
                return ok({ ok: resp.ok, status_code: resp.status });
            }
            default:
                return badRequest(`Unsupported destination type: ${routeRecord.destination_type}`);
        }

        if (!url) {
            return badRequest('Destination URL not configured');
        }

        const resp = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(testPayload),
            signal: AbortSignal.timeout(10000),
        });

        return ok({ ok: resp.ok, status_code: resp.status });

    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return serverError(message);
    }
});
