// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState } from 'react'
import {
    Globe, MessageSquare, Send, Hash, Plus, Trash2, Power, PowerOff,
    CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, useWebhookLogs } from '@/hooks/useWebhooks'
import type { OutputRoute, CreateRouteInput } from '@/db/webhooks'
import { cn } from '@/lib/utils'

// ─── Constants ──────────────────────────────────────────────────────────────

type DestinationType = 'http' | 'slack' | 'discord' | 'telegram'

const DESTINATION_META: Record<DestinationType, { label: string; icon: typeof Globe; color: string; bgColor: string }> = {
    http: { label: 'HTTP Webhook', icon: Globe, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    slack: { label: 'Slack', icon: Hash, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    discord: { label: 'Discord', icon: MessageSquare, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10' },
    telegram: { label: 'Telegram', icon: Send, color: 'text-sky-400', bgColor: 'bg-sky-500/10' },
}

const EVENT_OPTIONS = [
    { value: 'task.completed', label: 'Task Completed' },
    { value: 'task.failed', label: 'Task Failed' },
]

// ─── Main Component ─────────────────────────────────────────────────────────

export function WebhooksSettings() {
    const { workspaceId } = useWorkspace()
    const { data: routes, isLoading } = useWebhooks(workspaceId ?? undefined)
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
                    <h2 className="text-lg font-medium text-gray-100">Webhooks</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Get notified when tasks complete or fail.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/80"
                >
                    <Plus className="h-4 w-4" />
                    Add Webhook
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && workspaceId && (
                <CreateWebhookForm
                    workspaceId={workspaceId}
                    onClose={() => setShowCreateForm(false)}
                />
            )}

            {/* Routes List */}
            {routes && routes.length > 0 ? (
                <div className="space-y-3">
                    {routes.map((route) => (
                        <WebhookCard
                            key={route.id}
                            route={route}
                            expandedLogs={expandedLogs}
                            onToggleLogs={(id) =>
                                setExpandedLogs(expandedLogs === id ? null : id)
                            }
                        />
                    ))}
                </div>
            ) : (
                !showCreateForm && (
                    <div className="rounded-lg border border-border bg-surface-card p-8 text-center">
                        <Globe className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                        <h3 className="mb-1 text-lg font-medium text-gray-300">No webhooks configured</h3>
                        <p className="text-sm text-gray-500">
                            Add a webhook to receive notifications via HTTP, Slack, Discord, or Telegram.
                        </p>
                    </div>
                )
            )}
        </div>
    )
}

// ─── Create Webhook Form ────────────────────────────────────────────────────

function CreateWebhookForm({
    workspaceId,
    onClose,
}: {
    workspaceId: string
    onClose: () => void
}) {
    const createMutation = useCreateWebhook()
    const [name, setName] = useState('')
    const [destinationType, setDestinationType] = useState<DestinationType>('http')
    const [events, setEvents] = useState<string[]>(['task.completed', 'task.failed'])
    const [config, setConfig] = useState<Record<string, string>>({})

    function toggleEvent(event: string) {
        setEvents((prev) =>
            prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
        )
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim() || events.length === 0) return

        const input: CreateRouteInput = {
            workspace_id: workspaceId,
            name: name.trim(),
            destination_type: destinationType,
            config,
            events,
        }

        createMutation.mutate(input, {
            onSuccess: () => {
                onClose()
            },
        })
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-border bg-surface-card p-6 space-y-4"
        >
            <h3 className="text-base font-medium text-gray-200">New Webhook</h3>

            {/* Name */}
            <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Production alerts"
                    className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-brand-primary focus:outline-none"
                />
            </div>

            {/* Destination Type */}
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-400">Destination</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(Object.keys(DESTINATION_META) as DestinationType[]).map((type) => {
                        const meta = DESTINATION_META[type]
                        const Icon = meta.icon
                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => {
                                    setDestinationType(type)
                                    setConfig({})
                                }}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                                    destinationType === type
                                        ? `border-brand-primary ${meta.bgColor} ${meta.color}`
                                        : 'border-border text-gray-500 hover:border-gray-600 hover:text-gray-300',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {meta.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Config fields (dynamic by type) */}
            <DestinationConfigFields
                type={destinationType}
                config={config}
                onChange={setConfig}
            />

            {/* Events */}
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-400">Events</label>
                <div className="flex gap-3">
                    {EVENT_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={events.includes(opt.value)}
                                onChange={() => toggleEvent(opt.value)}
                                className="rounded border-border bg-surface-raised accent-brand-primary"
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={createMutation.isPending || !name.trim() || events.length === 0}
                    className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/80 disabled:opacity-50"
                >
                    {createMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Plus className="h-4 w-4" />
                    )}
                    Create Webhook
                </button>
            </div>
        </form>
    )
}

// ─── Destination Config Fields ──────────────────────────────────────────────

