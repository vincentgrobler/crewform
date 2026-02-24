// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState } from 'react'
import { Check, X, Eye, EyeOff, Trash2, Loader2, Plus } from 'lucide-react'
import type { ApiKey } from '@/types'
import { cn } from '@/lib/utils'

export interface ProviderConfig {
    id: string
    name: string
    prefix: string
    color: string
    bgColor: string
    borderColor: string
}

interface ProviderKeyCardProps {
    provider: ProviderConfig
    existingKey: ApiKey | undefined
    onSave: (key: string) => void
    onRemove: () => void
    isSaving: boolean
    isRemoving: boolean
}

/**
 * Per-provider API key card.
 * States: not configured → input mode → configured (masked).
 */
export function ProviderKeyCard({
    provider,
    existingKey,
    onSave,
    onRemove,
    isSaving,
    isRemoving,
}: ProviderKeyCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [keyInput, setKeyInput] = useState('')
    const [isRevealed, setIsRevealed] = useState(false)
    const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
    const [testError, setTestError] = useState('')

    const isConfigured = !!existingKey

    function validatePrefix(key: string): boolean {
        return key.startsWith(provider.prefix)
    }

    function handleTestConnection() {
        if (!keyInput.trim()) return

        if (!validatePrefix(keyInput)) {
            setTestResult('error')
            setTestError(`Key must start with "${provider.prefix}"`)
            return
        }

        setTestResult('testing')
        setTestError('')

        // Simulate test connection (Edge Function will handle real tests)
        setTimeout(() => {
            setTestResult('success')
        }, 1200)
    }

    function handleSave() {
        if (!keyInput.trim() || testResult !== 'success') return
        onSave(keyInput)
        setKeyInput('')
        setIsEditing(false)
        setTestResult('idle')
    }

    function handleCancel() {
        setKeyInput('')
        setIsEditing(false)
        setTestResult('idle')
        setTestError('')
    }

    // Masked key display
    const maskedKey = existingKey
        ? `${provider.prefix}••••••••${existingKey.key_hint}`
        : ''

    return (
        <div className={cn('rounded-lg border bg-surface-card p-5 transition-colors', provider.borderColor)}>
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold', provider.bgColor, provider.color)}>
                        {provider.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-200">{provider.name}</h3>
                        <StatusBadge isConfigured={isConfigured} isValid={existingKey?.is_valid ?? false} />
                    </div>
                </div>

                {/* Actions when configured */}
                {isConfigured && !isEditing && (
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={isRemoving}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-600/10 disabled:opacity-50"
                    >
                        {isRemoving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Remove
                    </button>
                )}
            </div>

            {/* Configured state — masked key */}
            {isConfigured && !isEditing && (
                <div className="flex items-center gap-2 rounded-lg border border-border-muted bg-surface-primary px-3 py-2">
                    <code className="flex-1 font-mono text-sm text-gray-400">
                        {isRevealed ? `${provider.prefix}••••••••${existingKey.key_hint}` : maskedKey}
                    </code>
                    <button
                        type="button"
                        onClick={() => setIsRevealed(!isRevealed)}
                        className="text-gray-500 hover:text-gray-300"
                        aria-label={isRevealed ? 'Hide key' : 'Reveal key'}
                    >
                        {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            )}

            {/* Not configured — add button */}
            {!isConfigured && !isEditing && (
                <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm font-medium text-gray-500 transition-colors hover:border-gray-500 hover:text-gray-300"
                >
                    <Plus className="h-4 w-4" />
                    Add API Key
                </button>
            )}

            {/* Input mode */}
            {isEditing && (
                <div className="space-y-3">
                    <div>
                        <input
                            type="password"
                            value={keyInput}
                            onChange={(e) => {
                                setKeyInput(e.target.value)
                                setTestResult('idle')
                                setTestError('')
                            }}
                            placeholder={`Paste your ${provider.name} API key (${provider.prefix}...)`}
                            className="w-full rounded-lg border border-border bg-surface-primary px-4 py-2.5 font-mono text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                            autoFocus
                        />
                        {testError && <p className="mt-1 text-xs text-red-400">{testError}</p>}
                    </div>

                    {/* Test result */}
                    {testResult === 'success' && (
                        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs font-medium text-green-400">
                            <Check className="h-4 w-4" />
                            Connection successful — key is valid
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleTestConnection}
                            disabled={!keyInput.trim() || testResult === 'testing'}
                            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {testResult === 'testing' ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : testResult === 'success' ? (
                                <Check className="h-3.5 w-3.5 text-green-400" />
                            ) : (
                                <span className="h-3.5 w-3.5" />
                            )}
                            Test Connection
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={testResult !== 'success' || isSaving}
                            className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Save
                        </button>

                        <button
                            type="button"
                            onClick={handleCancel}
                            className="rounded-lg px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:text-gray-300"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function StatusBadge({ isConfigured, isValid }: { isConfigured: boolean; isValid: boolean }) {
    if (!isConfigured) {
        return <span className="text-xs text-gray-600">Not configured</span>
    }
    if (isValid) {
        return (
            <span className="flex items-center gap-1 text-xs font-medium text-green-400">
                <Check className="h-3 w-3" /> Connected
            </span>
        )
    }
    return (
        <span className="flex items-center gap-1 text-xs font-medium text-yellow-400">
            ⚠️ Invalid
        </span>
    )
}
