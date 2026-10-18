'use client'


import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getUniverse } from '@/services/roastService'
import { toast, notify } from '@/utils/toast'
import { playClick, playSuccess, playCosmicChime, playWarpSpeed } from '@/utils/soundFX'
import SoundToggle from '@/components/SoundToggle'
import { useAuth } from '@/context/AuthContext'
import Icon from '@/components/Icon'
import './universe.css'

const CodeSolarSystem = dynamic(
  () => import('@/components/universe/CodeSolarSystem'),
  { ssr: false }
)

export default function UniversePageClient({ username }) {
  const router = useRouter()
  const { getToken } = useAuth()
  const [universeData, setUniverseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPlanet, setSelectedPlanet] = useState(null)
  // Reduced motion: no auto-orbit and frozen planets until the person turns motion on.
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [isCinematic, setIsCinematic] = useState(!reduced)
  const [speedMultiplier, setSpeedMultiplier] = useState(reduced ? 0 : 1)
  const [warpTarget, setWarpTarget] = useState('')
  const [isWarping, setIsWarping] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    const token = getToken ? getToken() : null

    getUniverse(username, token)
      .then((data) => {
        if (!cancelled) {
          setUniverseData(data.universe)
          setLoading(false)
          toast.info(`Entered @${username}'s solar system`, { description: 'Drag to orbit. Select a planet to inspect it.', duration: 4000 })
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to initialize solar system.')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [username, getToken])

  const handleSelectPlanet = useCallback((planet) => {
    playCosmicChime()
    setSelectedPlanet(planet)
  }, [])

  const handleWarpSubmit = useCallback((e) => {
    e.preventDefault()
    const target = warpTarget.trim().replace(/^@/, '')
    if (!target) return

    playWarpSpeed()
    setIsWarping(true)
    setTimeout(() => {
      router.push(`/universe/${encodeURIComponent(target)}`)
    }, 450)
  }, [warpTarget, router])

  const handleShare = useCallback(() => {
    playSuccess()
    const url = typeof window !== 'undefined' ? window.location.href : `https://gitroast.dev/universe/${username}`
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true)
      notify.copied({ what: 'Solar system link' })
      setTimeout(() => setIsCopied(false), 2500)
    }).catch(() => {})
  }, [username])

  const TYPE_LABEL = {
    black_hole: 'Singularity',
    inferno: 'Volcanic magma',
    habitable: 'Habitable biosphere',
    gas_giant: 'Ringed gas giant',
    frozen_ice: 'Cryo world',
    barren_rock: 'Barren rock',
  }
  const SPEEDS = [0, 1, 2, 5]
  const speedLabel = speedMultiplier === 0 ? 'Motion off' : `${speedMultiplier}x speed`
  const metrics = universeData?.systemMetrics

  return (
    <main className="uv">
      {!loading && !error && universeData && (
        <CodeSolarSystem
          universeData={universeData}
          selectedPlanetId={selectedPlanet?.id || null}
          onSelectPlanet={handleSelectPlanet}
          isCinematic={isCinematic}
          speedMultiplier={speedMultiplier}
        />
      )}

      {isWarping && <div className="uv-flash" aria-hidden="true" />}

      <header className="uv-top">
        <div className="uv-top__left">
          <Link href="/universe" className="uv-back" aria-label="Back to Repository Universe">← Universe</Link>
          <div>
            <span className="uv-badge" style={{ borderColor: universeData?.star?.starColor || 'var(--ember)' }}>{universeData?.star?.spectralClass || 'Star system'}</span>
            <h1 className="uv-title">@{username}&apos;s cosmos</h1>
          </div>
        </div>

        <form onSubmit={handleWarpSubmit} className="uv-warp" role="search">
          <label className="gr-sr-only" htmlFor="uv-warp-input">Warp to another GitHub username</label>
          <input id="uv-warp-input" type="text" className="uv-input" placeholder="Warp to @username" value={warpTarget} onChange={(e) => setWarpTarget(e.target.value)} maxLength={39} spellCheck={false} autoCapitalize="off" autoComplete="off" />
          <button type="submit" className="uv-btn uv-btn--ember">Warp</button>
        </form>

        <div className="uv-top__right">
          <button type="button" className="uv-btn" onClick={handleShare}>{isCopied ? 'Copied' : 'Share'}</button>
          <SoundToggle />
        </div>
      </header>

      {metrics && !loading && (
        <aside className="uv-metrics" aria-label="System metrics">
          <span className="uv-chip">{metrics.totalPlanets} repos</span>
          <span className="uv-chip uv-chip--mint" title="Living, maintained repositories">{metrics.habitableCount} habitable</span>
          <span className="uv-chip uv-chip--ember" title="Recently active repositories">{metrics.infernoCount} active</span>
          <span className="uv-chip uv-chip--blue" title="Repositories with no commits in over a year">{metrics.frozenCount} frozen</span>
          {metrics.blackHoleCount > 0 && <span className="uv-chip" title="Very large, unmaintained repositories">{metrics.blackHoleCount} singularity</span>}
        </aside>
      )}

      <div className="uv-dock" role="toolbar" aria-label="Scene controls">
        <button type="button" className="uv-btn" aria-pressed={isCinematic} onClick={() => { playClick(); setIsCinematic((prev) => !prev) }}>{isCinematic ? 'Pause orbit' : 'Start orbit'}</button>
        <button type="button" className="uv-btn" onClick={() => { playClick(); setSpeedMultiplier((c) => SPEEDS[(SPEEDS.indexOf(c) + 1) % SPEEDS.length]) }}>{speedLabel}</button>
        {selectedPlanet && <button type="button" className="uv-btn" onClick={() => { playClick(); setSelectedPlanet(null) }}>Reset view</button>}
      </div>

      {selectedPlanet && (
        <section className="uv-inspector" role="dialog" aria-label="Planet details">
          <div className="uv-inspector__head">
            <span className="uv-type" style={{ color: selectedPlanet.themeColor }}>{TYPE_LABEL[selectedPlanet.planetType] || 'Planet'}</span>
            <button type="button" className="uv-close" onClick={() => setSelectedPlanet(null)} aria-label="Close inspector">
              <Icon name="plus" size={16} style={{ transform: 'rotate(45deg)' }} />
            </button>
          </div>
          <h2 className="uv-repo">{selectedPlanet.name}</h2>
          <p className="uv-atmo">{selectedPlanet.atmosphere}</p>

          <dl className="uv-stats">
            <div><dt>Language</dt><dd>{selectedPlanet.language}</dd></div>
            <div><dt>Stars</dt><dd>{selectedPlanet.stars}</dd></div>
            <div><dt>Forks</dt><dd>{selectedPlanet.forks}</dd></div>
            <div><dt>Last push</dt><dd>{selectedPlanet.daysSincePush === 0 ? 'Today' : `${selectedPlanet.daysSincePush}d ago`}</dd></div>
          </dl>

          {selectedPlanet.description && <p className="uv-desc">&ldquo;{selectedPlanet.description}&rdquo;</p>}

          <div className="uv-verdict">
            <span className="uv-verdict__k">Celestial audit</span>
            <p>{selectedPlanet.verdict}</p>
          </div>

          <div className="uv-actions">
            <a href={`https://github.com/${username}/${selectedPlanet.name}`} target="_blank" rel="noopener noreferrer" className="uv-btn">View on GitHub ↗</a>
            <Link href={`/repo/${username}/${selectedPlanet.name}`} className="uv-btn uv-btn--ember">Repo deep roast</Link>
          </div>
        </section>
      )}

      {universeData && !loading && (
        <nav className="uv-ticker" aria-label="Planets">
          <span className="uv-ticker__label">Orbits</span>
          <div className="uv-ticker__list">
            {universeData.planets.map((p) => (
              <button type="button" key={p.id} className="uv-ticker__item" aria-pressed={selectedPlanet?.id === p.id} onClick={() => handleSelectPlanet(p)}>
                <span className="uv-dot" style={{ background: p.themeColor }} aria-hidden="true" />
                {p.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      {loading && (
        <div className="uv-center" role="status" aria-live="polite">
          <div className="gr-state gr-state--loading uv-state">
            <span className="gr-state__tag">Loading</span>
            <p className="gr-state__title">Charting planetary orbits…</p>
            <p className="gr-help">Building the solar system for @{username}. You can keep browsing while the planets assemble.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="uv-center">
          <div className="gr-state gr-state--error uv-state" role="alert">
            <span className="gr-state__tag">Error</span>
            <p className="gr-state__title">Could not build this universe</p>
            <p className="gr-help">{error}</p>
            <div className="uv-actions">
              <Link href="/universe" className="gr-btn gr-btn--outline">Back to Universe</Link>
              <Link href={`/roast/${username}`} className="gr-btn gr-btn--primary">View standard roast</Link>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
