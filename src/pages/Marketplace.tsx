// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState, useDeferredValue } from 'react'
import { Store, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useAuth } from '@/hooks/useAuth'
import { useMarketplaceAgents, useMarketplaceTags } from '@/hooks/useMarketplace'
import { useInstallAgent } from '@/hooks/useInstallAgent'
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters'
import { AgentCard } from '@/components/marketplace/AgentCard'
import { AgentDetailModal } from '@/components/marketplace/AgentDetailModal'
import type { MarketplaceSortOption } from '@/db/marketplace'
import type { Agent } from '@/types'

export function Marketplace() {
  // ─── Filter state ────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sort, setSort] = useState<MarketplaceSortOption>('installs')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Debounce search for smoother UX
  const deferredSearch = useDeferredValue(search)

  // ─── Data ────────────────────────────────────────────────────────────────
  const { workspaceId } = useWorkspace()
  const { user } = useAuth()
  const { agents, isLoading } = useMarketplaceAgents({
    search: deferredSearch,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    sort,
  })
  const { tags: availableTags } = useMarketplaceTags()
  const installMutation = useInstallAgent()

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const handleInstall = (agent: Agent) => {
    if (!workspaceId || !user) return

    installMutation.mutate(
      { agentId: agent.id, workspaceId, userId: user.id },
      {
        onSuccess: (result) => {
          setToast({ type: 'success', message: `"${result.clonedAgent.name}" installed to your workspace!` })
          setSelectedAgent(null)
          setTimeout(() => setToast(null), 4000)
        },
        onError: (err) => {
          setToast({ type: 'error', message: err.message })
          setTimeout(() => setToast(null), 4000)
        },
      },
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Store className="h-6 w-6 text-brand-primary" />
          <h1 className="text-2xl font-semibold text-gray-100">Marketplace</h1>
        </div>
        <p className="text-sm text-gray-500">
          Browse and install pre-built agents from the CrewForm community.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <MarketplaceFilters
          search={search}
          onSearchChange={setSearch}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          availableTags={availableTags}
          sort={sort}
          onSortChange={setSort}
        />
      </div>

      {/* Agent Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-card py-16">
          <Store className="mb-4 h-12 w-12 text-gray-600" />
          <h2 className="mb-2 text-lg font-medium text-gray-300">
            No agents found
          </h2>
          <p className="text-sm text-gray-500">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-gray-500">
            {agents.length} agent{agents.length !== 1 ? 's' : ''} found
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={setSelectedAgent}
              />
            ))}
          </div>
        </>
      )}

      {/* Detail Modal */}
      <AgentDetailModal
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
        onInstall={handleInstall}
        isInstalling={installMutation.isPending}
      />

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${toast.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="h-4 w-4" />
            : <XCircle className="h-4 w-4" />
          }
          {toast.message}
        </div>
      )}
    </div>
  )
}
