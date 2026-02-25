// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { Play, Loader2 } from 'lucide-react'
import { TaskStatusBadge, TaskPriorityBadge } from '@/components/tasks/TaskStatusBadge'
import { useDispatchTask } from '@/hooks/useDispatchTask'
import type { Task, Agent } from '@/types'

interface TaskRowProps {
    task: Task
    agents: Agent[]
    onClick?: () => void
}

/**
 * Table row for the task list.
 * Status · Title · Agent · Priority · Created · Elapsed
 */
export function TaskRow({ task, agents, onClick }: TaskRowProps) {
    const agent = agents.find((a) => a.id === task.assigned_agent_id)
    const dispatchMutation = useDispatchTask()

    const elapsed = getElapsedText(task)

    function handleStart(e: React.MouseEvent) {
        e.stopPropagation() // Don't open the detail panel
        dispatchMutation.mutate({ id: task.id })
    }

    return (
        <tr
            className="border-b border-border-muted transition-colors hover:bg-surface-elevated/50 cursor-pointer"
            onClick={onClick}
        >
            {/* Status */}
            <td className="px-4 py-3">
                <TaskStatusBadge status={task.status} />
            </td>

            {/* Title */}
            <td className="px-4 py-3">
                <span className="text-sm font-medium text-gray-200">{task.title}</span>
                {task.description && (
                    <p className="mt-0.5 max-w-md truncate text-xs text-gray-500">
                        {task.description}
                    </p>
                )}
            </td>

            {/* Agent */}
            <td className="px-4 py-3">
                {agent ? (
                    <span className="text-sm text-gray-400">{agent.name}</span>
                ) : (
                    <span className="text-sm text-gray-600">Unassigned</span>
                )}
            </td>

            {/* Priority */}
            <td className="px-4 py-3">
                <TaskPriorityBadge priority={task.priority} />
            </td>

            {/* Created */}
            <td className="px-4 py-3">
                <span className="text-xs text-gray-500">
                    {new Date(task.created_at).toLocaleDateString()}
                </span>
            </td>

            {/* Elapsed */}
            <td className="px-4 py-3">
                <span className="text-xs text-gray-500">{elapsed}</span>
            </td>

            {/* Actions */}
            <td className="px-4 py-3">
                {task.status === 'pending' && task.assigned_agent_id && (
                    <button
                        type="button"
                        onClick={handleStart}
                        disabled={dispatchMutation.isPending}
                        className="flex items-center gap-1.5 rounded-md border border-green-600/30 bg-green-600/10 px-2.5 py-1 text-xs font-medium text-green-400 transition-colors hover:bg-green-600/20 disabled:opacity-50"
                    >
                        {dispatchMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Play className="h-3 w-3" />
                        )}
                        Start
                    </button>
                )}
            </td>
        </tr>
    )
}

function getElapsedText(task: Task): string {
    if (task.status === 'pending' || task.status === 'dispatched') return '—'

    const start = new Date(task.created_at).getTime()
    const end = task.status === 'running'
        ? Date.now()
        : new Date(task.updated_at).getTime()

    const seconds = Math.round((end - start) / 1000)

    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
}
