// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { Info } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useApiKeys } from '@/hooks/useApiKeys'
import { useSaveApiKey } from '@/hooks/useSaveApiKey'
import { useRemoveApiKey } from '@/hooks/useRemoveApiKey'
import { useToggleProvider } from '@/hooks/useToggleProvider'
import { ProviderKeyCard } from '@/components/settings/ProviderKeyCard'
import type { ProviderConfig } from '@/components/settings/ProviderKeyCard'
import { MODEL_OPTIONS } from '@/lib/agentSchema'
import { Skeleton } from '@/components/ui/skeleton'

/** Build PROVIDERS config by merging static metadata with models from agentSchema */
const PROVIDERS: ProviderConfig[] = [
    {
        id: 'anthropic',
        name: 'Anthropic',
        prefix: 'sk-ant-',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-border',
    },
    {
        id: 'openai',
        name: 'OpenAI',
        prefix: 'sk-',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-border',
    },
    {
        id: 'google',
        name: 'Google',
        prefix: 'AI',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-border',
    },
    {
        id: 'openrouter',
        name: 'OpenRouter',
        prefix: 'sk-or-',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-border',
    },
    {
        id: 'mistral',
        name: 'Mistral',
        prefix: '',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-border',
    },
    {
        id: 'groq',
        name: 'Groq',
        prefix: 'gsk_',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-border',
    },
    {
        id: 'cohere',
        name: 'Cohere',
        prefix: '',
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-border',
    },
].map((p) => {
    // Match provider by name (case-insensitive) to get its models
    const modelGroup = MODEL_OPTIONS.find(
        (g) => g.provider.toLowerCase() === p.id.toLowerCase(),
    )
    return {
        ...p,
        models: modelGroup
            ? modelGroup.models.map((m) => ({ value: m.value, label: m.label }))
            : [],
    }
})

/**
 * API Keys settings section.
 * Shows provider cards with active/inactive toggles and model listings.
 */
export function ApiKeysSettings() {
    const { workspaceId } = useWorkspace()
    const { keysByProvider, isLoading } = useApiKeys(workspaceId)
    const saveMutation = useSaveApiKey()
    const removeMutation = useRemoveApiKey()
    const toggleMutation = useToggleProvider()

    function handleSave(provider: string, rawKey: string) {
        if (!workspaceId) return

        const hint = rawKey.slice(-4)

        saveMutation.mutate({
            workspace_id: workspaceId,
            provider,
            encrypted_key: rawKey, // Edge Function will encrypt before DB write
            key_hint: hint,
            is_valid: true,
        })
    }

    function handleRemove(keyId: string) {
        if (!workspaceId) return
        removeMutation.mutate({ id: keyId, workspaceId })
    }

    function handleToggleActive(keyId: string, isActive: boolean) {
        if (!workspaceId) return
        toggleMutation.mutate({ id: keyId, isActive, workspaceId })
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Info banner */}
            <div className="flex items-start gap-3 rounded-lg border border-brand-primary/20 bg-brand-muted/30 px-4 py-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                <div>
                    <p className="text-sm font-medium text-gray-200">What is BYOK?</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                        Bring Your Own Key — use your own API keys for full cost transparency and control.
                        Keys are encrypted at rest with AES-256-GCM and never logged.
                        Toggle a provider to &ldquo;Active&rdquo; to enable its models for agent creation.
                    </p>
                </div>
            </div>

            {/* Provider cards */}
            <div className="space-y-4">
                {PROVIDERS.map((provider) => {
                    const existingKey = keysByProvider.get(provider.id)
                    return (
                        <ProviderKeyCard
                            key={provider.id}
                            provider={provider}
                            existingKey={existingKey}
                            onSave={(key) => handleSave(provider.id, key)}
                            onRemove={() => {
                                if (existingKey) handleRemove(existingKey.id)
                            }}
                            onToggleActive={(isActive) => {
                                if (existingKey) handleToggleActive(existingKey.id, isActive)
                            }}
                            isSaving={saveMutation.isPending}
                            isRemoving={removeMutation.isPending}
                            isToggling={toggleMutation.isPending}
                        />
                    )
                })}
            </div>
        </div>
    )
}
