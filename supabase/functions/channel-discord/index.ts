// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

/**
 * Discord Channel — Inbound Interaction Handler
 *
 * Receives Discord Interactions (slash commands).
 * Creates a task from the command and routes to the configured agent/team.
 *
 * Setup: Set Discord Interactions Endpoint URL to:
 *   POST {SUPABASE_URL}/functions/v1/channel-discord
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ok, serverError } from '../_shared/response.ts';

// Discord interaction types
const INTERACTION_PING = 1;
const INTERACTION_APPLICATION_COMMAND = 2;

interface DiscordInteraction {
    type: number;
    id: string;
    token: string;
    guild_id?: string;
    channel_id?: string;
    member?: {
        user?: { id: string; username: string; discriminator: string };
    };
    user?: { id: string; username: string; discriminator: string };
    data?: {
        name: string;
        options?: Array<{ name: string; type: number; value: string }>;
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
        const interaction = (await req.json()) as DiscordInteraction;

        // Handle Discord's verification ping
        if (interaction.type === INTERACTION_PING) {
            return new Response(JSON.stringify({ type: 1 }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Only handle application commands (slash commands)
        if (interaction.type !== INTERACTION_APPLICATION_COMMAND) {
            return ok({ type: 1 });
        }

        // Extract the prompt from /ask command
        if (interaction.data?.name !== 'ask') {
            return new Response(
                JSON.stringify({
                    type: 4,
                    data: { content: '❌ Unknown command. Use `/ask <your prompt>` to send a request.' },
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            );
        }

        const prompt = interaction.data.options?.find(o => o.name === 'prompt')?.value;
        if (!prompt) {
            return new Response(
                JSON.stringify({
                    type: 4,
                    data: { content: '❌ Please provide a prompt: `/ask <your prompt>`' },
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            );
        }

        const channelId = interaction.channel_id;
        const guildId = interaction.guild_id;
        const userName = interaction.member?.user?.username ?? interaction.user?.username ?? 'Unknown';

        // Service client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Find matching channel
        const { data: channels } = await supabase
            .from('messaging_channels')
            .select('id, workspace_id, config, default_agent_id, default_team_id')
            .eq('platform', 'discord')
            .eq('is_active', true);

        const channelRows = (channels ?? []) as ChannelRow[];
        const channel = channelRows.find(c =>
            String(c.config.guild_id) === guildId ||
            String(c.config.channel_id) === channelId,
        );

        if (!channel || (!channel.default_agent_id && !channel.default_team_id)) {
            return new Response(
                JSON.stringify({
                    type: 4,
                    data: { content: '❌ No agent or team configured for this channel.' },
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            );
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
            platform: 'discord',
            channel_id: channelId,
            guild_id: guildId,
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
                    title: `Discord: ${prompt.substring(0, 80)}`,
                    description: prompt,
                    workspace_id: channel.workspace_id,
                    assigned_agent_id: channel.default_agent_id,
                    created_by: ownerId,
                    status: 'pending',
                    priority: 'medium',
                    source_channel: sourceChannel,
                    metadata: {
                        source: 'messaging_channel',
                        platform: 'discord',
                        sender: userName,
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
            platform_ref: { interaction_id: interaction.id, channel_id: channelId },
            status: 'delivered',
        });

        // Respond to Discord immediately (deferred → follow-up will come from task runner)
        return new Response(
            JSON.stringify({
                type: 4,
                data: {
                    content: `⏳ Processing your request...\n> ${prompt.substring(0, 200)}`,
                },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[channel-discord] Error:', message);
        return serverError(message);
    }
});
