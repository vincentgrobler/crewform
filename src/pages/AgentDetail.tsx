// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Upload, Activity, Settings2, AlertCircle, Loader2, History, Zap } from 'lucide-react'
import { useAgent } from '@/hooks/useAgent'
import { useUpdateAgent } from '@/hooks/useUpdateAgent'
import { useDeleteAgent } from '@/hooks/useDeleteAgent'
import { DeleteAgentDialog } from '@/components/agents/DeleteAgentDialog'
import { PromptHistoryPanel } from '@/components/agents/PromptHistoryPanel'
import { TriggersPanel } from '@/components/agents/TriggersPanel'
import { PublishAgentModal } from '@/components/marketplace/PublishAgentModal'
import { StatusIndicator } from '@/components/ui/StatusIndicator'
import { agentSchema, MODEL_OPTIONS, getActiveModelOptions, mergeModelOptions, inferProviderFromModel } from '@/lib/agentSchema'
import { useOpenRouterModels } from '@/hooks/useOpenRouterModels'
import { useApiKeys } from '@/hooks/useApiKeys'
import { useWorkspace } from '@/hooks/useWorkspace'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { AgentFormData } from '@/lib/agentSchema'
import type { ZodError } from 'zod'

type TabKey = 'config' | 'history' | 'triggers' | 'activity'

const tabs: { key: TabKey; label: string; icon: typeof Settings2 }[] = [
    { key: 'config', label: 'Configuration', icon: Settings2 },
    { key: 'history', label: 'History', icon: History },
    { key: 'triggers', label: 'Triggers', icon: Zap },
    { key: 'activity', label: 'Activity', icon: Activity },
]

export function AgentDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { agent, isLoading, error } = useAgent(id)
    const updateMutation = useUpdateAgent()
    const deleteMutation = useDeleteAgent()

    const { workspaceId } = useWorkspace()
    const { keys } = useApiKeys(workspaceId)

    const [activeTab, setActiveTab] = useState<TabKey>('config')
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showPublishModal, setShowPublishModal] = useState(false)
    const [formData, setFormData] = useState<AgentFormData | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [hasChanges, setHasChanges] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Only show models for providers with active API keys
    const activeProviders = useMemo(
        () => keys.filter((k) => k.is_active && k.is_valid).map((k) => k.provider),
        [keys],
    )
    const isOpenRouterActive = activeProviders.some((p) => p.toLowerCase() === 'openrouter')
    const { models: openRouterModels } = useOpenRouterModels(isOpenRouterActive)

    const dynamicModelOptions = useMemo(() => {
        const filtered = activeProviders.length > 0
            ? getActiveModelOptions(activeProviders)
            : MODEL_OPTIONS

        return mergeModelOptions(filtered, [
            { provider: 'OpenRouter', models: openRouterModels },
        ])
    }, [activeProviders, openRouterModels])

    // Populate form when agent loads
    useEffect(() => {
        if (agent && !formData) {
            setFormData({
                name: agent.name,
                description: agent.description,
                model: agent.model,
                system_prompt: agent.system_prompt,
                temperature: agent.temperature,
                tools: agent.tools,
            })
        }
    }, [agent, formData])

    function updateField<K extends keyof AgentFormData>(key: K, value: AgentFormData[K]) {
        if (!formData) return
        setFormData((prev) => prev ? { ...prev, [key]: value } : prev)
        setHasChanges(true)
        setSaveSuccess(false)
        if (fieldErrors[key]) {
            setFieldErrors((prev) =>
                Object.fromEntries(
                    Object.entries(prev).filter(([k]) => k !== key),
                ),
            )
        }
    }

    function handleSave() {
        if (!formData || !id) return

        try {
            const validated = agentSchema.parse(formData)
            setFieldErrors({})

            updateMutation.mutate(
                { id, data: { ...validated, provider: inferProviderFromModel(validated.model) } },
                {
                    onSuccess: () => {
                        setHasChanges(false)
                        setSaveSuccess(true)
                        setTimeout(() => setSaveSuccess(false), 2000)
                    },
                },
            )
        } catch (err) {
            const zodError = err as ZodError
            const errors: Record<string, string> = {}
            for (const issue of zodError.issues) {
                const field = issue.path[0]
                if (typeof field === 'string') errors[field] = issue.message
            }
            setFieldErrors(errors)
        }
    }

    function handleDelete() {
        if (!agent) return
        deleteMutation.mutate(
            { id: agent.id, workspaceId: agent.workspace_id },
            { onSuccess: () => navigate('/agents', { replace: true }) },
        )
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="p-6 lg:p-8">
                <div className="mb-6 flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-7 w-48" />
                </div>
                <Skeleton className="mb-4 h-10 w-64" />
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                </div>
            </div>
        )
    }

    // Error / not found
    if (error || !agent) {
        return (
            <div className="flex flex-col items-center justify-center p-16">
                <AlertCircle className="mb-3 h-10 w-10 text-status-error-text" />
                <h2 className="mb-1 text-lg font-medium text-gray-300">Agent not found</h2>
                <p className="mb-4 text-sm text-gray-500">
                    {error instanceof Error ? error.message : 'The agent may have been deleted.'}
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/agents')}
                    className="rounded-lg bg-surface-elevated px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-surface-overlay"
                >
                    Back to Agents
                </button>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/agents')}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-elevated hover:text-gray-200"
                        aria-label="Back to agents"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl font-semibold text-gray-100">{agent.name}</h1>
                    <StatusIndicator status={agent.status} size="md" />
                </div>

                <div className="flex items-center gap-2">
                    {/* Save button */}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!hasChanges || updateMutation.isPending}
                        className={cn(
                            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                            saveSuccess
                                ? 'bg-status-success text-white'
                                : hasChanges
                                    ? 'bg-brand-primary text-white hover:bg-brand-hover'
                                    : 'bg-surface-elevated text-gray-500 cursor-not-allowed',
                        )}
                    >
                        {updateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {saveSuccess ? 'Saved!' : 'Save'}
                    </button>

                    {/* Publish button */}
                    <button
                        type="button"
                        onClick={() => setShowPublishModal(true)}
                        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-surface-elevated hover:text-brand-primary"
                    >
                        <Upload className="h-4 w-4" />
                        Publish
                    </button>

                    {/* Delete button */}
                    <button
                        type="button"
                        onClick={() => setShowDeleteDialog(true)}
                        className="flex items-center gap-2 rounded-lg border border-red-600/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/10"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex border-b border-border">
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setActiveTab(key)}
                        className={cn(
                            'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                            activeTab === key
                                ? 'border-brand-primary text-gray-200'
                                : 'border-transparent text-gray-500 hover:text-gray-300',
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Save error */}
            {updateMutation.error && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {updateMutation.error.message}
                </div>
            )}

            {/* Tab content */}
            {activeTab === 'config' && formData && (
                <ConfigurationTab
                    formData={formData}
                    fieldErrors={fieldErrors}
                    onUpdateField={updateField}
                    modelOptions={dynamicModelOptions}
                />
            )}

            {activeTab === 'history' && id && formData && (
                <PromptHistoryPanel
                    agentId={id}
                    currentPrompt={formData.system_prompt}
                    onRestore={(prompt) => {
                        updateField('system_prompt', prompt)
                        setActiveTab('config')
                    }}
                />
            )}

            {activeTab === 'triggers' && id && (
                <TriggersPanel agentId={id} />
            )}

            {activeTab === 'activity' && <ActivityTab />}

            {/* Publish modal */}
            {showPublishModal && (
                <PublishAgentModal
                    agent={agent}
                    onClose={() => setShowPublishModal(false)}
                />
            )}

            {/* Delete dialog */}
            {showDeleteDialog && (
                <DeleteAgentDialog
                    agentName={agent.name}
                    isDeleting={deleteMutation.isPending}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteDialog(false)}
                />
            )}
        </div>
    )
}

