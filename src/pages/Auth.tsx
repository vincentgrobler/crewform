// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

export function Auth() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface-card p-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary text-xl font-bold text-white">
            C
          </div>
          <h1 className="text-2xl font-semibold text-gray-100">CrewForm</h1>
          <p className="mt-2 text-sm text-gray-400">Form your crew</p>
        </div>

        {/* Login form placeholder */}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <button
            type="button"
            className="w-full rounded-lg bg-brand-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            Sign In
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface-card px-2 text-gray-500">or continue with</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full rounded-lg border border-border bg-surface-elevated py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-surface-overlay"
          >
            Sign in with Google
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Don&apos;t have an account?{' '}
          <a href="#" className="text-brand-primary hover:text-brand-hover">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
