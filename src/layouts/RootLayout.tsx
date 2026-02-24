// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState, useCallback, useEffect, Suspense } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Bot,
  Users,
  ListTodo,
  Store,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNav } from '@/components/layout/MobileNav'
import { PageSkeleton } from '@/components/ui/PageSkeleton'

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
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>
  const displayName = (typeof metadata.full_name === 'string' ? metadata.full_name : null)
    ?? (typeof metadata.name === 'string' ? metadata.name : null)
    ?? user?.email
    ?? 'User'

  const avatarInitial = displayName.charAt(0).toUpperCase()
  const avatarUrl = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  // Collapsed mode: icon-only on tablet
  const collapsed = isTablet

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Backdrop overlay for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-gray-800 bg-gray-900 transition-all duration-200',
          // Desktop: full sidebar
          !isMobile && !collapsed && 'w-64',
          // Tablet: collapsed icon-only sidebar
          !isMobile && collapsed && 'w-16',
          // Mobile: slide-over drawer
          isMobile && 'fixed inset-y-0 left-0 z-50 w-64',
          isMobile && sidebarOpen && 'translate-x-0',
          isMobile && !sidebarOpen && '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex h-14 shrink-0 items-center border-b border-gray-800',
          collapsed ? 'justify-center px-2' : 'gap-2 px-6',
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
            C
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-gray-100">CrewForm</span>
          )}
          {/* Close button for mobile drawer */}
          {isMobile && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="ml-auto rounded-lg p-1 text-gray-400 hover:text-gray-200"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 space-y-1 py-4', collapsed ? 'px-2' : 'px-3')}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg text-sm font-medium transition-colors',
                  collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                  isActive
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200',
                )
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* User footer — hidden when collapsed */}
        {!collapsed && (
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
        )}

        {/* Collapsed footer — just sign out icon */}
        {collapsed && (
          <div className="border-t border-gray-800 p-2">
            <button
              type="button"
              onClick={() => void signOut()}
              title="Sign out"
              className="flex w-full items-center justify-center rounded-lg p-2.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </aside>

      {/* Main content area */}
      <div className={cn('flex flex-1 flex-col overflow-hidden', isMobile && 'pb-14')}>
        {/* Top bar */}
        <TopBar onMenuToggle={toggleSidebar} isMobile={isMobile} />

        {/* Page content with skeleton fallback */}
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      {isMobile && <MobileNav />}
    </div>
  )
}
