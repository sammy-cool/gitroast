'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { verifyEmail } from '@/services/recruiterService'

export default function VerifyEmailClient() {
  const token = useSearchParams().get('token') || ''
  const [state, setState] = useState(token ? 'working' : 'invalid')
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true // links are single-use: never call twice (React strict mode)
    verifyEmail(token)
      .then(() => setState('done'))
      .catch((err) => setState(err.code === 'INVALID_TOKEN' ? 'invalid' : 'error'))
  }, [token])

  return (
    <main className="gr-status">
      <div className="gr-card gr-status__card" role="status" aria-live="polite">
        <Logo />
        <p className="gr-eyebrow">Recruiter workspace</p>
        {state === 'working' && (<><h1 className="gr-h2">Verifying your email…</h1><span className="gr-spinner" aria-hidden="true" /></>)}
        {state === 'done' && (
          <>
            <h1 className="gr-h2">Email verified.</h1>
            <p className="gr-lede">Your recruiter workspace is ready.</p>
            {/* full navigation so the app reloads the signed-in profile with the verified flag */}
            <a href="/recruiter" className="gr-btn gr-btn--primary">Open workspace</a>
          </>
        )}
        {state === 'invalid' && (
          <>
            <h1 className="gr-h2">This link is invalid or has expired.</h1>
            <p className="gr-lede">Verification links expire after 24 hours and work once. Sign in and request a new one from your workspace.</p>
            <Link href="/auth?role=recruiter" className="gr-btn gr-btn--primary">Sign in</Link>
          </>
        )}
        {state === 'error' && (
          <>
            <h1 className="gr-h2">Could not verify right now.</h1>
            <p className="gr-lede">Nothing was changed. Try the link again in a moment.</p>
            <button type="button" className="gr-btn gr-btn--primary" onClick={() => window.location.reload()}>Try again</button>
          </>
        )}
      </div>
    </main>
  )
}
