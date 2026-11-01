'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { toast } from '@/utils/toast'
import { resetPassword } from '@/services/recruiterService'

export default function ResetPasswordClient() {
  const router = useRouter()
  const token = useSearchParams().get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(!token)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 10) return setError('Use at least 10 characters.')
    if (password.length > 128) return setError('Use at most 128 characters.')
    if (password !== confirm) return setError('The two passwords do not match.')
    setBusy(true)
    try {
      await resetPassword({ token, password })
      toast.success('Password updated', { description: 'Sign in with your new password. Other sessions were signed out.' })
      router.replace('/auth?role=recruiter')
    } catch (err) {
      if (err.code === 'INVALID_TOKEN') setExpired(true)
      else setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="gr-status">
      <div className="gr-card gr-status__card">
        <Logo />
        <p className="gr-eyebrow">Recruiter workspace</p>
        <h1 className="gr-h2">Choose a new password.</h1>
        {expired ? (
          <div className="gr-state gr-state--error" role="alert">
            <span className="gr-state__tag">Link problem</span>
            <p className="gr-state__title">This reset link is invalid or has expired.</p>
            <p className="gr-help">Links work once and expire after 1 hour. Request a new one.</p>
            <Link href="/auth/forgot" className="gr-btn gr-btn--primary">Request a new link</Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 12, width: '100%' }}>
            <label className="gr-label" htmlFor="new-password">New password</label>
            <input id="new-password" className="gr-input" type="password" autoComplete="new-password" minLength={10} placeholder="At least 10 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <label className="gr-label" htmlFor="confirm-password">Confirm password</label>
            <input id="confirm-password" className="gr-input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            {error && <p className="gr-error" role="alert">{error}</p>}
            <button type="submit" className="gr-btn gr-btn--primary gr-btn--block" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
          </form>
        )}
      </div>
    </main>
  )
}
