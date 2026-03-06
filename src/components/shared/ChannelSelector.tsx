// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { Send, MessageSquare, Hash, Mail, Radio } from 'lucide-react'
import { useChannels } from '@/hooks/useChannels'
import type { ChannelPlatform } from '@/db/messagingChannels'
import { cn } from '@/lib/utils'

const PLATFORM_ICONS: Record<ChannelPlatform, typeof Send> = {
    telegram: Send,
    discord: MessageSquare,
    slack: Hash,
    email: Mail,
}

const PLATFORM_COLORS: Record<ChannelPlatform, { text: string; bg: string }> = {
    telegram: { text: 'text-sky-400', bg: 'bg-sky-500/10' },
    discord: { text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    slack: { text: 'text-purple-400', bg: 'bg-purple-500/10' },
    email: { text: 'text-amber-400', bg: 'bg-amber-500/10' },
}

interface ChannelSelectorProps {
    /** null = all channels, string[] = specific channel IDs */
    value: string[] | null
    onChange: (value: string[] | null) => void
}

export function ChannelSelector({ value, onChange }: ChannelSelectorProps) {
    const { channels, loading } = useChannels()

    if (loading) return null

    // Don't render if no channels are configured
    if (channels.length === 0) return null

    const isAll = value === null

    const toggleAll = () => {
        if (isAll) {
            // Switch from "all" to explicitly selected (all currently active)
            onChange(channels.map((c) => c.id))
        } else {
            onChange(null)
        }
    }

    const toggleChannel = (channelId: string) => {
        if (isAll) {
            // Switch from "all" to all-except-this-one
            onChange(channels.filter((c) => c.id !== channelId).map((c) => c.id))
        } else {
            const isSelected = value.includes(channelId)
            if (isSelected) {
                onChange(value.filter((id) => id !== channelId))
            } else {
                onChange([...value, channelId])
            }
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Output Channels</label>
                <button
                    type="button"
                    onClick={toggleAll}
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                        isAll
                            ? 'bg-brand-primary/10 text-brand-primary'
                            : 'text-gray-500 hover:text-gray-400',
                    )}
                >
                    <Radio className="h-3 w-3" />
                    {isAll ? 'All channels' : 'Select channels'}
                </button>
            </div>
            <p className="text-xs text-gray-500">
                Choose which messaging channels receive results when this {value === null ? 'agent' : 'agent'} completes a task.
            </p>
            <div className="grid gap-2">
                {channels.map((channel) => {
                    const Icon = PLATFORM_ICONS[channel.platform]
                    const colors = PLATFORM_COLORS[channel.platform]
                    const isSelected = isAll || value.includes(channel.id)

                    return (
                        <button
                            key={channel.id}
                            type="button"
                            onClick={() => toggleChannel(channel.id)}
                            className={cn(
                                'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                                isSelected
                                    ? 'border-gray-600 bg-gray-800/60'
                                    : 'border-gray-700/50 bg-gray-900/30 opacity-50 hover:opacity-75',
                            )}
                        >
                            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', colors.bg)}>
                                <Icon className={cn('h-4 w-4', colors.text)} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-gray-200 truncate">{channel.name}</span>
                                <span className="block text-xs text-gray-500 capitalize">{channel.platform}</span>
                            </div>
                            <div
                                className={cn(
                                    'h-4 w-4 shrink-0 rounded border transition-colors',
                                    isSelected
                                        ? 'border-brand-primary bg-brand-primary'
                                        : 'border-gray-600',
                                )}
                            >
                                {isSelected && (
                                    <svg viewBox="0 0 16 16" className="h-4 w-4 text-black">
                                        <path
                                            d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
