'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast, toastPromise, notify } from '@/utils/toast'
import { useAuth } from '@/context/AuthContext'
import { trackBattleShare, trackBattleView } from '@/services/roastService'
import RoastReactions from './RoastReactions'
import './battle.css'

const TAPE = [
  ['Total repositories', 'totalRepos'],
  ['Abandoned repositories', 'abandonedRepos'],
  ['Total stars', 'totalStars'],
  ['Top language', 'topLanguage'],
  ['Commit quality', 'commitQuality'],
  ['Member since', 'joinYear'],
]

function Player({ name, score, grade, roast, mostRoastable, side }) {
  return (
    <div className={`bt-player${mostRoastable ? ' bt-player--worst' : ''}`} data-side={side}>
      {mostRoastable && <span className="gr-pill gr-pill--ember">Most roastable</span>}
      <span className="rr-avatar bt-avatar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://avatars.githubusercontent.com/${name}?s=120`} alt="" width={64} height={64} crossOrigin="anonymous" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <b aria-hidden="true">{String(name || '?').slice(0, 2).toUpperCase()}</b>
      </span>
      <Link href={`/history/${name}`} className="bt-name">@{name}</Link>
      <p className="bt-score">{score}<small>/100 • {grade}</small></p>
      <p className="bt-roast">&ldquo;{roast?.slice(0, 100)}{roast?.length > 100 ? '…' : ''}&rdquo;</p>
      <Link href={`/history/${name}`} className="rr-evidence">Full roast →</Link>
    </div>
  )
}

export default function BattleCard({ data }) {
  const { user } = useAuth()
  const isPro = Boolean(user?.isPro)
  const [downloading, setDownloading] = useState(false)
  const { user1, user2, winner, score1, score2, grade1, grade2, battleRoast, roast1, roast2, stats1, stats2 } = data || {}
  const battleTargetId = data?._id || data?.battleId || (user1 && user2 ? `${user1}-vs-${user2}` : null)
  const isUser1Winner = winner === user1

  useEffect(() => { if (battleTargetId) trackBattleView(battleTargetId) }, [battleTargetId])
  if (!data || !user1 || !user2) return null

  const track = () => battleTargetId && trackBattleShare(battleTargetId)

  function handleShare() {
    track()
    const tweet = `Just challenged @${user2} to a @GitRoast battle. Commit hygiene: ${stats1?.commitHygiene || '0%'} vs ${stats2?.commitHygiene || '0%'}.\n\nCheck the verdict or challenge a rival: ${window.location.href} #GitRoast #DevCommunity`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank', 'noopener,noreferrer')
  }

  function handleChallengeCopy() {
    track()
    navigator.clipboard
      .writeText(`I challenged @${user2} to a GitRoast battle. Check who writes cleaner code: ${window.location.href}`)
      .then(() => notify.copied({ what: 'Challenge invitation' }))
      .catch(() => toast.error('Could not copy the invitation'))
  }

  function handleCopyLink() {
    track()
    navigator.clipboard.writeText(window.location.href).then(() => notify.copied({ what: 'Battle link' })).catch(() => toast.error('Could not copy the link'))
  }

  async function handleDownload() {
    if (downloading) return
    setDownloading(true)
    try {
      await toastPromise(
        (async () => {
          const html2canvas = (await import('html2canvas')).default
          const element = document.getElementById('battle-card-capture')
          if (!element) throw new Error('Battle card element not found')
          const canvas = await html2canvas(element, { scale: isPro ? 2 : 1, useCORS: true, backgroundColor: '#171711', logging: false, windowWidth: element.scrollWidth, windowHeight: element.scrollHeight })
          if (!isPro) {
            const ctx = canvas.getContext('2d')
            ctx.save()
            ctx.globalAlpha = 0.16
            ctx.fillStyle = '#E84E2A'
            ctx.font = 'bold 36px "IBM Plex Mono", monospace'
            ctx.textAlign = 'center'
            for (let y = -100; y < canvas.height + 100; y += 180) {
              for (let x = -100; x < canvas.width + 100; x += 260) {
                ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 6); ctx.fillText('ROASTED BY GITROAST', 0, 0); ctx.restore()
              }
            }
            ctx.restore()
          }
          const link = document.createElement('a')
          link.download = `battle-${user1}-vs-${user2}.png`
          link.href = canvas.toDataURL('image/png')
          document.body.appendChild(link); link.click(); document.body.removeChild(link)
        })(),
        { loading: 'Rendering battle card…', success: isPro ? 'HD battle card saved' : 'Battle card saved', error: 'Could not export the battle card. Please try again.' },
      )
      track()
    } catch { /* toast already shown */ } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="bt">
      <div id="battle-card-capture" className="bt-capture">
        <header className="bt-head">
          <div>
            <p className="gr-eyebrow bt-on-dark">Developer battle</p>
            <h1 className="bt-title">Two profiles entered. The evidence decided.</h1>
          </div>
          <div className="bt-head__meta">
            <span className="gr-mono">gitroast.dev</span>
            {data.rematchCount > 0 && <span className="gr-pill gr-pill--gold">Rematch #{data.rematchCount}</span>}
          </div>
        </header>

        <div className="bt-players">
          <Player name={user1} score={score1} grade={grade1} roast={roast1} mostRoastable={Boolean(winner) && isUser1Winner} side="left" />
          <div className="bt-vs" aria-hidden="true"><span>VS</span>{winner && <small>{isUser1Winner ? '←' : '→'}</small>}</div>
          <Player name={user2} score={score2} grade={grade2} roast={roast2} mostRoastable={Boolean(winner) && !isUser1Winner} side="right" />
        </div>

        {(stats1 || stats2) && (
          <section className="bt-tape" aria-label="Tale of the tape">
            <p className="gr-eyebrow bt-on-dark">Tale of the tape</p>
            <dl>
              {TAPE.map(([label, key]) => (
                <div key={key} className="bt-tape__row">
                  <dd className="left">{stats1?.[key] ?? '—'}</dd>
                  <dt>{label}</dt>
                  <dd className="right">{stats2?.[key] ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {battleRoast && (
          <section className="bt-verdict">
            <p className="gr-eyebrow">The verdict</p>
            <p className="bt-verdict__text">&ldquo;{battleRoast}&rdquo;</p>
          </section>
        )}

        <p className="bt-winner">{winner ? `@${winner} is the most roastable.` : 'It is a draw — equally roasted.'}</p>
      </div>

      {battleTargetId && (
        <section className="gr-card"><RoastReactions roastId={battleTargetId} initialReactions={data.reactions || {}} targetType="battle" /></section>
      )}

      <div className="rr-actions">
        <button type="button" className="gr-btn gr-btn--primary" onClick={handleShare}>Tweet challenge</button>
        <button type="button" className="gr-btn gr-btn--outline" onClick={handleChallengeCopy}>Challenge rival</button>
        <button type="button" className="gr-btn gr-btn--outline" onClick={handleDownload} disabled={downloading}>{downloading ? 'Rendering…' : 'Save card'}</button>
        <button type="button" className="gr-btn gr-btn--quiet" onClick={handleCopyLink}>Copy link</button>
      </div>
      <nav className="bt-rematch" aria-label="Rematch options">
        <Link href={`/battle/${user1}/vs/${user2}?rematch=true`} className="rc-link">Rematch</Link>
        <Link href={`/battle/${user2}/vs/${user1}?rematch=true`} className="rc-link">Swap and rematch</Link>
        <Link href="/battle" className="rc-link">New battle</Link>
      </nav>
    </div>
  )
}
