// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { LayoutDashboard } from 'lucide-react'

export function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-3">
        <LayoutDashboard className="h-6 w-6 text-brand-primary" />
        <h1 className="text-2xl font-semibold text-gray-100">Dashboard</h1>
      </div>

      {/* Stats bar placeholder */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['Tasks This Month', 'Tasks Running', 'Completed Today', 'Est. Cost'].map((label) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-surface-card p-6"
          >
            <p className="text-sm text-gray-400">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-100">—</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-card py-16">
        <LayoutDashboard className="mb-4 h-12 w-12 text-gray-600" />
        <h2 className="mb-2 text-lg font-medium text-gray-300">
          Welcome to CrewForm
        </h2>
        <p className="text-sm text-gray-500">
          Form your crew. Get started by creating your first agent.
        </p>
      </div>
    </div>
  )
}
