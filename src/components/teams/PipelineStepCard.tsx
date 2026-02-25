// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { Agent } from '@/types'
import type { PipelineStepFormData } from '@/lib/teamSchema'

interface PipelineStepCardProps {
    step: PipelineStepFormData & { _id: string }
    index: number
    agents: Agent[]
    onUpdate: (id: string, updates: Partial<PipelineStepFormData>) => void
    onDelete: (id: string) => void
}

/**
 * Draggable pipeline step card.
 * Shows step number, agent, name, and expandable configuration.
 */
export function PipelineStepCard({ step, index, agents, onUpdate, onDelete }: PipelineStepCardProps) {
    const [expanded, setExpanded] = useState(false)
    const agent = agents.find((a) => a.id === step.agent_id)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: step._id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`rounded-lg border bg-surface-card transition-colors ${isDragging ? 'border-brand-primary shadow-lg' : 'border-border'
                }`}
        >
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-3">
                {/* Drag handle */}
                <button
                    type="button"
                    className="cursor-grab rounded p-1 text-gray-600 hover:text-gray-400 active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-4 w-4" />
                </button>

                {/* Step number */}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-muted text-xs font-bold text-brand-primary">
                    {index + 1}
                </span>

                {/* Step name */}
                <input
                    type="text"
                    value={step.step_name}
                    onChange={(e) => onUpdate(step._id, { step_name: e.target.value })}
                    placeholder="Step name..."
                    className="flex-1 bg-transparent text-sm font-medium text-gray-200 placeholder-gray-600 outline-none"
                />

                {/* Agent badge */}
                <span className="rounded-md bg-surface-elevated px-2 py-1 text-xs text-gray-400">
                    {agent?.name ?? 'No agent'}
                </span>

                {/* Expand/collapse */}
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="rounded p-1 text-gray-600 hover:text-gray-400"
                >
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {/* Delete */}
                <button
                    type="button"
                    onClick={() => onDelete(step._id)}
                    className="rounded p-1 text-gray-600 hover:text-red-400"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            {/* Expanded config */}
            {expanded && (
                <div className="border-t border-border px-4 py-4 space-y-4">
                    {/* Agent selector */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">Agent</label>
                        <select
                            value={step.agent_id}
                            onChange={(e) => onUpdate(step._id, { agent_id: e.target.value })}
                            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-gray-300 outline-none focus:border-brand-primary"
                        >
                            <option value="">Select an agent...</option>
                            {agents.map((a) => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Instructions */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">Instructions</label>
                        <textarea
                            value={step.instructions}
                            onChange={(e) => onUpdate(step._id, { instructions: e.target.value })}
                            placeholder="What should this agent do in this step?"
                            rows={3}
                            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-gray-300 placeholder-gray-600 outline-none focus:border-brand-primary resize-none"
                        />
                    </div>

                    {/* Expected output */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">Expected Output</label>
                        <input
                            type="text"
                            value={step.expected_output}
                            onChange={(e) => onUpdate(step._id, { expected_output: e.target.value })}
                            placeholder="e.g. A summary document, JSON data, etc."
                            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-gray-300 placeholder-gray-600 outline-none focus:border-brand-primary"
                        />
                    </div>

                    {/* Failure mode + retries */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-400">On Failure</label>
                            <select
                                value={step.on_failure}
                                onChange={(e) => onUpdate(step._id, { on_failure: e.target.value as 'retry' | 'stop' | 'skip' })}
                                className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-gray-300 outline-none focus:border-brand-primary"
                            >
                                <option value="stop">Stop pipeline</option>
                                <option value="retry">Retry step</option>
                                <option value="skip">Skip step</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-400">Max Retries</label>
                            <input
                                type="number"
                                value={step.max_retries}
                                onChange={(e) => onUpdate(step._id, { max_retries: parseInt(e.target.value) || 0 })}
                                min={0}
                                max={5}
                                className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-gray-300 outline-none focus:border-brand-primary"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
