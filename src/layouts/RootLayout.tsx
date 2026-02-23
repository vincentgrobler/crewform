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
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/teams', icon: Users, label: 'Teams' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/marketplace', icon: Store, label: 'Marketplace' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const

export function RootLayout() {
  const { user, signOut } = useAuth()

  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>
  const displayName = (typeof metadata.full_name === 'string' ? metadata.full_name : null)
    ?? (typeof metadata.name === 'string' ? metadata.name : null)
    ?? user?.email
    ?? 'User'

  const avatarInitial = displayName.charAt(0).toUpperCase()
  const avatarUrl = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-800 bg-gray-900">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-gray-800 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
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
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-sm font-medium text-gray-300">
                {avatarInitial}
              </div>
            )}
            <div className="flex-1 truncate">
              <p className="truncate text-sm text-gray-300">{displayName}</p>
              {user?.email && displayName !== user.email && (
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              title="Sign out"
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
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
