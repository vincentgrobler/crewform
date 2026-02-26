// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import {
    Loader2, Download, Star, Package, Clock, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCreatorStats } from '@/hooks/useMarketplace'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
    pending: { icon: Clock, color: 'text-amber-400 bg-amber-500/10', label: 'Pending Review' },
    approved: { icon: CheckCircle2, color: 'text-green-400 bg-green-500/10', label: 'Approved' },
    rejected: { icon: XCircle, color: 'text-red-400 bg-red-500/10', label: 'Rejected' },
}

/**
 * Creator dashboard showing published agent stats and submission history.
 */
export function CreatorDashboard() {
    const { user } = useAuth()
    const { data: stats, isLoading } = useCreatorStats(user?.id ?? null)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-surface-card p-5">
                    <div className="mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4 text-brand-primary" />
                        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Published</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-100">{stats.publishedCount}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-card p-5">
                    <div className="mb-2 flex items-center gap-2">
                        <Download className="h-4 w-4 text-cyan-400" />
                        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Installs</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-100">{stats.totalInstalls.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-card p-5">
                    <div className="mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Avg. Rating</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-100">
                        {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
                    </p>
                </div>
            </div>

            {/* Submission history */}
            <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Submission History
                </h3>
                {stats.submissions.length === 0 ? (
                    <div className="rounded-xl border border-border bg-surface-card p-8 text-center">
                        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-gray-600" />
                        <p className="text-sm text-gray-400">No submissions yet.</p>
                        <p className="text-xs text-gray-600">Publish an agent from the Agents page to get started.</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-surface-card divide-y divide-border/50">
                        {stats.submissions.map((sub) => {
                            const statusConfig = STATUS_CONFIG[sub.status]
                            const StatusIcon = statusConfig.icon
                            return (
                                <div key={sub.id} className="flex items-center gap-3 px-4 py-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-200">
                                            {sub.agent_name ?? 'Unknown Agent'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Submitted {new Date(sub.created_at).toLocaleDateString()}
                                        </p>
                                        {sub.status === 'rejected' && sub.review_notes && (
                                            <p className="mt-1 text-xs text-red-400">
                                                Reason: {sub.review_notes}
                                            </p>
                                        )}
                                    </div>
                                    <span className={cn(
                                        'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase',
                                        statusConfig.color,
                                    )}>
                                        <StatusIcon className="h-3 w-3" />
                                        {statusConfig.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
