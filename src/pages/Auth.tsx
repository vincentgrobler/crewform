// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'

export function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const { user, loading, signIn, signUp, signInWithOAuth } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
            C
          </div>
          <h1 className="text-2xl font-semibold text-gray-100">CrewForm</h1>
          <p className="mt-2 text-sm text-gray-400">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {mode === 'login' ? (
          <LoginForm
            onSignIn={signIn}
            onOAuth={signInWithOAuth}
            onToggle={() => setMode('signup')}
          />
        ) : (
          <SignupForm
            onSignUp={signUp}
            onToggle={() => setMode('login')}
          />
        )}
      </div>
    </div>
  )
}
