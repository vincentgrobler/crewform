// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState, useDeferredValue } from 'react'
import { Store, Loader2 } from 'lucide-react'
import { useMarketplaceAgents, useMarketplaceTags } from '@/hooks/useMarketplace'
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

  // Debounce search for smoother UX
  const deferredSearch = useDeferredValue(search)

  // ─── Data ────────────────────────────────────────────────────────────────
  const { agents, isLoading } = useMarketplaceAgents({
    search: deferredSearch,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    sort,
  })
  const { tags: availableTags } = useMarketplaceTags()

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const handleInstall = (agent: Agent) => {
    // Will be implemented in Ticket 5.3
    console.log('[Marketplace] Install agent:', agent.id, agent.name)
    setSelectedAgent(null)
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
      />
    </div>
  )
}