// ─── Configuration Tab ───────────────────────────────────────────────────────

interface ConfigTabProps {
    formData: AgentFormData
    fieldErrors: Record<string, string>
    onUpdateField: <K extends keyof AgentFormData>(key: K, value: AgentFormData[K]) => void
    modelOptions: typeof MODEL_OPTIONS
}

function ConfigurationTab({ formData, fieldErrors, onUpdateField, modelOptions }: ConfigTabProps) {
    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Name */}
            <div>
                <label htmlFor="edit-name" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Name <span className="text-red-400">*</span>
                </label>
                <input
                    id="edit-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => onUpdateField('name', e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-card px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
                {fieldErrors.name && <p className="mt-1 text-xs text-status-error-text">{fieldErrors.name}</p>}
            </div>

            {/* Description */}
            <div>
                <label htmlFor="edit-desc" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Description
                </label>
                <textarea
                    id="edit-desc"
                    value={formData.description}
                    onChange={(e) => onUpdateField('description', e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-surface-card px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
                {fieldErrors.description && <p className="mt-1 text-xs text-status-error-text">{fieldErrors.description}</p>}
            </div>

            {/* Model */}
            <div>
                <label htmlFor="edit-model" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Model <span className="text-red-400">*</span>
                </label>
                <select
                    id="edit-model"
                    value={formData.model}
                    onChange={(e) => onUpdateField('model', e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-card px-4 py-2.5 text-sm text-gray-200 outline-none focus:border-brand-primary"
                >
                    {modelOptions.map((group) => {
                        if (group.models.length === 0) return null
                        return (
                            <optgroup key={group.provider} label={group.provider}>
                                {group.models.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </optgroup>
                        )
                    })}
                </select>
                {fieldErrors.model && <p className="mt-1 text-xs text-status-error-text">{fieldErrors.model}</p>}
            </div>

            {/* System Prompt */}
            <div>
                <label htmlFor="edit-prompt" className="mb-1.5 block text-sm font-medium text-gray-300">
                    System Prompt
                </label>
                <textarea
                    id="edit-prompt"
                    value={formData.system_prompt}
                    onChange={(e) => onUpdateField('system_prompt', e.target.value)}
                    rows={10}
                    className="w-full rounded-lg border border-border bg-surface-card px-4 py-2.5 font-mono text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
                <div className="mt-1 flex justify-between">
                    {fieldErrors.system_prompt ? (
                        <p className="text-xs text-status-error-text">{fieldErrors.system_prompt}</p>
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
                    <label htmlFor="edit-temp" className="text-sm font-medium text-gray-300">
                        Temperature
                    </label>
                    <span className="font-mono text-sm text-gray-400">{formData.temperature.toFixed(1)}</span>
                </div>
                <input
                    id="edit-temp"
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={formData.temperature}
                    onChange={(e) => onUpdateField('temperature', parseFloat(e.target.value))}
                    className="w-full accent-brand-primary"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-600">
                    <span>Precise</span>
                    <span>Creative</span>
                </div>
            </div>
        </div>
    )
}

// ─── Activity Tab ────────────────────────────────────────────────────────────

function ActivityTab() {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-card py-16">
            <Activity className="mb-4 h-10 w-10 text-gray-600" />
            <h3 className="mb-1 text-lg font-medium text-gray-300">No activity yet</h3>
            <p className="text-sm text-gray-500">
                Task history and performance stats will appear here once this agent runs tasks.
            </p>
        </div>
    )
}
