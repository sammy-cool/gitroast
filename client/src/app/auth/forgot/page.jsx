'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { forgotPassword } from '@/services/recruiterService'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setError('Enter the work email you signed up with.')
    setBusy(true)
    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="gr-status">
      <div className="gr-card gr-status__card">
        <Logo />
        <p className="gr-eyebrow">Recruiter workspace</p>
        <h1 className="gr-h2">Reset your password.</h1>
        {sent ? (
          <div className="gr-state gr-state--success" role="status">
            <span className="gr-state__tag">Check your inbox</span>
            <p className="gr-state__title">If an account exists for {email}, a reset link is on its way.</p>
            <p className="gr-help">The link works once and expires in 1 hour. Nothing arrived? Check spam, or try again in a minute.</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 12, width: '100%' }}>
            <p className="gr-lede">Enter your work email and we will send a link to choose a new password.</p>
            <label className="gr-label" htmlFor="forgot-email">Work email</label>
            <input id="forgot-email" className="gr-input" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(error)} required />
            {error && <p className="gr-error" role="alert">{error}</p>}
            <button type="submit" className="gr-btn gr-btn--primary gr-btn--block" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
          </form>
        )}
        <Link href="/auth?role=recruiter" className="gr-btn gr-btn--quiet">Back to sign in</Link>
      </div>
    </main>
  )
}
