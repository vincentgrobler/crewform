// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { X, Star, Download, Bot, Cpu, Tag, FileText, Lock } from 'lucide-react'
import type { Agent } from '@/types'

interface AgentDetailModalProps {
    agent: Agent | null
    onClose: () => void
    onInstall?: (agent: Agent) => void
    isInstalling?: boolean
}

export function AgentDetailModal({ agent, onClose, onInstall, isInstalling }: AgentDetailModalProps) {
    if (!agent) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-surface-card shadow-2xl">
                {/* Close button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-overlay hover:text-gray-200"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="border-b border-border p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-primary/10">
                            <Bot className="h-7 w-7 text-brand-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-gray-100">{agent.name}</h2>
                            <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Cpu className="h-3.5 w-3.5" />
                                    {agent.provider} · {agent.model}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 flex items-center gap-6 text-sm">
                        <span className="flex items-center gap-1.5 text-gray-300">
                            <Download className="h-4 w-4 text-gray-500" />
                            <strong>{agent.install_count.toLocaleString()}</strong> installs
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-300">
                            <Star className="h-4 w-4 text-amber-400" />
                            <strong>{agent.rating_avg.toFixed(1)}</strong> rating
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Description */}
                    <section>
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                            <FileText className="h-4 w-4" />
                            Description
                        </h3>
                        <p className="text-sm leading-relaxed text-gray-300">{agent.description}</p>
                    </section>

                    {/* System Prompt Preview */}
                    <section>
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                            <Bot className="h-4 w-4" />
                            System Prompt
                        </h3>
                        {agent.price_cents && agent.price_cents > 0 ? (
                            <div className="rounded-lg border border-dashed border-surface-border bg-surface-overlay p-6 text-center">
                                <Lock className="mx-auto mb-2 h-6 w-6 text-gray-500" />
                                <p className="text-sm font-medium text-gray-300">Prompt Hidden</p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Purchase this agent to view its system prompt
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-lg bg-surface-overlay p-4 text-sm leading-relaxed text-gray-300 font-mono">
                                {agent.system_prompt}
                            </div>
                        )}
                    </section>

                    {/* Tags */}
                    {agent.marketplace_tags.length > 0 && (
                        <section>
                            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                                <Tag className="h-4 w-4" />
                                Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {agent.marketplace_tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-surface-overlay px-3 py-1 text-xs font-medium text-gray-400"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Details grid */}
                    <section>
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                            Details
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-surface-overlay p-3">
                                <p className="text-xs text-gray-500">Model</p>
                                <p className="text-sm font-medium text-gray-200">{agent.model}</p>
                            </div>
                            <div className="rounded-lg bg-surface-overlay p-3">
                                <p className="text-xs text-gray-500">Provider</p>
                                <p className="text-sm font-medium text-gray-200">{agent.provider ?? 'Unknown'}</p>
                            </div>
                            <div className="rounded-lg bg-surface-overlay p-3">
                                <p className="text-xs text-gray-500">Temperature</p>
                                <p className="text-sm font-medium text-gray-200">{agent.temperature}</p>
                            </div>
                            <div className="rounded-lg bg-surface-overlay p-3">
                                <p className="text-xs text-gray-500">Tools</p>
                                <p className="text-sm font-medium text-gray-200">
                                    {agent.tools.length > 0 ? agent.tools.join(', ') : 'None'}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="border-t border-border p-6">
                    <button
                        type="button"
                        onClick={() => onInstall?.(agent)}
                        disabled={isInstalling}
                        className="w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="mr-2 inline h-4 w-4" />
                        {isInstalling ? 'Installing...' : 'Install Agent'}
                    </button>
                </div>
            </div>
        </div>
    )
}
