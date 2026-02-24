// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

/**
 * AuthCallback handles the redirect from OAuth providers and email
 * confirmation links. Supabase appends tokens as URL hash fragments —
 * this page exchanges them for a session via onAuthStateChange.
 */
export function AuthCallback() {
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                // Successfully authenticated — redirect to dashboard
                navigate('/', { replace: true })
            } else if (event === 'PASSWORD_RECOVERY') {
                // User clicked a password reset link — redirect to reset form
                navigate('/auth/reset-password', { replace: true })
            }
        })

        // Fallback: if no auth event fires within 5s, show error
        const timeout = setTimeout(() => {
            setError('Authentication timed out. Please try again.')
        }, 5000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
    }, [navigate])

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-950">
                <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
                    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/auth', { replace: true })}
                        className="text-sm text-blue-400 hover:text-blue-300"
                    >
                        Back to sign in
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <span className="text-sm text-gray-400">Completing sign in...</span>
            </div>
        </div>
    )
}
