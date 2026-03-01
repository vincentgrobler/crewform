// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState } from 'react'
import {
    ScrollText, Loader2, UserPlus, UserMinus, ShieldCheck,
    Settings2, Bot, ListTodo, GitBranch, Play,
    CheckCircle2, XCircle, Download,
} from 'lucide-react'
import { useAuditLog } from '@/hooks/useMembers'
import type { AuditLogEntry } from '@/db/members'
import { useWorkspace } from '@/hooks/useWorkspace'


const ACTION_META: Record<string, { icon: typeof UserPlus; color: string; label: string }> = {
    member_invited: { icon: UserPlus, color: 'text-blue-400', label: 'Member Invited' },
    member_joined: { icon: UserPlus, color: 'text-green-400', label: 'Member Joined' },
    member_removed: { icon: UserMinus, color: 'text-red-400', label: 'Member Removed' },
    role_changed: { icon: ShieldCheck, color: 'text-amber-400', label: 'Role Changed' },
    workspace_updated: { icon: Settings2, color: 'text-purple-400', label: 'Workspace Updated' },
    agent_created: { icon: Bot, color: 'text-cyan-400', label: 'Agent Created' },
    agent_updated: { icon: Bot, color: 'text-cyan-400', label: 'Agent Updated' },
    agent_deleted: { icon: Bot, color: 'text-red-400', label: 'Agent Deleted' },
    task_created: { icon: ListTodo, color: 'text-green-400', label: 'Task Created' },
    task_completed: { icon: ListTodo, color: 'text-green-400', label: 'Task Completed' },
    // Team events
    team_created: { icon: GitBranch, color: 'text-cyan-400', label: 'Team Created' },
    team_updated: { icon: GitBranch, color: 'text-amber-400', label: 'Team Updated' },
    team_deleted: { icon: GitBranch, color: 'text-red-400', label: 'Team Deleted' },
    team_run_started: { icon: Play, color: 'text-blue-400', label: 'Team Run Started' },
    team_run_completed: { icon: CheckCircle2, color: 'text-green-400', label: 'Team Run Completed' },
    team_run_failed: { icon: XCircle, color: 'text-red-400', label: 'Team Run Failed' },
}

const DEFAULT_META = { icon: ScrollText, color: 'text-gray-400', label: 'Event' }

// ─── Export helpers ──────────────────────────────────────────────────────────

function exportJson(logs: AuditLogEntry[]) {
    const json = JSON.stringify(logs, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `crewform-audit-log.json`
    link.click()
    URL.revokeObjectURL(url)
}

function exportCsv(logs: AuditLogEntry[]) {
    const headers = ['Date', 'Action', 'Label', 'Details']
    const lines = [headers.join(',')]

    for (const entry of logs) {
        const meta = ACTION_META[entry.action] ?? DEFAULT_META
        const details = Object.entries(entry.details)
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join('; ')
        lines.push([
            new Date(entry.created_at).toISOString(),
            entry.action,
            `"${meta.label}"`,
            `"${details.replace(/"/g, '""')}"`,
        ].join(','))
    }

    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `crewform-audit-log.csv`
    link.click()
    URL.revokeObjectURL(url)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AuditLogPanel() {
    const { workspaceId } = useWorkspace()
    const { data: logs, isLoading } = useAuditLog(workspaceId)
    const [exportFormat, setExportFormat] = useState<'json' | 'csv' | null>(null)

    function handleExport(format: 'json' | 'csv') {
        if (!logs || logs.length === 0) return
        setExportFormat(format)
        try {
            if (format === 'json') exportJson(logs)
            else exportCsv(logs)
        } finally {
            setTimeout(() => setExportFormat(null), 500)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
        )
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-card py-16">
                <ScrollText className="mb-4 h-10 w-10 text-gray-600" />
                <h3 className="mb-1 text-lg font-medium text-gray-300">No audit events yet</h3>
                <p className="text-sm text-gray-500">
                    Activity in this workspace will be recorded here.
                </p>
            </div>
        )
    }

    return (
        <div>
            {/* Export buttons */}
            <div className="mb-3 flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={() => handleExport('json')}
                    disabled={exportFormat !== null}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-surface-elevated hover:text-gray-200 disabled:opacity-50"
                >
                    {exportFormat === 'json' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Download className="h-3.5 w-3.5" />
                    )}
                    Export JSON
                </button>
                <button
                    type="button"
                    onClick={() => handleExport('csv')}
                    disabled={exportFormat !== null}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-surface-elevated hover:text-gray-200 disabled:opacity-50"
                >
                    {exportFormat === 'csv' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Download className="h-3.5 w-3.5" />
                    )}
                    Export CSV
                </button>
            </div>

            {/* Log entries */}
            <div className="rounded-lg border border-border bg-surface-card divide-y divide-border/50">
                {logs.map((entry) => {
                    const meta = ACTION_META[entry.action] ?? DEFAULT_META
                    const Icon = meta.icon

                    return (
                        <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-raised ${meta.color}`}>
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-200">{meta.label}</p>
                                {Object.keys(entry.details).length > 0 && (
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        {Object.entries(entry.details)
                                            .map(([k, v]) => `${k}: ${String(v)}`)
                                            .join(' · ')}
                                    </p>
                                )}
                            </div>
                            <span className="shrink-0 text-xs text-gray-600">
                                {new Date(entry.created_at).toLocaleString()}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
