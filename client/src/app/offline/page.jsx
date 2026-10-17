'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function OfflinePage() {
  const [saved, setSaved] = useState(null)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('gitroast_last_roast')
      if (raw) setSaved(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  return (
    <main className="gr-status">
      <div className="gr-card gr-card--gold gr-status__card" role="status">
        <p className="gr-eyebrow">Offline</p>
        <h1 className="gr-h2">You are offline. Saved results still work.</h1>
        <p className="gr-lede">Fresh analysis needs a connection. Your last saved roast is below.</p>
        {saved ? (
          <div className="gr-card" style={{ width: '100%' }}>
            <p className="gr-eyebrow">Last saved roast</p>
            <p className="gr-h3">@{saved.username} • {saved.score}/100 • Grade {saved.grade}</p>
            <p className="gr-help">&ldquo;{saved.headline}&rdquo;</p>
            <p className="gr-help gr-mono">Saved {new Date(saved.savedAt).toLocaleString()}</p>
          </div>
        ) : (
          <p className="gr-help">Nothing saved yet. Run a roast while online and it will appear here.</p>
        )}
        <div className="gr-status__actions">
          <button type="button" className="gr-btn gr-btn--primary" onClick={() => window.location.reload()}>Try again</button>
          <Link href="/" className="gr-btn gr-btn--outline">Home</Link>
        </div>
      </div>
    </main>
  )
}
