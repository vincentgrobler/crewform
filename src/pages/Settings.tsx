// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { Settings as SettingsIcon } from 'lucide-react'

export function Settings() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-brand-primary" />
        <h1 className="text-2xl font-semibold text-gray-100">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <div className="rounded-lg border border-border bg-surface-card p-6">
          <h2 className="mb-4 text-lg font-medium text-gray-200">Profile</h2>
          <p className="text-sm text-gray-500">
            Profile settings will be available here.
          </p>
        </div>

        {/* API Keys */}
        <div className="rounded-lg border border-border bg-surface-card p-6">
          <h2 className="mb-4 text-lg font-medium text-gray-200">API Keys</h2>
          <p className="text-sm text-gray-500">
            Configure your BYOK API keys for Anthropic, Google, and OpenAI.
          </p>
        </div>

        {/* Workspace */}
        <div className="rounded-lg border border-border bg-surface-card p-6">
          <h2 className="mb-4 text-lg font-medium text-gray-200">Workspace</h2>
          <p className="text-sm text-gray-500">
            Workspace configuration will be available here.
          </p>
        </div>
      </div>
    </div>
  )
}
