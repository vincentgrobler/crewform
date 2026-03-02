// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState } from 'react'
import {
    Send, MessageSquare, Hash, Mail, Plus, Trash2, Power, PowerOff,
    Loader2, ChevronDown, ChevronUp, ExternalLink, ArrowDownLeft, ArrowUpRight,
} from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
    useMessagingChannels,
    useCreateChannel,
    useUpdateChannel,
    useDeleteChannel,
    useChannelLogs,
} from '@/hooks/useMessagingChannels'
import type { ChannelPlatform, CreateChannelInput } from '@/db/messagingChannels'
import { cn } from '@/lib/utils'

// ─── Constants ──────────────────────────────────────────────────────────────

const PLATFORM_META: Record<ChannelPlatform, {
    label: string
    icon: typeof Send
    color: string
    bgColor: string
    setupGuide: string
    configFields: { key: string; label: string; type: 'text' | 'password'; placeholder: string; required: boolean }[]
}> = {
    telegram: {
        label: 'Telegram',
        icon: Send,
        color: 'text-sky-400',
        bgColor: 'bg-sky-500/10',
        setupGuide: 'https://core.telegram.org/bots#botfather',
        configFields: [
            { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: '123456:ABC-DEF...', required: true },
            { key: 'chat_id', label: 'Chat ID', type: 'text', placeholder: '-100123456789', required: true },
        ],
    },
    discord: {
        label: 'Discord',
        icon: MessageSquare,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10',
        setupGuide: 'https://discord.com/developers/applications',
        configFields: [
            { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: 'MTIz...', required: true },
            { key: 'guild_id', label: 'Server (Guild) ID', type: 'text', placeholder: '123456789012345678', required: true },
            { key: 'channel_id', label: 'Channel ID', type: 'text', placeholder: '123456789012345678', required: false },
        ],
    },
    slack: {
        label: 'Slack',
        icon: Hash,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        setupGuide: 'https://api.slack.com/apps',
        configFields: [
            { key: 'bot_token', label: 'Bot Token (xoxb-...)', type: 'password', placeholder: 'xoxb-...', required: true },
            { key: 'signing_secret', label: 'Signing Secret', type: 'password', placeholder: 'abc123...', required: true },
            { key: 'channel_id', label: 'Channel ID', type: 'text', placeholder: 'C0123456789', required: true },
        ],
    },
    email: {
        label: 'Email',
        icon: Mail,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        setupGuide: 'https://resend.com/docs/dashboard/webhooks/introduction',
        configFields: [
            { key: 'inbound_address', label: 'Inbound Email Address', type: 'text', placeholder: 'agent@inbound.crewform.tech', required: true },
        ],
    },
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function MessagingChannelsSettings() {
    const { workspaceId } = useWorkspace()
    const { data: channels, isLoading } = useMessagingChannels(workspaceId ?? undefined)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [expandedLogs, setExpandedLogs] = useState<string | null>(null)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium text-gray-100">Messaging Channels</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Send messages from Telegram, Discord, Slack, or Email to trigger your agents.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    Add Channel
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && workspaceId && (
                <CreateChannelForm
                    workspaceId={workspaceId}
                    onClose={() => setShowCreateForm(false)}
                />
            )}

            {/* Channel List */}
            {!channels || channels.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-700 p-8 text-center">
                    <MessageSquare className="mx-auto mb-3 h-8 w-8 text-gray-600" />
                    <p className="text-sm text-gray-500">
                        No messaging channels configured yet.
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                        Connect a platform to start sending prompts to your agents from any messaging app.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {channels.map(channel => (
                        <ChannelCard
                            key={channel.id}
                            channel={channel}
                            isExpanded={expandedLogs === channel.id}
                            onToggleLogs={() => setExpandedLogs(expandedLogs === channel.id ? null : channel.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Create Form ────────────────────────────────────────────────────────────

function CreateChannelForm({ workspaceId, onClose }: { workspaceId: string; onClose: () => void }) {
    const [platform, setPlatform] = useState<ChannelPlatform>('telegram')
    const [name, setName] = useState('')
    const [config, setConfig] = useState<Record<string, string>>({})
    const createChannel = useCreateChannel()

    const meta = PLATFORM_META[platform]

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const input: CreateChannelInput = {
            workspace_id: workspaceId,
            platform,
            name: name || `${meta.label} Channel`,
            config,
        }
        createChannel.mutate(input, {
            onSuccess: () => { onClose() },
        })
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-700 bg-gray-800/50 p-5 space-y-4"
        >
            <h3 className="text-sm font-medium text-gray-200">New Messaging Channel</h3>

            {/* Platform selector */}
            <div className="grid grid-cols-4 gap-2">
                {(Object.keys(PLATFORM_META) as ChannelPlatform[]).map(p => {
                    const m = PLATFORM_META[p]
                    const Icon = m.icon
                    return (
                        <button
                            key={p}
                            type="button"
                            onClick={() => { setPlatform(p); setConfig({}) }}
                            className={cn(
                                'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors',
                                platform === p
                                    ? `border-gray-500 ${m.bgColor} ${m.color}`
                                    : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400',
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {m.label}
                        </button>
                    )
                })}
            </div>

            {/* Name */}
            <div>
                <label className="mb-1 block text-xs text-gray-400">Channel Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={`My ${meta.label} Channel`}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-brand-primary focus:outline-none"
                />
            </div>

            {/* Platform-specific config fields */}
            {meta.configFields.map(field => (
                <div key={field.key}>
                    <label className="mb-1 block text-xs text-gray-400">{field.label}</label>
                    <input
                        type={field.type}
                        value={config[field.key] ?? ''}
                        onChange={e => setConfig({ ...config, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-brand-primary focus:outline-none"
                    />
                </div>
            ))}

            {/* Setup guide link */}
            <a
                href={meta.setupGuide}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-brand-primary hover:underline"
            >
                <ExternalLink className="h-3 w-3" />
                How to set up a {meta.label} bot
            </a>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 hover:border-gray-600"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={createChannel.isPending}
                    className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
                >
                    {createChannel.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                    Create Channel
                </button>
            </div>
        </form>
    )
}

// ─── Channel Card ───────────────────────────────────────────────────────────

function ChannelCard({
    channel,
    isExpanded,
    onToggleLogs,
}: {
    channel: { id: string; platform: ChannelPlatform; name: string; is_active: boolean; created_at: string }
    isExpanded: boolean
    onToggleLogs: () => void
}) {
    const { workspaceId } = useWorkspace()
    const updateChannel = useUpdateChannel(workspaceId ?? undefined)
    const deleteChannelMut = useDeleteChannel(workspaceId ?? undefined)
    const { data: logs } = useChannelLogs(isExpanded ? channel.id : undefined)

    const meta = PLATFORM_META[channel.platform]
    const Icon = meta.icon

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-800/30 overflow-hidden">
            <div className="flex items-center gap-3 p-4">
                {/* Icon */}
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', meta.bgColor)}>
                    <Icon className={cn('h-4 w-4', meta.color)} />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-200 truncate">{channel.name}</span>
                        <span className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-medium',
                            channel.is_active
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-gray-700 text-gray-500',
                        )}>
                            {channel.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500">{meta.label}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => updateChannel.mutate({ id: channel.id, input: { is_active: !channel.is_active } })}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-700 hover:text-gray-300"
                        title={channel.is_active ? 'Disable' : 'Enable'}
                    >
                        {channel.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={onToggleLogs}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-700 hover:text-gray-300"
                        title="Message Log"
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (confirm('Delete this messaging channel?')) {
                                deleteChannelMut.mutate(channel.id)
                            }
                        }}
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Message Log */}
            {isExpanded && (
                <div className="border-t border-gray-700 bg-gray-900/30 p-4">
                    <h4 className="mb-2 text-xs font-medium text-gray-400">Recent Messages</h4>
                    {!logs || logs.length === 0 ? (
                        <p className="text-xs text-gray-600">No messages yet.</p>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {logs.map(log => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-2 rounded-lg bg-gray-800/50 p-2.5 text-xs"
                                >
                                    {log.direction === 'inbound' ? (
                                        <ArrowDownLeft className="mt-0.5 h-3 w-3 shrink-0 text-blue-400" />
                                    ) : (
                                        <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-gray-300 truncate">{log.message_preview ?? '—'}</p>
                                        {log.error && (
                                            <p className="mt-0.5 text-red-400 truncate">{log.error}</p>
                                        )}
                                    </div>
                                    <span className="shrink-0 text-gray-600">
                                        {new Date(log.created_at).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
