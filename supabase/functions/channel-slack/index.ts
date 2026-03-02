// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

/**
 * Slack Channel — Inbound Events Handler
 *
 * Receives Slack Events API payloads (message events).
 * Creates a task from the message and routes to the configured agent/team.
 *
 * Setup: Configure Slack App Event Subscriptions Request URL to:
 *   POST {SUPABASE_URL}/functions/v1/channel-slack
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ok, serverError } from '../_shared/response.ts';

interface SlackEventPayload {
    type: string;
    token?: string;
    challenge?: string;
    team_id?: string;
    event?: {
        type: string;
        channel: string;
        user: string;
        text: string;
        ts: string;
        thread_ts?: string;
        bot_id?: string;
    };
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
        return new Response('OK', { status: 200 });
    }

    try {
        const payload = (await req.json()) as SlackEventPayload;

        // Handle Slack's URL verification challenge
        if (payload.type === 'url_verification') {
            return new Response(
                JSON.stringify({ challenge: payload.challenge }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // Only handle event_callback with message events
        if (payload.type !== 'event_callback' || !payload.event) {
            return ok({ ok: true });
        }

        const event = payload.event;

        // Ignore bot messages (prevent loops)
        if (event.bot_id || event.type !== 'message') {
            return ok({ ok: true, skipped: true });
        }

        const prompt = event.text?.trim();
        if (!prompt) {
            return ok({ ok: true, skipped: true });
        }

        // Service client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Find matching channel
        const { data: channels } = await supabase
            .from('messaging_channels')
            .select('id, workspace_id, config, default_agent_id, default_team_id')
            .eq('platform', 'slack')
            .eq('is_active', true);

        const channelRows = (channels ?? []) as ChannelRow[];
        const channel = channelRows.find(c =>
            String(c.config.channel_id) === event.channel,
        );

        if (!channel || (!channel.default_agent_id && !channel.default_team_id)) {
            return ok({ ok: true, skipped: true, reason: 'no matching channel' });
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
            platform: 'slack',
            channel_id: event.channel,
            thread_ts: event.thread_ts ?? event.ts, // Reply in thread
            bot_token: channel.config.bot_token as string,
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
                    title: `Slack: ${prompt.substring(0, 80)}`,
                    description: prompt,
                    workspace_id: channel.workspace_id,
                    assigned_agent_id: channel.default_agent_id,
                    created_by: ownerId,
                    status: 'pending',
                    priority: 'medium',
                    source_channel: sourceChannel,
                    metadata: {
                        source: 'messaging_channel',
                        platform: 'slack',
                        sender: event.user,
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
            platform_ref: { ts: event.ts, channel: event.channel },
            status: 'delivered',
        });

        // Send a "processing" reaction
        const botToken = channel.config.bot_token as string;
        await fetch('https://slack.com/api/reactions.add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${botToken}`,
            },
            body: JSON.stringify({
                channel: event.channel,
                name: 'hourglass_flowing_sand',
                timestamp: event.ts,
            }),
        });

        return ok({ ok: true, task_id: taskOrRunId });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[channel-slack] Error:', message);
        return serverError(message);
    }
});
