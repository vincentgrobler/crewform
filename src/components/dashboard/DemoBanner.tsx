// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState } from 'react'
import { Bot, Users, Sparkles, Trash2, Loader2, AlertTriangle, X, Key } from 'lucide-react'
import { useDemoWorkspace } from '@/hooks/useDemoWorkspace'
import { useNavigate } from 'react-router-dom'

/**
 * Dashboard banner for activating or removing the demo workspace.
 *
 * Two states:
 * - Not seeded: CTA card to activate demo (5 agents + 1 pipeline team)
 * - Seeded: Subtle banner showing demo is active + remove button
 */
export function DemoBanner() {
    const {
        isDemoSeeded,
        isDemoDismissed,
        seedDemo,
        removeDemo,
        isSeeding,
        isRemoving,
    } = useDemoWorkspace()
    const navigate = useNavigate()

    const [showConfirmRemove, setShowConfirmRemove] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dismissed, setDismissed] = useState(isDemoDismissed)

    if (dismissed && !isDemoSeeded) return null

    const handleSeed = async () => {
        setError(null)
        try {
            await seedDemo()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to seed demo workspace')
        }
    }

    const handleRemove = async () => {
        setError(null)
        try {
            await removeDemo()
            setShowConfirmRemove(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove demo data')
        }
    }

    // ─── Seeded state: subtle info banner ────────────────────────────────────
    if (isDemoSeeded) {
        return (
            <div className="mb-6">
                {/* Remove confirmation dialog */}
                {showConfirmRemove && (
                    <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-200">Remove all demo data?</p>
                                <p className="mt-1 text-xs text-gray-400">
                                    This will permanently delete 5 demo agents and the Content Research Pipeline team.
                                    Your own agents and data will not be affected.
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => void handleRemove()}
                                        disabled={isRemoving}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
                                    >
                                        {isRemoving ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3 w-3" />
                                        )}
                                        {isRemoving ? 'Removing…' : 'Yes, remove demo data'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmRemove(false)}
                                        disabled={isRemoving}
                                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-gray-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active demo banner */}
                <div className="flex items-center justify-between rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-5 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10">
                            <Sparkles className="h-4 w-4 text-brand-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-200">Demo workspace active</p>
                            <p className="text-xs text-gray-500">
                                5 demo agents + 1 pipeline team loaded.{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/agents')}
                                    className="text-brand-primary hover:underline"
                                >
                                    View agents →
                                </button>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowConfirmRemove(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-red-500/30 hover:text-red-400"
                    >
                        <Trash2 className="h-3 w-3" />
                        Remove Demo
                    </button>
                </div>

                {error && (
                    <p className="mt-2 text-xs text-red-400">{error}</p>
                )}
            </div>
        )
    }

    // ─── Not seeded: activation CTA ─────────────────────────────────────────
    return (
        <div className="relative mb-6 overflow-hidden rounded-xl border border-border bg-surface-card">
            {/* Dismiss button */}
            <button
                type="button"
                onClick={() => setDismissed(true)}
                className="absolute right-3 top-3 rounded-lg p-1 text-gray-600 transition-colors hover:text-gray-400"
                title="Dismiss"
            >
                <X className="h-4 w-4" />
            </button>

            {/* Subtle glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-brand-primary/5 blur-3xl" />

            <div className="relative p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 ring-1 ring-brand-primary/20">
                        <Sparkles className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-100">
                            Try CrewForm with demo agents
                        </h3>
                        <p className="mt-1 text-sm text-gray-400 leading-relaxed">
                            Populate your workspace with 5 pre-configured agents and a pipeline team
                            to see what CrewForm can do. You'll still need to{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/settings')}
                                className="inline-flex items-center gap-1 text-brand-primary hover:underline"
                            >
                                <Key className="h-3 w-3" />
                                add your own LLM API key
                            </button>
                            {' '}to run tasks.
                        </p>

                        {/* What you get */}
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-gray-900/50 px-3 py-2">
                                <Bot className="h-4 w-4 text-blue-400" />
                                <div>
                                    <p className="text-xs font-medium text-gray-300">5 AI Agents</p>
                                    <p className="text-[11px] text-gray-500">Research, Write, Code Review, Data, Email</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-gray-900/50 px-3 py-2">
                                <Users className="h-4 w-4 text-green-400" />
                                <div>
                                    <p className="text-xs font-medium text-gray-300">1 Pipeline Team</p>
                                    <p className="text-[11px] text-gray-500">Research → Write → Email</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => void handleSeed()}
                                disabled={isSeeding}
                                className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-gray-950 transition-all hover:brightness-110 disabled:opacity-50"
                            >
                                {isSeeding ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                {isSeeding ? 'Setting up…' : 'Activate Demo Workspace'}
                            </button>
                            <span className="text-xs text-gray-600">
                                One-click removable anytime
                            </span>
                        </div>

                        {error && (
                            <p className="mt-2 text-xs text-red-400">{error}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
