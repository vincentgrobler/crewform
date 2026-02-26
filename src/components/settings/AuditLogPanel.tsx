// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import {
    ScrollText, Loader2, UserPlus, UserMinus, ShieldCheck,
    Settings2, Bot, ListTodo,
} from 'lucide-react'
import { useAuditLog } from '@/hooks/useMembers'
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
}

const DEFAULT_META = { icon: ScrollText, color: 'text-gray-400', label: 'Event' }

export function AuditLogPanel() {
    const { workspaceId } = useWorkspace()
    const { data: logs, isLoading } = useAuditLog(workspaceId)

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
    )
}
