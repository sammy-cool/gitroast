'use client'

// ============================================================
// GITROAST — 3D Code Universe & Solar System Client View
// ============================================================
/**
 * WHAT: Full-screen interactive 3D WebGL solar system interface with real-time celestial physics,
 *       HUD telemetry, interactive planet inspection drawer, and hyperspace warp navigation.
 * WHY: Provides a viral, cinematic, and deeply engaging way for developers, friends, and recruiters
 *      to visually explore repository architecture as planets orbiting a central developer star.
 * WHERE & WHEN TO USE: Mounted at /universe/[username].
 * USE CASES: Interactive 3D portfolio showcase, space-themed code roast, social sharing.
 * WHEN NOT TO USE: When browser lacks WebGL support (graceful fallback banner provided).
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getUniverse } from '@/services/roastService'
import { toast } from '@/utils/toast'
import { playClick, playSuccess, playCosmicChime, playWarpSpeed } from '@/utils/soundFX'
import SoundToggle from '@/components/SoundToggle'
import { useAuth } from '@/context/AuthContext'

// Dynamic import with SSR disabled for Three.js WebGL canvas
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
  const [isCinematic, setIsCinematic] = useState(true)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const [warpTarget, setWarpTarget] = useState('')
  const [isWarping, setIsWarping] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // ── Fetch Universe Data on Mount ──────────────────────────────
  useEffect(() => {
    let cancelled = false
    const token = getToken ? getToken() : null

    getUniverse(username, token)
      .then((data) => {
        if (!cancelled) {
          setUniverseData(data.universe)
          setLoading(false)
          toast.fire(`🌌 Entered @${username}'s Solar System!`, { duration: 3000 })
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

  // ── Planet Selection ──────────────────────────────────────────
  const handleSelectPlanet = useCallback((planet) => {
    playCosmicChime()
    setSelectedPlanet(planet)
  }, [])

  // ── Hyperspace Warp to Another Developer ──────────────────────
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

  // ── Share Solar System ────────────────────────────────────────
  const handleShare = useCallback(() => {
    playSuccess()
    const url = typeof window !== 'undefined' ? window.location.href : `https://gitroast.dev/universe/${username}`
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true)
      toast.copy('Solar System link copied to clipboard! 📋')
      setTimeout(() => setIsCopied(false), 2500)
    }).catch(() => {})
  }, [username])

  return (
    <main className="universe-viewport">
      {/* ── Background 3D WebGL Canvas ── */}
      {!loading && !error && universeData && (
        <CodeSolarSystem
          universeData={universeData}
          selectedPlanetId={selectedPlanet?.id || null}
          onSelectPlanet={handleSelectPlanet}
          isCinematic={isCinematic}
          speedMultiplier={speedMultiplier}
        />
      )}

      {/* ── Warp Flare Flash Overlay ── */}
      {isWarping && <div className="warp-flash animate-warp-flash" />}

      {/* ── Top HUD Navigation ── */}
      <header className="universe-hud-top font-mono">
        <div className="hud-left">
          <Link href="/" className="hud-back-btn" title="Return to GitRoast Home">
            ← Home
          </Link>
          <div className="hud-star-info">
            <span className="hud-star-badge" style={{ borderColor: universeData?.star?.starColor || 'var(--fire)' }}>
              🌟 {universeData?.star?.spectralClass || 'Star System'}
            </span>
            <h1 className="hud-title">@{username}&apos;s Cosmos</h1>
          </div>
        </div>

        {/* Inline Hyperspace Warp Search */}
        <form onSubmit={handleWarpSubmit} className="hud-warp-form">
          <input
            type="text"
            className="hud-warp-input font-mono"
            placeholder="Warp to @username..."
            value={warpTarget}
            onChange={(e) => setWarpTarget(e.target.value)}
            maxLength={39}
            spellCheck={false}
          />
          <button type="submit" className="hud-warp-btn font-mono" title="Warp to developer">
            Warp 🚀
          </button>
        </form>

        <div className="hud-right">
          <button
            type="button"
            className="hud-btn font-mono"
            onClick={handleShare}
            title="Share this 3D Solar System"
          >
            {isCopied ? '✓ Copied' : '🔗 Share'}
          </button>
          <SoundToggle />
        </div>
      </header>

      {/* ── Star System Metrics Pill ── */}
      {universeData && !loading && (
        <aside className="universe-hud-metrics font-mono">
          <div className="metric-chip">
            <span className="metric-icon">🪐</span>
            <span>{universeData.systemMetrics.totalPlanets} Repos</span>
          </div>
          <div className="metric-chip metric-chip--habitable" title="Living, maintained repositories">
            <span className="metric-icon">🌱</span>
            <span>{universeData.systemMetrics.habitableCount} Oasis</span>
          </div>
          <div className="metric-chip metric-chip--inferno" title="Recently active hotfix repos">
            <span className="metric-icon">🔥</span>
            <span>{universeData.systemMetrics.infernoCount} Magma</span>
          </div>
          <div className="metric-chip metric-chip--frozen" title="Abandoned frozen repositories">
            <span className="metric-icon">❄️</span>
            <span>{universeData.systemMetrics.frozenCount} Frozen</span>
          </div>
          {universeData.systemMetrics.blackHoleCount > 0 && (
            <div className="metric-chip metric-chip--blackhole" title="Supermassive node_modules black holes">
              <span className="metric-icon">🕳️</span>
              <span>{universeData.systemMetrics.blackHoleCount} Singularity</span>
            </div>
          )}
        </aside>
      )}

      {/* ── Simulation Control Dock ── */}
      <div className="universe-hud-dock font-mono">
        <button
          type="button"
          className={`dock-btn ${isCinematic ? 'dock-btn--active' : ''}`}
          onClick={() => {
            playClick()
            setIsCinematic((prev) => !prev)
          }}
          title={isCinematic ? 'Pause Auto-Orbit' : 'Enable Cinematic Orbit'}
        >
          {isCinematic ? '⏸ Orbit' : '▶ Orbit'}
        </button>

        <button
          type="button"
          className="dock-btn"
          onClick={() => {
            playClick()
            setSpeedMultiplier((curr) => (curr === 1 ? 2 : curr === 2 ? 5 : 1))
          }}
          title="Toggle orbit speed"
        >
          ⚡ {speedMultiplier}x Speed
        </button>

        {selectedPlanet && (
          <button
            type="button"
            className="dock-btn dock-btn--reset"
            onClick={() => {
              playClick()
              setSelectedPlanet(null)
            }}
            title="Reset camera to system overview"
          >
            🔭 Reset View
          </button>
        )}
      </div>

      {/* ── Planet Inspector Drawer ── */}
      {selectedPlanet && (
        <section className="planet-inspector-card card font-mono" role="dialog" aria-label="Planet Details">
          <div className="inspector-header">
            <div className="inspector-title-row">
              <span className="inspector-type-badge" style={{ color: selectedPlanet.themeColor }}>
                {selectedPlanet.planetType === 'black_hole' && '🕳️ SINGULARITY'}
                {selectedPlanet.planetType === 'inferno' && '🔥 VOLCANIC MAGMA'}
                {selectedPlanet.planetType === 'habitable' && '🌱 HABITABLE BIOSPHERE'}
                {selectedPlanet.planetType === 'gas_giant' && '🪐 RINGED GAS GIANT'}
                {selectedPlanet.planetType === 'frozen_ice' && '❄️ CRYO WORLD'}
                {selectedPlanet.planetType === 'barren_rock' && '🌑 BARREN ROCK'}
              </span>
              <button
                type="button"
                className="inspector-close-btn"
                onClick={() => setSelectedPlanet(null)}
                aria-label="Close inspector"
              >
                ✕
              </button>
            </div>
            <h2 className="inspector-repo-name">{selectedPlanet.name}</h2>
            <p className="inspector-atmosphere font-body">{selectedPlanet.atmosphere}</p>
          </div>

          <div className="inspector-stats-grid font-mono">
            <div className="stat-pill">
              <span className="stat-label">Language</span>
              <span className="stat-val">{selectedPlanet.language}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Stars</span>
              <span className="stat-val">⭐ {selectedPlanet.stars}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Forks</span>
              <span className="stat-val">🔱 {selectedPlanet.forks}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Last Push</span>
              <span className="stat-val">{selectedPlanet.daysSincePush === 0 ? 'Today' : `${selectedPlanet.daysSincePush}d ago`}</span>
            </div>
          </div>

          <p className="inspector-desc font-body">&ldquo;{selectedPlanet.description}&rdquo;</p>

          <div className="inspector-verdict-box">
            <span className="verdict-label font-mono">📡 CELESTIAL AUDIT VERDICT:</span>
            <p className="verdict-text font-body">{selectedPlanet.verdict}</p>
          </div>

          <div className="inspector-actions">
            <a
              href={`https://github.com/${username}/${selectedPlanet.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline inspector-btn font-mono"
            >
              View on GitHub ↗
            </a>
            <Link
              href={`/repo/${username}/${selectedPlanet.name}`}
              className="btn btn--fire inspector-btn font-mono"
            >
              🔥 Repo Deep Roast
            </Link>
          </div>
        </section>
      )}

      {/* ── Bottom Planet Ticker ── */}
      {universeData && !loading && (
        <nav className="universe-ticker-bar font-mono" aria-label="Planet Navigation Ticker">
          <div className="ticker-label">ORBITS:</div>
          <div className="ticker-list">
            {universeData.planets.map((p) => (
              <button
                type="button"
                key={p.id}
                className={`ticker-item ${selectedPlanet?.id === p.id ? 'ticker-item--active' : ''}`}
                onClick={() => handleSelectPlanet(p)}
                style={{ '--planet-color': p.themeColor }}
              >
                <span className="ticker-dot" style={{ background: p.themeColor }} />
                <span className="ticker-name">{p.name}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* ── Loading Skeleton / State ── */}
      {loading && (
        <div className="universe-loader">
          <div className="cosmic-spinner" />
          <h2 className="loading-title font-display text-fire">INITIALIZING 3D CODE COSMOS...</h2>
          <p className="loading-sub font-mono">Charting planetary orbits for @{username}...</p>
        </div>
      )}

      {/* ── Error State ── */}
      {error && (
        <div className="universe-error-card card font-mono">
          <span className="error-icon">🛰️</span>
          <h2>COSMIC TELEMETRY ERROR</h2>
          <p className="error-desc">{error}</p>
          <div className="error-actions">
            <Link href="/" className="btn btn-outline">
              ← Return Home
            </Link>
            <Link href={`/roast/${username}`} className="btn btn--fire">
              View Standard Roast 🔥
            </Link>
          </div>
        </div>
      )}

      <style jsx>{`
        .universe-viewport {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: radial-gradient(circle at 50% 50%, #0d0818 0%, #040208 60%, #000002 100%);
          color: var(--text-primary);
          overflow: hidden;
          z-index: 40;
          user-select: none;
        }

        /* ── Top HUD ── */
        .universe-hud-top {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.25rem;
          background: rgba(7, 7, 10, 0.7);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 50;
          gap: 1rem;
        }
        .hud-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hud-back-btn {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 12px;
          padding: 5px 10px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          transition: all 0.15s ease;
        }
        .hud-back-btn:hover {
          color: var(--fire);
          border-color: rgba(255, 69, 0, 0.4);
        }
        .hud-star-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .hud-star-badge {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #FFB700;
        }
        .hud-title {
          font-size: 14px;
          margin: 0;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .hud-warp-form {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 2px 4px 2px 10px;
        }
        .hud-warp-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 12px;
          width: 160px;
        }
        .hud-warp-input::placeholder {
          color: var(--text-muted);
        }
        .hud-warp-btn {
          background: rgba(255, 69, 0, 0.2);
          border: 1px solid var(--fire);
          color: #FFF;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .hud-warp-btn:hover {
          background: var(--fire);
        }
        .hud-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .hud-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-size: 11px;
          padding: 5px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .hud-btn:hover {
          border-color: var(--fire);
          color: var(--fire);
        }

        /* ── System Metrics ── */
        .universe-hud-metrics {
          position: absolute;
          top: 72px;
          left: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 45;
          pointer-events: none;
        }
        .metric-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(10, 10, 15, 0.75);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          font-size: 11px;
          color: var(--text-secondary);
        }
        .metric-chip--habitable {
          border-color: rgba(0, 230, 118, 0.3);
          color: #00E676;
        }
        .metric-chip--inferno {
          border-color: rgba(255, 69, 0, 0.35);
          color: var(--fire);
        }
        .metric-chip--frozen {
          border-color: rgba(0, 229, 255, 0.3);
          color: #00E5FF;
        }
        .metric-chip--blackhole {
          border-color: rgba(122, 0, 255, 0.4);
          color: #B388FF;
        }

        /* ── Dock Controls ── */
        .universe-hud-dock {
          position: absolute;
          bottom: 64px;
          right: 1.25rem;
          display: flex;
          gap: 8px;
          z-index: 45;
        }
        .dock-btn {
          background: rgba(15, 15, 22, 0.85);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-primary);
          font-size: 11px;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dock-btn:hover, .dock-btn--active {
          border-color: var(--fire);
          color: var(--fire);
          background: rgba(255, 69, 0, 0.1);
        }
        .dock-btn--reset {
          border-color: #00E5FF;
          color: #00E5FF;
        }

        /* ── Planet Inspector Card ── */
        .planet-inspector-card {
          position: absolute;
          top: 75px;
          right: 1.25rem;
          width: 340px;
          max-width: calc(100vw - 2.5rem);
          max-height: calc(100vh - 150px);
          overflow-y: auto;
          background: rgba(18, 18, 24, 0.9);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
          padding: 1.25rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 55;
          animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .inspector-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .inspector-type-badge {
          font-size: 10px;
          letter-spacing: 1px;
          font-weight: 700;
        }
        .inspector-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 14px;
          cursor: pointer;
          padding: 4px;
        }
        .inspector-close-btn:hover {
          color: #FFF;
        }
        .inspector-repo-name {
          font-size: 1.25rem;
          margin: 4px 0 0;
          color: #FFF;
          word-break: break-all;
        }
        .inspector-atmosphere {
          font-size: 11px;
          color: var(--text-muted);
          margin: 2px 0 0;
        }
        .inspector-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .stat-pill {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 6px 8px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .stat-label {
          font-size: 9px;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .stat-val {
          font-size: 12px;
          color: #FFF;
          font-weight: 600;
        }
        .inspector-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
          margin: 0;
          font-style: italic;
        }
        .inspector-verdict-box {
          background: rgba(255, 69, 0, 0.08);
          border-left: 3px solid var(--fire);
          padding: 8px 10px;
          border-radius: 4px;
        }
        .verdict-label {
          font-size: 9px;
          color: var(--fire);
          letter-spacing: 1px;
          font-weight: 700;
          display: block;
          margin-bottom: 2px;
        }
        .verdict-text {
          font-size: 12px;
          color: #FFF;
          line-height: 1.4;
          margin: 0;
        }
        .inspector-actions {
          display: flex;
          gap: 8px;
        }
        .inspector-btn {
          flex: 1;
          font-size: 11px;
          padding: 8px 4px;
          text-align: center;
          text-decoration: none;
        }

        /* ── Bottom Orbits Ticker ── */
        .universe-ticker-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 48px;
          background: rgba(6, 6, 9, 0.85);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          padding: 0 1rem;
          gap: 12px;
          z-index: 50;
        }
        .ticker-label {
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 1.5px;
          flex-shrink: 0;
        }
        .ticker-list {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          white-space: nowrap;
          flex: 1;
        }
        .ticker-item {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .ticker-item:hover, .ticker-item--active {
          border-color: var(--planet-color, var(--fire));
          color: #FFF;
          background: rgba(255, 255, 255, 0.08);
        }
        .ticker-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        /* ── Loader & Error ── */
        .universe-loader, .universe-error-card {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
          z-index: 60;
        }
        .cosmic-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(255, 69, 0, 0.2);
          border-top-color: var(--fire);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loading-title {
          font-size: 2rem;
          margin: 0;
        }
        .loading-sub {
          font-size: 12px;
          color: var(--text-muted);
        }
        .error-icon {
          font-size: 3rem;
        }
        .error-desc {
          color: var(--text-secondary);
          font-size: 13px;
        }
        .error-actions {
          display: flex;
          gap: 10px;
        }

        /* ── Mobile Optimization (<768px) ── */
        @media (max-width: 768px) {
          .hud-warp-form {
            display: none;
          }
          .universe-hud-metrics {
            display: none;
          }
          .universe-hud-dock {
            bottom: 54px;
            right: 0.75rem;
          }
          .planet-inspector-card {
            top: auto;
            bottom: 54px;
            left: 0.75rem;
            right: 0.75rem;
            width: auto;
            max-height: 48vh;
          }
        }
      `}</style>
    </main>
  )
}
