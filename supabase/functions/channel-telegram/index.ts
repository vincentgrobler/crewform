// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

/**
 * Telegram Channel — Inbound Message Handler
 *
 * Receives Telegram Bot webhook updates.
 * Creates a task from the message and routes it to the configured agent/team.
 *
 * Setup: Set Telegram webhook URL to:
 *   POST {SUPABASE_URL}/functions/v1/channel-telegram
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ok, badRequest, serverError } from '../_shared/response.ts';

interface TelegramUpdate {
    update_id: number;
    message?: {
        message_id: number;
        from?: { id: number; first_name: string; last_name?: string; username?: string };
        chat: { id: number; type: string; title?: string };
        date: number;
        text?: string;
    };
}

interface ChannelRow {
    id: string;
    workspace_id: string;
    platform: string;
    config: { bot_token: string };
    default_agent_id: string | null;
    default_team_id: string | null;
    is_active: boolean;
}

Deno.serve(async (req: Request) => {
    if (req.method !== 'POST') {
        return new Response('OK', { status: 200 });
    }

    try {
        const update = (await req.json()) as TelegramUpdate;

        // Only handle text messages
        if (!update.message?.text) {
            return ok({ ok: true, skipped: true });
        }

        const msg = update.message;
        const chatId = String(msg.chat.id);
        const messageText = msg.text;
        const senderName = msg.from
            ? `${msg.from.first_name}${msg.from.last_name ? ` ${msg.from.last_name}` : ''}`
            : 'Unknown';

        // Ignore bot commands that aren't /ask
        if (messageText.startsWith('/') && !messageText.startsWith('/ask')) {
            return ok({ ok: true, skipped: true });
        }

        // Strip /ask prefix if present
        const prompt = messageText.startsWith('/ask ')
            ? messageText.substring(5).trim()
            : messageText;

        if (!prompt) {
            return ok({ ok: true, skipped: true, reason: 'empty prompt' });
        }

        // Service client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Find a matching channel by looking up all active telegram channels
        // and matching by chat_id in config (bot_token isn't in the webhook payload)
        const { data: channels, error: chErr } = await supabase
            .from('messaging_channels')
            .select('id, workspace_id, config, default_agent_id, default_team_id, is_active')
            .eq('platform', 'telegram')
            .eq('is_active', true);

        if (chErr || !channels || channels.length === 0) {
            return ok({ ok: true, skipped: true, reason: 'no matching channel' });
        }

        // Match by chat_id in config
        const channelRows = channels as ChannelRow[];
        const channel = channelRows.find(c => {
            const cfg = c.config as Record<string, unknown>;
            return String(cfg.chat_id) === chatId;
        });

        if (!channel) {
            return ok({ ok: true, skipped: true, reason: 'no matching chat_id' });
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
            platform: 'telegram',
            chat_id: chatId,
            message_id: String(msg.message_id),
            bot_token: (channel.config as Record<string, unknown>).bot_token as string,
            channel_db_id: channel.id,
        };

        let taskOrRunId: string;

        if (channel.default_team_id) {
            // Create team run
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

            if (runErr) return serverError(`Failed to create team run: ${runErr.message}`);
            taskOrRunId = (run as { id: string }).id;
        } else {
            // Create task
            const { data: task, error: taskErr } = await supabase
                .from('tasks')
                .insert({
                    title: `Telegram: ${prompt.substring(0, 80)}`,
                    description: prompt,
                    workspace_id: channel.workspace_id,
                    assigned_agent_id: channel.default_agent_id,
                    created_by: ownerId,
                    status: 'pending',
                    priority: 'medium',
                    source_channel: sourceChannel,
                    metadata: {
                        source: 'messaging_channel',
                        platform: 'telegram',
                        sender: senderName,
                        channel_id: channel.id,
                    },
                })
                .select('id')
                .single();

            if (taskErr) return serverError(`Failed to create task: ${taskErr.message}`);
            taskOrRunId = (task as { id: string }).id;
        }

        // Log inbound message
        await supabase.from('channel_message_log').insert({
            channel_id: channel.id,
            direction: 'inbound',
            task_id: channel.default_team_id ? null : taskOrRunId,
            team_run_id: channel.default_team_id ? taskOrRunId : null,
            message_preview: prompt.substring(0, 200),
            platform_ref: { message_id: msg.message_id, chat_id: chatId },
            status: 'delivered',
        });

        // Send "processing" indicator
        const botToken = (channel.config as Record<string, unknown>).bot_token as string;
        await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
        });

        return ok({ ok: true, task_id: taskOrRunId });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[channel-telegram] Error:', message);
        return serverError(message);
    }
});
