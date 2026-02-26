// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState } from 'react'
import { KeyRound, User, Building2, Webhook, Users, ScrollText, CreditCard } from 'lucide-react'
import { ApiKeysSettings } from '@/components/settings/ApiKeysSettings'
import { WebhooksSettings } from '@/components/settings/WebhooksSettings'
import { MembersSettings } from '@/components/settings/MembersSettings'
import { WorkspaceSettings } from '@/components/settings/WorkspaceSettings'
import { AuditLogPanel } from '@/components/settings/AuditLogPanel'
import { BillingSettings } from '@/components/settings/BillingSettings'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { cn } from '@/lib/utils'

type SettingsTab = 'api-keys' | 'webhooks' | 'members' | 'workspace' | 'billing' | 'audit-log' | 'profile'

const settingsTabs: { key: SettingsTab; label: string; icon: typeof KeyRound }[] = [
  { key: 'api-keys', label: 'API Keys', icon: KeyRound },
  { key: 'webhooks', label: 'Webhooks', icon: Webhook },
  { key: 'members', label: 'Members', icon: Users },
  { key: 'workspace', label: 'Workspace', icon: Building2 },
  { key: 'billing', label: 'Billing', icon: CreditCard },
  { key: 'audit-log', label: 'Audit Log', icon: ScrollText },
  { key: 'profile', label: 'Profile', icon: User },
]

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api-keys')

  return (
    <div className="p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-100">Settings</h1>

      {/* Tabs */}
      <div className="mb-6 flex overflow-x-auto border-b border-border">
        {settingsTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
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
      <div className={cn('mx-auto', activeTab === 'billing' ? 'max-w-4xl' : 'max-w-2xl')}>
        {activeTab === 'api-keys' && <ApiKeysSettings />}

        {activeTab === 'webhooks' && <WebhooksSettings />}

        {activeTab === 'members' && <MembersSettings />}

        {activeTab === 'workspace' && <WorkspaceSettings />}

        {activeTab === 'billing' && <BillingSettings />}

        {activeTab === 'audit-log' && <AuditLogPanel />}

        {activeTab === 'profile' && <ProfileSettings />}
      </div>
    </div>
  )
}

