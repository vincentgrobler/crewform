// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState } from 'react'
import {
    Shield, BarChart3, Building2, Search,
    Loader2, Users, Bot, ListTodo, PackageOpen,
} from 'lucide-react'
import { usePlatformStats, useAllWorkspaces, useOverridePlan, useToggleBeta } from '@/hooks/useAdmin'
import { ReviewQueue } from '@/components/marketplace/ReviewQueue'
import { cn } from '@/lib/utils'

type AdminTab = 'overview' | 'workspaces' | 'review-queue'

const PLAN_COLORS: Record<string, string> = {
    free: 'text-gray-400 bg-gray-500/10',
    pro: 'text-blue-400 bg-blue-500/10',
    team: 'text-purple-400 bg-purple-500/10',
    enterprise: 'text-amber-400 bg-amber-500/10',
}

/**
 * Master Admin Panel — platform overview, workspace management.
 */
export function AdminPanel() {
    const [activeTab, setActiveTab] = useState<AdminTab>('overview')

    return (
        <div className="min-h-screen bg-surface-primary p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                    <Shield className="h-5 w-5 text-red-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-100">Admin Panel</h1>
                    <p className="text-xs text-gray-500">Super administrator dashboard</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex border-b border-border">
                {([
                    { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
                    { key: 'workspaces' as const, label: 'Workspaces', icon: Building2 },
                    { key: 'review-queue' as const, label: 'Review Queue', icon: PackageOpen },
                ] as const).map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setActiveTab(key)}
                        className={cn(
                            'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                            activeTab === key
                                ? 'border-red-400 text-gray-200'
                                : 'border-transparent text-gray-500 hover:text-gray-300',
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'workspaces' && <WorkspacesTab />}
            {activeTab === 'review-queue' && <ReviewQueue />}
        </div>
    )
}

// ─── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab() {
    const { data: stats, isLoading } = usePlatformStats()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
        )
    }

    const statCards = [
        { label: 'Workspaces', value: stats?.totalWorkspaces ?? 0, icon: Building2, color: 'text-blue-400 bg-blue-500/10' },
        { label: 'Agents', value: stats?.totalAgents ?? 0, icon: Bot, color: 'text-cyan-400 bg-cyan-500/10' },
        { label: 'Tasks', value: stats?.totalTasks ?? 0, icon: ListTodo, color: 'text-green-400 bg-green-500/10' },
    ]

    return (
        <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                {statCards.map((card) => (
                    <div key={card.label} className="rounded-xl border border-border bg-surface-card p-5">
                        <div className="mb-3 flex items-center gap-2">
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', card.color)}>
                                <card.icon className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                {card.label}
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-gray-100">{card.value.toLocaleString()}</p>
                    </div>
                ))}
            </div>

            {/* Plan breakdown */}
            {stats?.planBreakdown && stats.planBreakdown.length > 0 && (
                <div className="rounded-xl border border-border bg-surface-card p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-200">
                        <Users className="h-4 w-4 text-gray-500" />
                        Plan Distribution
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {stats.planBreakdown.map(({ plan, count }) => (
                            <div key={plan} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase', PLAN_COLORS[plan] ?? PLAN_COLORS.free)}>
                                    {plan}
                                </span>
                                <span className="text-sm font-medium text-gray-200">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Workspaces Tab ─────────────────────────────────────────────────────────

function WorkspacesTab() {
    const { data: workspaces, isLoading } = useAllWorkspaces()
    const overrideMutation = useOverridePlan()
    const betaMutation = useToggleBeta()
    const [search, setSearch] = useState('')

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
        )
    }

    const filtered = workspaces?.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.slug.toLowerCase().includes(search.toLowerCase()),
    ) ?? []

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search workspaces..."
                    className="w-full rounded-lg border border-border bg-surface-card py-2.5 pl-10 pr-4 text-sm text-gray-200 outline-none focus:border-brand-primary"
                />
            </div>

            {/* Workspace list */}
            <div className="rounded-xl border border-border bg-surface-card divide-y divide-border/50">
                {filtered.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">No workspaces found</div>
                ) : (
                    filtered.map((ws) => (
                        <div key={ws.id} className="flex items-center gap-4 px-4 py-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-200">{ws.name}</p>
                                <p className="text-xs text-gray-500">/{ws.slug} · {ws.member_count} members</p>
                            </div>
                            <select
                                value={ws.subscription_plan ?? 'free'}
                                onChange={(e) => overrideMutation.mutate({
                                    workspaceId: ws.id,
                                    plan: e.target.value,
                                })}
                                disabled={overrideMutation.isPending}
                                className={cn(
                                    'rounded-md border border-transparent px-2 py-1 text-xs font-bold uppercase outline-none',
                                    PLAN_COLORS[ws.subscription_plan ?? 'free'],
                                )}
                            >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="team">Team</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                            <label className="flex cursor-pointer items-center gap-1.5">
                                <input
                                    type="checkbox"
                                    checked={ws.is_beta}
                                    onChange={() => betaMutation.mutate({
                                        workspaceId: ws.id,
                                        isBeta: !ws.is_beta,
                                    })}
                                    disabled={betaMutation.isPending}
                                    className="h-3.5 w-3.5 rounded border-border accent-brand-primary"
                                />
                                <span className={cn(
                                    'text-[10px] font-bold uppercase',
                                    ws.is_beta ? 'text-emerald-400' : 'text-gray-600',
                                )}>
                                    Beta
                                </span>
                            </label>
                            <span className="text-xs text-gray-600">
                                {new Date(ws.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
