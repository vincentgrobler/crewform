// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { Info } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useApiKeys } from '@/hooks/useApiKeys'
import { useSaveApiKey } from '@/hooks/useSaveApiKey'
import { useRemoveApiKey } from '@/hooks/useRemoveApiKey'
import { ProviderKeyCard } from '@/components/settings/ProviderKeyCard'
import type { ProviderConfig } from '@/components/settings/ProviderKeyCard'
import { Skeleton } from '@/components/ui/skeleton'

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
]

/**
 * API Keys settings section.
 * Shows provider cards for Anthropic, OpenAI, and Google.
 */
export function ApiKeysSettings() {
    const { workspaceId } = useWorkspace()
    const { keysByProvider, isLoading } = useApiKeys(workspaceId)
    const saveMutation = useSaveApiKey()
    const removeMutation = useRemoveApiKey()

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
                            isSaving={saveMutation.isPending}
                            isRemoving={removeMutation.isPending}
                        />
                    )
                })}
            </div>
        </div>
    )
}
