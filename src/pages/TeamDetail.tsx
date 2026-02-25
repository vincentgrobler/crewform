// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    GitBranch,
    Trash2,
    Loader2,
    AlertCircle,
    Pencil,
    Check,
    X,
    Play,
} from 'lucide-react'
import { useTeam } from '@/hooks/useTeam'
import { useAgents } from '@/hooks/useAgents'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useUpdateTeam } from '@/hooks/useUpdateTeam'
import { useDeleteTeam } from '@/hooks/useDeleteTeam'
import { useTeamRuns } from '@/hooks/useTeamRuns'
import { PipelineConfigPanel } from '@/components/teams/PipelineConfigPanel'
import { RunTeamModal } from '@/components/teams/RunTeamModal'
import { TeamRunCard } from '@/components/teams/TeamRunCard'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { PipelineConfig } from '@/types'

const MODE_BADGE: Record<string, { label: string; className: string }> = {
    pipeline: { label: 'Pipeline', className: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    orchestrator: { label: 'Orchestrator', className: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    collaboration: { label: 'Collaboration', className: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
}

/**
 * Team detail/configuration page.
 * Header with inline-editable name, PipelineConfigPanel as main content.
 */
export function TeamDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { workspaceId } = useWorkspace()
    const { team, isLoading, error } = useTeam(id ?? null)
    const { agents } = useAgents(workspaceId)
    const updateMutation = useUpdateTeam()
    const deleteMutation = useDeleteTeam()

    // Inline editing state
    const [isEditingName, setIsEditingName] = useState(false)
    const [editName, setEditName] = useState('')
    const [isEditingDesc, setIsEditingDesc] = useState(false)
    const [editDesc, setEditDesc] = useState('')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showRunModal, setShowRunModal] = useState(false)

    const { runs, isLoading: isLoadingRuns } = useTeamRuns(id ?? null)
    const pipelineConfig = team?.config as PipelineConfig | undefined
    const stepCount = pipelineConfig?.steps.length ?? 0

    function startEditName() {
        if (!team) return
        setEditName(team.name)
        setIsEditingName(true)
    }

    function saveName() {
        if (!team || !editName.trim()) return
        updateMutation.mutate(
            { id: team.id, updates: { name: editName.trim() } },
            { onSuccess: () => setIsEditingName(false) },
        )
    }

    function startEditDesc() {
        if (!team) return
        setEditDesc(team.description)
        setIsEditingDesc(true)
    }

    function saveDesc() {
        if (!team) return
        updateMutation.mutate(
            { id: team.id, updates: { description: editDesc.trim() } },
            { onSuccess: () => setIsEditingDesc(false) },
        )
    }

    function handleDelete() {
        if (!team) return
        deleteMutation.mutate(
            { id: team.id, workspaceId: team.workspace_id },
            { onSuccess: () => navigate('/teams') },
        )
    }

    const badge = team ? (MODE_BADGE[team.mode] ?? MODE_BADGE.pipeline) : null

    return (
        <div className="p-6 lg:p-8">
            {/* Back */}
            <button
                type="button"
                onClick={() => navigate('/teams')}
                className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-300"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Teams
            </button>

            {/* Loading */}
            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-64 w-full rounded-lg" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex flex-col items-center justify-center py-16">
                    <AlertCircle className="mb-3 h-8 w-8 text-red-400" />
                    <p className="text-sm text-gray-400">Failed to load team</p>
                </div>
            )}

            {/* Content */}
            {team && (
                <>
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-muted">
                                    <GitBranch className="h-6 w-6 text-brand-primary" />
                                </div>
                                <div>
                                    {/* Inline-editable name */}
                                    {isEditingName ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="rounded-lg border border-brand-primary bg-surface-card px-3 py-1 text-xl font-semibold text-gray-100 outline-none"
                                                autoFocus
                                                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setIsEditingName(false) }}
                                            />
                                            <button type="button" onClick={saveName} className="rounded p-1 text-green-400 hover:bg-green-500/10">
                                                <Check className="h-4 w-4" />
                                            </button>
                                            <button type="button" onClick={() => setIsEditingName(false)} className="rounded p-1 text-gray-500 hover:bg-surface-elevated">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group">
                                            <h1 className="text-2xl font-semibold text-gray-100">{team.name}</h1>
                                            <button
                                                type="button"
                                                onClick={startEditName}
                                                className="rounded p-1 text-gray-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-gray-400"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Mode badge */}
                                    {badge && (
                                        <span className={cn(
                                            'mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                                            badge.className,
                                        )}>
                                            {badge.label}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                                {/* Run Team button */}
                                <button
                                    type="button"
                                    onClick={() => setShowRunModal(true)}
                                    disabled={stepCount === 0}
                                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Play className="h-4 w-4" />
                                    Run Team
                                </button>

                                {/* Delete button */}
                                <div className="relative">
                                    {showDeleteConfirm ? (
                                        <div className="flex items-center gap-2 rounded-lg border border-red-600/30 bg-red-600/5 px-3 py-2">
                                            <span className="text-xs text-red-400">Delete this team?</span>
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                disabled={deleteMutation.isPending}
                                                className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                            >
                                                {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes, delete'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="text-xs text-gray-500 hover:text-gray-300"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="rounded-lg border border-red-600/20 p-2 text-gray-600 transition-colors hover:border-red-600/40 hover:text-red-400"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mt-3">
                            {isEditingDesc ? (
                                <div className="flex items-start gap-2">
                                    <textarea
                                        value={editDesc}
                                        onChange={(e) => setEditDesc(e.target.value)}
                                        rows={2}
                                        className="flex-1 rounded-lg border border-brand-primary bg-surface-card px-3 py-2 text-sm text-gray-300 outline-none resize-none"
                                        autoFocus
                                    />
                                    <button type="button" onClick={saveDesc} className="rounded p-1 text-green-400 hover:bg-green-500/10">
                                        <Check className="h-4 w-4" />
                                    </button>
                                    <button type="button" onClick={() => setIsEditingDesc(false)} className="rounded p-1 text-gray-500 hover:bg-surface-elevated">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="group flex items-start gap-2">
                                    <p className="text-sm text-gray-500">
                                        {team.description || 'No description. Click to add one.'}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={startEditDesc}
                                        className="mt-0.5 rounded p-1 text-gray-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-gray-400"
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pipeline configuration */}
                    {team.mode === 'pipeline' && (
                        <div className="rounded-xl border border-border bg-surface-card p-6">
                            <PipelineConfigPanel team={team} agents={agents} />
                        </div>
                    )}

                    {/* Recent Runs */}
                    <div className="mt-8">
                        <h2 className="mb-4 text-lg font-semibold text-gray-200">Recent Runs</h2>
                        {isLoadingRuns ? (
                            <div className="space-y-2">
                                <Skeleton className="h-14 w-full rounded-lg" />
                                <Skeleton className="h-14 w-full rounded-lg" />
                            </div>
                        ) : runs.length > 0 ? (
                            <div className="space-y-2">
                                {runs.map((run) => (
                                    <TeamRunCard key={run.id} run={run} teamId={team.id} stepCount={stepCount} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-border py-8 text-center">
                                <Play className="mx-auto mb-2 h-6 w-6 text-gray-600" />
                                <p className="text-sm text-gray-500">No runs yet</p>
                                <p className="text-xs text-gray-600 mt-1">Click "Run Team" to start your first pipeline run.</p>
                            </div>
                        )}
                    </div>

                    {/* Run Team Modal */}
                    {showRunModal && (
                        <RunTeamModal
                            teamId={team.id}
                            teamName={team.name}
                            onClose={() => setShowRunModal(false)}
                            onCreated={(runId) => navigate(`/teams/${team.id}/runs/${runId}`)}
                        />
                    )}
                </>
            )}
        </div>
    )
}
