// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { Check, X, Loader2, Minus, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PipelineStep, Agent, TeamRunStatus } from '@/types'

type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

interface PipelineProgressRailProps {
    steps: PipelineStep[]
    currentStepIdx: number | null
    runStatus: TeamRunStatus
    agents: Agent[]
}

function getStepStatus(
    stepIndex: number,
    currentStepIdx: number | null,
    runStatus: TeamRunStatus,
): StepStatus {
    if (runStatus === 'completed') return 'completed'
    if (runStatus === 'failed') {
        if (currentStepIdx === null) return 'pending'
        if (stepIndex < currentStepIdx) return 'completed'
        if (stepIndex === currentStepIdx) return 'failed'
        return 'pending'
    }
    if (currentStepIdx === null) return 'pending'
    if (stepIndex < currentStepIdx) return 'completed'
    if (stepIndex === currentStepIdx) return 'running'
    return 'pending'
}

const STEP_ICON: Record<StepStatus, typeof Check> = {
    pending: Circle,
    running: Loader2,
    completed: Check,
    failed: X,
    skipped: Minus,
}

const STEP_COLORS: Record<StepStatus, string> = {
    pending: 'border-gray-700 bg-gray-800 text-gray-500',
    running: 'border-blue-500 bg-blue-500/20 text-blue-400',
    completed: 'border-green-500 bg-green-500/20 text-green-400',
    failed: 'border-red-500 bg-red-500/20 text-red-400',
    skipped: 'border-yellow-500 bg-yellow-500/20 text-yellow-400',
}

const LINE_COLORS: Record<StepStatus, string> = {
    pending: 'bg-gray-700',
    running: 'bg-blue-500/50',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
    skipped: 'bg-yellow-500',
}

/**
 * Vertical pipeline progress rail.
 * Shows each step as a node with connecting lines.
 * Updates in real-time via currentStepIdx.
 */
export function PipelineProgressRail({ steps, currentStepIdx, runStatus, agents }: PipelineProgressRailProps) {
    return (
        <div className="flex flex-col">
            {steps.map((step, index) => {
                const status = getStepStatus(index, currentStepIdx, runStatus)
                const Icon = STEP_ICON[status]
                const agent = agents.find((a) => a.id === step.agent_id)
                const isLast = index === steps.length - 1

                return (
                    <div key={`${step.agent_id}-${index}`} className="flex items-start gap-3">
                        {/* Rail column */}
                        <div className="flex flex-col items-center">
                            {/* Node */}
                            <div
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                                    STEP_COLORS[status],
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-4 w-4',
                                        status === 'running' && 'animate-spin',
                                    )}
                                />
                            </div>
                            {/* Connecting line */}
                            {!isLast && (
                                <div
                                    className={cn(
                                        'w-0.5 flex-1 min-h-[32px] transition-colors',
                                        LINE_COLORS[status === 'completed' ? 'completed' : 'pending'],
                                    )}
                                />
                            )}
                        </div>

                        {/* Step info */}
                        <div className="pb-6 pt-1">
                            <p className={cn(
                                'text-sm font-medium',
                                status === 'running' ? 'text-blue-400' :
                                    status === 'completed' ? 'text-green-400' :
                                        status === 'failed' ? 'text-red-400' :
                                            'text-gray-400',
                            )}>
                                {step.step_name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {agent?.name ?? 'Unknown agent'}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
