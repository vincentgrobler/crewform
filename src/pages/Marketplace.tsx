// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { Store } from 'lucide-react'

export function Marketplace() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-3">
        <Store className="h-6 w-6 text-brand-primary" />
        <h1 className="text-2xl font-semibold text-gray-100">Marketplace</h1>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-card py-16">
        <Store className="mb-4 h-12 w-12 text-gray-600" />
        <h2 className="mb-2 text-lg font-medium text-gray-300">
          Marketplace coming soon
        </h2>
        <p className="text-sm text-gray-500">
          Browse and install pre-built agents from the community.
        </p>
      </div>
    </div>
  )
}
