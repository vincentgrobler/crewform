// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

/**
 * Email Channel — Inbound Email Handler
 *
 * Receives inbound emails via email provider webhook (Resend, SendGrid, etc.).
 * Creates a task from the email and routes to the configured agent/team.
 *
 * Setup: Configure email provider's inbound webhook to:
 *   POST {SUPABASE_URL}/functions/v1/channel-email
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ok, badRequest, serverError } from '../_shared/response.ts';

/**
 * Resend inbound email webhook payload
 * See: https://resend.com/docs/dashboard/webhooks/event-types
 */
interface InboundEmail {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

interface ChannelRow {
    id: string;
    workspace_id: string;
    config: Record<string, unknown>;
    default_agent_id: string | null;
    default_team_id: string | null;
}

Deno.serve(async (req: Request) => {
    if (req.method !== 'POST') {
        return ok({ ok: true });
    }

    try {
        const contentType = req.headers.get('content-type') ?? '';
        let email: InboundEmail;

        if (contentType.includes('application/json')) {
            email = (await req.json()) as InboundEmail;
        } else if (contentType.includes('multipart/form-data')) {
            // Some email providers send form data
            const formData = await req.formData();
            email = {
                from: formData.get('from') as string ?? '',
                to: formData.get('to') as string ?? '',
                subject: formData.get('subject') as string ?? '',
                text: formData.get('text') as string ?? undefined,
                html: formData.get('html') as string ?? undefined,
            };
        } else {
            return badRequest('Unsupported content type');
        }

        if (!email.to || !email.from) {
            return badRequest('Missing required from/to fields');
        }

        // Extract the prompt from email body (prefer text over html)
        const body = email.text ?? email.html?.replace(/<[^>]*>/g, '') ?? '';
        const prompt = `${email.subject}\n\n${body}`.trim();

        if (!prompt) {
            return ok({ ok: true, skipped: true, reason: 'empty email body' });
        }

        // Service client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Match to-address against configured channels
        const toAddress = email.to.toLowerCase();
        const { data: channels } = await supabase
            .from('messaging_channels')
            .select('id, workspace_id, config, default_agent_id, default_team_id')
            .eq('platform', 'email')
            .eq('is_active', true);

        const channelRows = (channels ?? []) as ChannelRow[];
        const channel = channelRows.find(c => {
            const inboundAddr = (c.config.inbound_address as string ?? '').toLowerCase();
            return inboundAddr && toAddress.includes(inboundAddr);
        });

        if (!channel) {
            return ok({ ok: true, skipped: true, reason: 'no matching email channel' });
        }

        if (!channel.default_agent_id && !channel.default_team_id) {
            return badRequest('Channel has no default agent or team configured');
        }

        // Resolve workspace owner
        const { data: ws } = await supabase
            .from('workspaces')
            .select('owner_id')
            .eq('id', channel.workspace_id)
            .single();

        const ownerId = (ws as { owner_id: string } | null)?.owner_id;
        if (!ownerId) return serverError('Could not resolve workspace owner');

        const sourceChannel = {
            platform: 'email',
            from_email: email.from,
            subject: email.subject,
            channel_db_id: channel.id,
        };

        let taskOrRunId: string;

        if (channel.default_team_id) {
            const { data: run, error: runErr } = await supabase
                .from('team_runs')
                .insert({
                    team_id: channel.default_team_id,
                    workspace_id: channel.workspace_id,
                    input_task: prompt,
                    created_by: ownerId,
                    status: 'pending',
                    source_channel: sourceChannel,
                })
                .select('id')
                .single();

            if (runErr) return serverError(`Failed: ${runErr.message}`);
            taskOrRunId = (run as { id: string }).id;
        } else {
            const { data: task, error: taskErr } = await supabase
                .from('tasks')
                .insert({
                    title: email.subject || `Email from ${email.from}`,
                    description: body,
                    workspace_id: channel.workspace_id,
                    assigned_agent_id: channel.default_agent_id,
                    created_by: ownerId,
                    status: 'pending',
                    priority: 'medium',
                    source_channel: sourceChannel,
                    metadata: {
                        source: 'messaging_channel',
                        platform: 'email',
                        sender: email.from,
                        channel_id: channel.id,
                    },
                })
                .select('id')
                .single();

            if (taskErr) return serverError(`Failed: ${taskErr.message}`);
            taskOrRunId = (task as { id: string }).id;
        }

        // Log inbound
        await supabase.from('channel_message_log').insert({
            channel_id: channel.id,
            direction: 'inbound',
            task_id: channel.default_team_id ? null : taskOrRunId,
            team_run_id: channel.default_team_id ? taskOrRunId : null,
            message_preview: prompt.substring(0, 200),
            platform_ref: { from: email.from, subject: email.subject },
            status: 'delivered',
        });

        return ok({ ok: true, task_id: taskOrRunId });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[channel-email] Error:', message);
        return serverError(message);
    }
});