function DestinationConfigFields({
    type,
    config,
    onChange,
}: {
    type: DestinationType
    config: Record<string, string>
    onChange: (c: Record<string, string>) => void
}) {
    function updateField(key: string, value: string) {
        onChange({ ...config, [key]: value })
    }

    const inputClass =
        'w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-brand-primary focus:outline-none'

    switch (type) {
        case 'http':
            return (
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-400">URL</label>
                        <input
                            type="url"
                            value={config.url ?? ''}
                            onChange={(e) => updateField('url', e.target.value)}
                            placeholder="https://example.com/webhook"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-400">
                            Secret <span className="text-gray-600">(optional, for HMAC signature)</span>
                        </label>
                        <input
                            type="password"
                            value={config.secret ?? ''}
                            onChange={(e) => updateField('secret', e.target.value)}
                            placeholder="whsec_..."
                            className={inputClass}
                        />
                    </div>
                </div>
            )

        case 'slack':
            return (
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-400">Slack Webhook URL</label>
                    <input
                        type="url"
                        value={config.webhook_url ?? ''}
                        onChange={(e) => updateField('webhook_url', e.target.value)}
                        placeholder="https://hooks.slack.com/services/..."
                        className={inputClass}
                    />
                </div>
            )

        case 'discord':
            return (
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-400">Discord Webhook URL</label>
                    <input
                        type="url"
                        value={config.webhook_url ?? ''}
                        onChange={(e) => updateField('webhook_url', e.target.value)}
                        placeholder="https://discord.com/api/webhooks/..."
                        className={inputClass}
                    />
                </div>
            )

        case 'telegram':
            return (
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-400">Bot Token</label>
                        <input
                            type="password"
                            value={config.bot_token ?? ''}
                            onChange={(e) => updateField('bot_token', e.target.value)}
                            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                            className={inputClass}
                        />
                        <p className="mt-1 text-xs text-gray-600">
                            Get this from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">@BotFather</a>
                        </p>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-400">Chat ID</label>
                        <input
                            type="text"
                            value={config.chat_id ?? ''}
                            onChange={(e) => updateField('chat_id', e.target.value)}
                            placeholder="-1001234567890"
                            className={inputClass}
                        />
                        <p className="mt-1 text-xs text-gray-600">
                            Use <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">@userinfobot</a> to find your chat ID
                        </p>
                    </div>
                </div>
            )
    }
}

// ─── Webhook Card ───────────────────────────────────────────────────────────

function WebhookCard({
    route,
    expandedLogs,
    onToggleLogs,
}: {
    route: OutputRoute
    expandedLogs: string | null
    onToggleLogs: (id: string) => void
}) {
    const { workspaceId } = useWorkspace()
    const updateMutation = useUpdateWebhook()
    const deleteMutation = useDeleteWebhook()
    const meta = DESTINATION_META[route.destination_type]
    const Icon = meta.icon
    const isExpanded = expandedLogs === route.id

    function handleToggleActive() {
        if (!workspaceId) return
        updateMutation.mutate({
            id: route.id,
            data: { is_active: !route.is_active },
            workspaceId,
        })
    }

    function handleDelete() {
        if (!workspaceId) return
        if (!confirm(`Delete webhook "${route.name}"?`)) return
        deleteMutation.mutate({ id: route.id, workspaceId })
    }

    return (
        <div className="rounded-lg border border-border bg-surface-card">
            <div className="flex items-center gap-4 p-4">
                {/* Icon */}
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', meta.bgColor)}>
                    <Icon className={cn('h-5 w-5', meta.color)} />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-200">{route.name}</span>
                        <span className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            route.is_active
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-gray-500/10 text-gray-500',
                        )}>
                            {route.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                        {meta.label} · Events: {route.events.join(', ')}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onToggleLogs(route.id)}
                        title="View delivery logs"
                        className="rounded-lg p-2 text-gray-500 hover:bg-surface-raised hover:text-gray-300"
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={handleToggleActive}
                        title={route.is_active ? 'Disable' : 'Enable'}
                        className="rounded-lg p-2 text-gray-500 hover:bg-surface-raised hover:text-gray-300"
                    >
                        {route.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        title="Delete"
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Logs panel */}
            {isExpanded && <WebhookLogsPanel routeId={route.id} />}
        </div>
    )
}

// ─── Webhook Logs Panel ─────────────────────────────────────────────────────

function WebhookLogsPanel({ routeId }: { routeId: string }) {
    const { data: logs, isLoading } = useWebhookLogs(routeId)

    if (isLoading) {
        return (
            <div className="border-t border-border p-4">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            </div>
        )
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="border-t border-border p-4 text-center text-sm text-gray-500">
                No delivery logs yet.
            </div>
        )
    }

    return (
        <div className="border-t border-border">
            <div className="max-h-60 overflow-y-auto">
                {logs.map((log) => (
                    <div
                        key={log.id}
                        className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5 last:border-b-0"
                    >
                        {log.status === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                        ) : (
                            <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                        )}
                        <span className="min-w-0 flex-1 truncate text-xs text-gray-400">
                            {log.event}
                            {log.status_code && ` · ${log.status_code}`}
                            {log.error && ` · ${log.error}`}
                        </span>
                        <span className="shrink-0 text-xs text-gray-600">
                            {new Date(log.created_at).toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
