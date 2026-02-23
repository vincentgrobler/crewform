// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { Bot } from 'lucide-react'

export function Agents() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-brand-primary" />
          <h1 className="text-2xl font-semibold text-gray-100">Agents</h1>
        </div>
        <button
          type="button"
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          + New Agent
        </button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-card py-16">
        <Bot className="mb-4 h-12 w-12 text-gray-600" />
        <h2 className="mb-2 text-lg font-medium text-gray-300">
          No agents yet
        </h2>
        <p className="text-sm text-gray-500">
          Create your first agent to get started.
        </p>
      </div>
    </div>
  )
}
