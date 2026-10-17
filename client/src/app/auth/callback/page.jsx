'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { toast, notify } from '@/utils/toast'

const ERRORS = {
  csrf_detected: 'Security verification failed. Please try again.',
  access_denied: 'GitHub sign-in was cancelled.',
  token_failed: 'Sign-in failed. Please try again.',
  server_error: 'Something went wrong. Please try again.',
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginWithToken } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const authError = searchParams.get('auth_error')

    if (authError || !token) {
      toast.error('GitHub sign-in failed', { description: ERRORS[authError] || 'Sign-in failed. Please try again.' })
      router.replace('/')
      return
    }

    loginWithToken(token)
    notify.signedIn()
    router.replace('/dashboard')
  }, [searchParams, loginWithToken, router])

  return (
    <main className="gr-status" role="status" aria-live="polite">
      <div className="gr-status__card" style={{ justifyItems: 'center', textAlign: 'center' }}>
        <span className="gr-spinner" aria-hidden="true" />
        <p className="gr-eyebrow">Signing in</p>
        <p className="gr-help">Connecting your GitHub…</p>
      </div>
    </main>
  )
}
