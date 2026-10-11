import Link from 'next/link'

const tone = (s) => (s >= 70 ? 'mint' : s >= 40 ? 'gold' : 'ember')

export default function HistoryCard({ roast, index }) {
  if (!roast) return null
  const when = roast.createdAt ? new Date(roast.createdAt) : null
  const date = when ? when.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'
  const text = roast.roastText || ''
  const hasPlan = Array.isArray(roast.redemptionPlan) && roast.redemptionPlan.length > 0

  return (
    <li className="hc">
      <span className="hc__idx gr-mono">#{index + 1}</span>
      <span className={`gr-pill gr-pill--${tone(roast.score)} hc__score`}>{roast.score} • {roast.grade}</span>
      <p className="hc__text">&ldquo;{text.length > 140 ? `${text.slice(0, 140)}…` : text}&rdquo;</p>
      <p className="hc__meta gr-mono">
        {date}
        {roast.roastSource === 'ai' && ' • AI'}
        {hasPlan && ' • Redemption plan'}
        {roast.githubSnapshot?.topLanguage && ` • ${roast.githubSnapshot.topLanguage}`}
      </p>
      <style jsx>{`
        .hc { list-style: none; display: grid; grid-template-columns: 44px auto 1fr; gap: 6px 14px; align-items: center; padding: 16px 0; border-top: 1px solid var(--line); }
        .hc__idx { font-size: 12px; color: var(--ink-3); }
        .hc__text { grid-column: 3; font-size: 15px; color: var(--ink); }
        .hc__meta { grid-column: 3; font-size: 11px; color: var(--ink-3); }
        .hc__score { grid-row: span 2; }
        @media (max-width: 560px) { .hc { grid-template-columns: auto 1fr; } .hc__idx { display: none; } .hc__text, .hc__meta { grid-column: 1 / -1; } .hc__score { grid-row: auto; } }
      `}</style>
    </li>
  )
}
