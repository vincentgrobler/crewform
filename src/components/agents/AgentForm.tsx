// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState } from 'react'
import type { AgentFormData } from '@/lib/agentSchema'
import { agentSchema, MODEL_OPTIONS } from '@/lib/agentSchema'
import type { ZodError } from 'zod'

interface AgentFormProps {
    initialData: AgentFormData
    onSubmit: (data: AgentFormData) => void
    onBack: () => void
}

/**
 * Step 2: Agent configuration form.
 * Name, description, model, system prompt, temperature.
 * Validates with Zod on submit.
 */
export function AgentForm({ initialData, onSubmit, onBack }: AgentFormProps) {
    const [formData, setFormData] = useState<AgentFormData>(initialData)
    const [errors, setErrors] = useState<Record<string, string>>({})

    function updateField<K extends keyof AgentFormData>(key: K, value: AgentFormData[K]) {
        setFormData((prev) => ({ ...prev, [key]: value }))
        // Clear field error on change
        if (errors[key]) {
            setErrors((prev) =>
                Object.fromEntries(
                    Object.entries(prev).filter(([k]) => k !== key),
                ),
            )
        }
    }

    function handleSubmit() {
        try {
            const validated = agentSchema.parse(formData)
            setErrors({})
            onSubmit(validated)
        } catch (err) {
            const zodError = err as ZodError
            const fieldErrors: Record<string, string> = {}
            for (const issue of zodError.issues) {
                const field = issue.path[0]
                if (typeof field === 'string') {
                    fieldErrors[field] = issue.message
                }
            }
            setErrors(fieldErrors)
        }
    }

    return (
        <div className="space-y-6">
            {/* Name */}
            <div>
                <label htmlFor="agent-name" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Name <span className="text-red-400">*</span>
                </label>
                <input
                    id="agent-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="My Agent"
                    className="w-full rounded-lg border border-border bg-surface-card px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
                {errors.name && <p className="mt-1 text-xs text-status-error-text">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
                <label htmlFor="agent-desc" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Description
                </label>
                <textarea
                    id="agent-desc"
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="What does this agent do?"
                    rows={2}
                    className="w-full rounded-lg border border-border bg-surface-card px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
                {errors.description && <p className="mt-1 text-xs text-status-error-text">{errors.description}</p>}
            </div>

            {/* Model selector */}
            <div>
                <label htmlFor="agent-model" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Model <span className="text-red-400">*</span>
                </label>
                <select
                    id="agent-model"
                    value={formData.model}
                    onChange={(e) => updateField('model', e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-card px-4 py-2.5 text-sm text-gray-200 outline-none focus:border-brand-primary"
                >
                    {MODEL_OPTIONS.map((group) => (
                        <optgroup key={group.provider} label={group.provider}>
                            {group.models.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                {errors.model && <p className="mt-1 text-xs text-status-error-text">{errors.model}</p>}
            </div>

            {/* System Prompt */}
            <div>
                <label htmlFor="agent-prompt" className="mb-1.5 block text-sm font-medium text-gray-300">
                    System Prompt
                </label>
                <textarea
                    id="agent-prompt"
                    value={formData.system_prompt}
                    onChange={(e) => updateField('system_prompt', e.target.value)}
                    placeholder="You are a helpful assistant..."
                    rows={8}
                    className="w-full rounded-lg border border-border bg-surface-card px-4 py-2.5 font-mono text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
                <div className="mt-1 flex justify-between">
                    {errors.system_prompt ? (
                        <p className="text-xs text-status-error-text">{errors.system_prompt}</p>
                    ) : (
                        <span />
                    )}
                    <span className="text-xs text-gray-600">
                        {formData.system_prompt.length.toLocaleString()} / 10,000
                    </span>
                </div>
            </div>

            {/* Temperature */}
            <div>
                <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="agent-temp" className="text-sm font-medium text-gray-300">
                        Temperature
                    </label>
                    <span className="text-sm font-mono text-gray-400">{formData.temperature.toFixed(1)}</span>
                </div>
                <input
                    id="agent-temp"
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={formData.temperature}
                    onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
                    className="w-full accent-brand-primary"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-600">
                    <span>Precise</span>
                    <span>Creative</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
                <button
                    type="button"
                    onClick={onBack}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-surface-elevated hover:text-gray-200"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-lg bg-brand-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
                >
                    Review
                </button>
            </div>
        </div>
    )
}
