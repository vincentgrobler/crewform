// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { Users } from 'lucide-react'

export function Teams() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-brand-primary" />
          <h1 className="text-2xl font-semibold text-gray-100">Teams</h1>
        </div>
        <button
          type="button"
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          + New Team
        </button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-card py-16">
        <Users className="mb-4 h-12 w-12 text-gray-600" />
        <h2 className="mb-2 text-lg font-medium text-gray-300">
          No teams yet
        </h2>
        <p className="mb-4 max-w-md text-center text-sm text-gray-500">
          Teams let multiple agents work together — in sequence, under a coordinator, or collaboratively.
        </p>
      </div>
    </div>
  )
}
