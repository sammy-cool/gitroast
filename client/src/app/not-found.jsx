import Link from 'next/link'

export const metadata = { title: 'Page not found — GitRoast', robots: { index: false, follow: true } }

export default function NotFound() {
  return (
    <main className="gr-status">
      <div className="gr-card gr-status__card">
        <p className="gr-eyebrow">Error 404</p>
        <p className="gr-status__code" aria-hidden="true">404</p>
        <h1 className="gr-h2">This page has fewer commits than your side project.</h1>
        <p className="gr-lede">The link may be old, mistyped or removed. Nothing was lost — try one of these instead.</p>
        <div className="gr-status__actions">
          <Link href="/" className="gr-btn gr-btn--primary">Roast someone instead</Link>
          <Link href="/leaderboard" className="gr-btn gr-btn--outline">Wall of Shame</Link>
        </div>
      </div>
    </main>
  )
}
