// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState } from 'react'
import { KeyRound, User, Building2, Webhook } from 'lucide-react'
import { ApiKeysSettings } from '@/components/settings/ApiKeysSettings'
import { WebhooksSettings } from '@/components/settings/WebhooksSettings'
import { cn } from '@/lib/utils'

type SettingsTab = 'api-keys' | 'webhooks' | 'profile' | 'workspace'

const settingsTabs: { key: SettingsTab; label: string; icon: typeof KeyRound }[] = [
  { key: 'api-keys', label: 'API Keys', icon: KeyRound },
  { key: 'webhooks', label: 'Webhooks', icon: Webhook },
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'workspace', label: 'Workspace', icon: Building2 },
]

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api-keys')

  return (
    <div className="p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-100">Settings</h1>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-border">
        {settingsTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === key
                ? 'border-brand-primary text-gray-200'
                : 'border-transparent text-gray-500 hover:text-gray-300',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-2xl">
        {activeTab === 'api-keys' && <ApiKeysSettings />}

        {activeTab === 'webhooks' && <WebhooksSettings />}

        {activeTab === 'profile' && (
          <div className="rounded-lg border border-border bg-surface-card p-8 text-center">
            <User className="mx-auto mb-3 h-10 w-10 text-gray-600" />
            <h3 className="mb-1 text-lg font-medium text-gray-300">Profile Settings</h3>
            <p className="text-sm text-gray-500">
              Avatar upload, display name, and timezone settings coming in Phase 2.
            </p>
          </div>
        )}

        {activeTab === 'workspace' && (
          <div className="rounded-lg border border-border bg-surface-card p-8 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-600" />
            <h3 className="mb-1 text-lg font-medium text-gray-300">Workspace Settings</h3>
            <p className="text-sm text-gray-500">
              Workspace name, slug, and danger zone coming in Phase 2.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
