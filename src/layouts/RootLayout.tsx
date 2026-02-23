// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Bot,
  Users,
  ListTodo,
  Store,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/teams', icon: Users, label: 'Teams' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/marketplace', icon: Store, label: 'Marketplace' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const

export function RootLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-primary">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-border bg-surface-card">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary font-bold text-white">
            C
          </div>
          <span className="text-lg font-semibold text-gray-100">CrewForm</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-l-2 border-brand-primary bg-surface-elevated text-gray-100'
                    : 'text-gray-400 hover:bg-surface-overlay hover:text-gray-200',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-sm font-medium text-gray-300">
              U
            </div>
            <span className="text-sm text-gray-400">User</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
