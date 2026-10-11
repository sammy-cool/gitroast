'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/utils/toast'
import { useRoastHistory } from '@/hooks/useRoastHistory'
import HistoryCard from '@/components/HistoryCard'
import ScoreChart from '@/components/ScoreChart'
import MonthlyComparison from '@/components/MonthlyComparison'
import Breadcrumb from '@/components/Breadcrumb'
import Icon from '@/components/Icon'
import '@/components/roast-result.css'
import './history.css'

export default function HistoryPageClient({ username }) {
  const router = useRouter()
  const { history, loading, error, refetch, scoreTrend, bestScore, worstScore, avgScore, roastCount, hasHistory } = useRoastHistory(username)

  useEffect(() => {
    if (error) toast.error('Could not load roast history', { description: 'Nothing was changed.', action: { label: 'Retry', onClick: refetch } })
  }, [error, refetch])

  const crumbs = <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Wall of Shame', href: '/leaderboard' }, { label: `@${username}` }]} />

  if (loading) {
    return (
      <main className="hp"><div className="gr-page hp-body" role="status" aria-label="Loading history">
        {crumbs}
        <div className="gr-state gr-state--loading hp-skel" />
        <div className="hp-stats">{[1, 2, 3, 4].map((i) => <div key={i} className="gr-state gr-state--loading hp-skel hp-skel--sm" />)}</div>
        <div className="gr-state gr-state--loading hp-skel hp-skel--lg" />
      </div></main>
    )
  }

  if (error) {
    return (
      <main className="hp"><div className="gr-page hp-body">
        {crumbs}
        <div className="gr-state gr-state--error" role="alert">
          <span className="gr-state__tag">Error</span>
          <p className="gr-state__title">History is unavailable</p>
          <p className="gr-help">{error}</p>
          <div className="hp-row"><button type="button" className="gr-btn gr-btn--primary" onClick={refetch}>Try again</button><button type="button" className="gr-btn gr-btn--outline" onClick={() => router.push('/')}>Home</button></div>
        </div>
      </div></main>
    )
  }

  const stats = [
    ['Total roasts', roastCount, 'In this public history'],
    ['Best score', bestScore, 'Highest evidence score'],
    ['Lowest score', worstScore, 'Room to grow'],
    ['Average', avgScore, 'Across all roasts'],
  ]

  return (
    <main className="hp">
      <section className="hp-hero">
        <div className="gr-page hp-hero__inner">
          {crumbs}
          <div className="hp-id">
            <span className="rr-avatar hp-avatar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://avatars.githubusercontent.com/${username}?s=96`} alt="" width={64} height={64} crossOrigin="anonymous" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <b aria-hidden="true">{username[0]?.toUpperCase() || '?'}</b>
            </span>
            <div>
              <p className="gr-eyebrow hp-on-dark">Public profile • Roast history</p>
              <h1 className="hp-name">@{username}</h1>
            </div>
          </div>
          <button type="button" className="gr-btn gr-btn--primary" onClick={() => router.push(`/roast/${username}`)}><Icon name="flame" size={16} /> Roast again</button>
        </div>
      </section>

      <div className="gr-page hp-body">
        {!hasHistory ? (
          <div className="gr-state"><span className="gr-state__tag">Empty</span><p className="gr-state__title">No ashes yet</p><p className="gr-help">@{username} has not been roasted yet.</p>
            <button type="button" className="gr-btn gr-btn--primary" onClick={() => router.push(`/roast/${username}`)}>Be the first to roast them</button></div>
        ) : (
          <>
            <section className="hp-stats" aria-label="Summary">
              {stats.map(([k, v, note]) => <div key={k} className="gr-card rc-stat"><span className="gr-eyebrow rc-stat__k">{k}</span><b className="rc-stat__v">{v}</b><span className="gr-help">{note}</span></div>)}
            </section>

            <section className="gr-card" aria-labelledby="hp-trend">
              <p className="gr-eyebrow">Score trend</p>
              <h2 id="hp-trend" className="gr-h3">Visible change over time.</h2>
              {scoreTrend !== null && (
                <p className="gr-help">Last roast was <b style={{ color: scoreTrend > 0 ? 'var(--mint-ink)' : scoreTrend < 0 ? 'var(--error-ink)' : 'inherit' }}>{scoreTrend > 0 ? `${scoreTrend} pts higher` : scoreTrend < 0 ? `${Math.abs(scoreTrend)} pts lower` : 'the same'}</b> than the one before. Same methodology version throughout.</p>
              )}
              <ScoreChart history={history} />
            </section>

            <MonthlyComparison history={history} />

            <section className="gr-card" aria-labelledby="hp-all">
              <p className="gr-eyebrow">All roasts</p>
              <h2 id="hp-all" className="gr-h3">{roastCount} on record</h2>
              <ul className="hp-list">{history.map((r, i) => <HistoryCard key={r._id} roast={r} index={i} />)}</ul>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
