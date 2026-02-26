// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState } from 'react'
import {
    Loader2, CheckCircle2, XCircle, ShieldCheck, ShieldAlert, PackageOpen,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePendingSubmissions, useApproveSubmission, useRejectSubmission } from '@/hooks/useMarketplace'
import { cn } from '@/lib/utils'

/**
 * Admin review queue for marketplace agent submissions.
 */
export function ReviewQueue() {
    const { user } = useAuth()
    const { data: submissions, isLoading } = usePendingSubmissions()
    const approveMutation = useApproveSubmission()
    const rejectMutation = useRejectSubmission()
    const [rejectingId, setRejectingId] = useState<string | null>(null)
    const [rejectNotes, setRejectNotes] = useState('')

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
        )
    }

    if (!submissions || submissions.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-surface-card p-8 text-center">
                <PackageOpen className="mx-auto mb-2 h-10 w-10 text-gray-600" />
                <h3 className="mb-1 text-lg font-medium text-gray-300">No pending submissions</h3>
                <p className="text-sm text-gray-500">All marketplace submissions have been reviewed.</p>
            </div>
        )
    }

    const handleApprove = (id: string) => {
        if (!user) return
        approveMutation.mutate({ id, reviewerId: user.id })
    }

    const handleReject = (id: string) => {
        if (!user || !rejectNotes.trim()) return
        rejectMutation.mutate(
            { id, reviewerId: user.id, notes: rejectNotes },
            {
                onSuccess: () => {
                    setRejectingId(null)
                    setRejectNotes('')
                },
            },
        )
    }

    return (
        <div className="space-y-4">
            <p className="text-xs text-gray-500">
                {submissions.length} pending submission{submissions.length !== 1 ? 's' : ''}
            </p>

            {submissions.map((sub) => {
                const scan = sub.injection_scan_result
                const isRejecting = rejectingId === sub.id
                const isBusy = approveMutation.isPending || rejectMutation.isPending

                return (
                    <div key={sub.id} className="rounded-xl border border-border bg-surface-card p-4">
                        {/* Agent info */}
                        <div className="mb-3">
                            <p className="text-sm font-medium text-gray-200">
                                {sub.agent_name ?? 'Unknown Agent'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {sub.agent_description ?? 'No description'}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-600">
                                Submitted {new Date(sub.created_at).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Injection scan result */}
                        <div className={cn(
                            'mb-3 flex items-start gap-2 rounded-lg border px-3 py-2',
                            scan.safe
                                ? 'border-green-500/20 bg-green-500/5'
                                : 'border-red-500/20 bg-red-500/5',
                        )}>
                            {scan.safe ? (
                                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                            ) : (
                                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                            )}
                            <div className="flex-1">
                                <p className={cn(
                                    'text-xs font-medium',
                                    scan.safe ? 'text-green-300' : 'text-red-300',
                                )}>
                                    {scan.safe ? 'Scan passed' : 'Flagged'}
                                </p>
                                {scan.flags.length > 0 && (
                                    <ul className="mt-0.5">
                                        {scan.flags.map((flag) => (
                                            <li key={flag} className="text-[10px] text-red-400">• {flag}</li>
                                        ))}
                                    </ul>
                                )}
                                {scan.aiScan && (
                                    <div className="mt-1.5 border-t border-border/50 pt-1.5">
                                        <p className="text-[10px] font-medium text-gray-400">
                                            AI Scan ({Math.round(scan.aiScan.confidence * 100)}% confidence)
                                            {' — '}
                                            <span className={scan.aiScan.safe ? 'text-green-400' : 'text-red-400'}>
                                                {scan.aiScan.safe ? 'Safe' : 'Flagged'}
                                            </span>
                                        </p>
                                        <p className="text-[10px] text-gray-500">{scan.aiScan.reasoning}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Reject notes form */}
                        {isRejecting && (
                            <div className="mb-3">
                                <textarea
                                    value={rejectNotes}
                                    onChange={(e) => setRejectNotes(e.target.value)}
                                    placeholder="Reason for rejection..."
                                    rows={2}
                                    className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-gray-200 outline-none focus:border-red-400"
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleApprove(sub.id)}
                                disabled={isBusy || isRejecting}
                                className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
                            >
                                {approveMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-3 w-3" />
                                )}
                                Approve
                            </button>

                            {isRejecting ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleReject(sub.id)}
                                        disabled={isBusy || !rejectNotes.trim()}
                                        className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                                    >
                                        {rejectMutation.isPending ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <XCircle className="h-3 w-3" />
                                        )}
                                        Confirm Reject
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setRejectingId(null); setRejectNotes('') }}
                                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setRejectingId(sub.id)}
                                    disabled={isBusy}
                                    className="flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                                >
                                    <XCircle className="h-3 w-3" />
                                    Reject
                                </button>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
