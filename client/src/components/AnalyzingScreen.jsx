'use client'

import { useState, useEffect } from 'react'

const ANALYSIS_STEPS = [
  { text: 'Connecting to GitHub', delay: 0 },
  { text: 'Fetching public repositories', delay: 700 },
  { text: 'Reading commit messages', delay: 1400 },
  { text: 'Judging README quality', delay: 2100 },
  { text: 'Counting abandoned repositories', delay: 2800 },
  { text: 'Analyzing language choices', delay: 3500 },
  { text: 'Weighing public evidence', delay: 4200 },
  { text: 'Writing the roast', delay: 4900 },
]

export default function AnalyzingScreen({ username }) {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    const timers = ANALYSIS_STEPS.map((s, i) => setTimeout(() => setVisible(i + 1), s.delay))
    return () => timers.forEach(clearTimeout)
  }, [])

  const progress = Math.round((visible / ANALYSIS_STEPS.length) * 100)
  const current = ANALYSIS_STEPS[Math.max(0, visible - 1)]

  return (
    <div className="an" role="status" aria-live="polite">
      <div className="gr-state gr-state--loading an__card">
        <span className="gr-state__tag">Loading</span>
        <h1 className="an__title">Reading the receipts…</h1>
        <p className="gr-help an__sub">Analyzing public activity for <b className="gr-mono">{username}</b>. This usually takes about 18 seconds.</p>

        <div className="gr-meter">
          <div className="gr-meter__head"><span>{current.text}</span><b>{progress}%</b></div>
          <div className="gr-meter__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Analysis progress">
            <div className="gr-meter__fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <ol className="an__steps" aria-hidden="true">
          {ANALYSIS_STEPS.slice(0, visible).map((s, i) => (
            <li key={s.text} className={i === visible - 1 ? 'an__step an__step--on' : 'an__step'}>{s.text}{i < visible - 1 ? ' ✓' : '…'}</li>
          ))}
        </ol>
      </div>

      <style jsx>{`
        .an { min-height: 70vh; display: grid; place-items: center; padding: 32px 16px; }
        .an__card { width: min(520px, 100%); display: grid; gap: 16px; padding: 28px; }
        .an__title { font: 400 clamp(32px, 5vw, 44px)/1.05 var(--font-serif); }
        .an__sub { margin: 0; }
        .an__steps { list-style: none; display: grid; gap: 6px; font: 400 12px var(--font-code); color: var(--ink-2); }
        .an__step--on { color: var(--ink); font-weight: 600; }
      `}</style>
    </div>
  )
}
