'use client'

// ============================================================
// GITROAST — 3D Code Solar System Entry Client
// ============================================================
// WHAT: Interactive launcher allowing developers to enter any GitHub handle
//       to warp into a real-time WebGL 3D celestial planetary visualizer.
//
// WHY:
//   - Provides an accessible entry gate before loading heavy Three.js scenes.
//   - Showcases featured celestial galaxies (Linus Torvalds, Dan Abramov, etc.)
//   - Explains planetary taxonomy (Habitable, Gas Giant, Inferno, Black Hole).
//
// WHERE & WHEN TO USE:
//   - Mounted at `/universe` as the main landing portal for the 3D galaxy feature.
//
// USE CASES:
//   - Entering custom username to visualize code architecture.
//   - Quick 1-click warp to legendary developer solar systems.
//
// WHEN NOT TO USE:
//   - Once inside `/universe/:username`, this entry page is superseded by UniversePageClient.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/utils/toast'
import { playWarpSpeed } from '@/utils/soundFX'
import Breadcrumb from '@/components/Breadcrumb'

const FEATURED_SYSTEMS = [
    {
        username: 'torvalds',
        name: 'Linus Torvalds',
        starType: 'O-Type Blue Hypergiant',
        starColor: '#00E5FF',
        tag: 'Kernel Arch-Stellar',
        planets: '10+ Worlds',
    },
    {
        username: 'gaearon',
        name: 'Dan Abramov',
        starType: 'B-Type Blue-White',
        starColor: '#40C4FF',
        tag: 'React Prime Core',
        planets: '8 Worlds',
    },
    {
        username: 'rich-harris',
        name: 'Rich Harris',
        starType: 'G-Type Solar Flare',
        starColor: '#FFD700',
        tag: 'Svelte Constellation',
        planets: '9 Worlds',
    },
    {
        username: 'shadcn',
        name: 'shadcn',
        starType: 'A-Type Luminous White',
        starColor: '#E0F7FA',
        tag: 'Modern UI Nebula',
        planets: '7 Worlds',
    },
    {
        username: 'sindresorhus',
        name: 'Sindre Sorhus',
        starType: 'Supermassive Micro-Star',
        starColor: '#FF6B00',
        tag: 'Open-Source Belt',
        planets: '12+ Worlds',
    },
    {
        username: 'antirez',
        name: 'Salvatore Sanfilippo',
        starType: 'K-Type Orange Giant',
        starColor: '#FF9100',
        tag: 'Redis Memory Flare',
        planets: '8 Worlds',
    },
]

export default function UniverseEntryClient() {
    const [targetUser, setTargetUser] = useState('')
    const [warping, setWarping] = useState(false)
    const router = useRouter()

    /* 
      ── WHAT: ────────────────────────────────────────────────────────
      Sanitizes input handle, plays acoustic warp Doppler effect, and navigates.
      
      ── WHY: ─────────────────────────────────────────────────────────
      Prevents malformed URL paths from trailing slashes or pasted GitHub links.
      
      ── WHERE & WHEN TO USE:
      On form submission or featured galaxy selection.
      
      ── USE CASES:
      Pasted "https://github.com/torvalds/" -> sanitized to "torvalds".
      
      ── WHEN NOT TO USE:
      Empty inputs or internal navigation links.
    */
    function handleWarp(customUser) {
        const raw = (customUser || targetUser || '').trim()
        const sanitized = raw
            .replace(/^https?:\/\/(?:www\.)?github\.com\//i, '')
            .replace(/^(?:www\.)?github\.com\//i, '')
            .replace(/^@/, '')
            .replace(/^\/+|\/+$/g, '')
            .toLowerCase()

        if (!sanitized) {
            toast.warning('Enter a GitHub username to warp into their solar system!')
            return
        }

        setWarping(true)
        playWarpSpeed()
        toast.info(`🚀 Warping into @${sanitized}'s Code Solar System...`, { duration: 2500 })

        setTimeout(() => {
            router.push(`/universe/${sanitized}`)
        }, 350)
    }

    return (
        <main className="universe-portal-page">
            <div className="container">
                <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: '3D Solar System' }]} />

                {/* ── Header ── */}
                <header className="portal-header">
                    <div className="header-badge font-mono">
                        <span className="pulsing-star" aria-hidden="true">✦</span>
                        <span>INTERACTIVE 3D WEBGL ENGINE</span>
                    </div>
                    <h1 className="portal-title">
                        THE 3D CODE <span className="title-fire">SOLAR SYSTEM</span>
                    </h1>
                    <p className="portal-subtitle font-body">
                        Transform any GitHub profile into an interactive, celestial universe.
                        Every repository becomes an orbiting world; technical debt collapses into
                        supermassive black holes.
                    </p>
                </header>

                {/* ── Warp Controller ── */}
                <div className="warp-card">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleWarp()
                        }}
                        className="warp-form"
                    >
                        <div className="input-wrap">
                            <span className="input-icon" aria-hidden="true">🪐</span>
                            <input
                                type="text"
                                className="warp-input font-mono"
                                placeholder="Enter any GitHub username (e.g. torvalds)..."
                                value={targetUser}
                                onChange={(e) => setTargetUser(e.target.value)}
                                disabled={warping}
                                autoFocus
                                spellCheck={false}
                                aria-label="Target GitHub username for 3D universe"
                            />
                            {targetUser && (
                                <button
                                    type="button"
                                    className="clear-btn"
                                    onClick={() => setTargetUser('')}
                                    title="Clear"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="warp-submit-btn font-mono"
                            disabled={warping}
                        >
                            {warping ? 'WARPING HYPERSPACE...' : 'WARP INTO UNIVERSE ⚡'}
                        </button>
                    </form>

                    <div className="warp-hint font-mono">
                        <span>⚡ Zero install</span>
                        <span className="dot">•</span>
                        <span>🎮 Interactive Orbit Controls</span>
                        <span className="dot">•</span>
                        <span>🔊 Audio Synthesizer</span>
                    </div>
                </div>

                {/* ── Featured Solar Systems ── */}
                <section className="featured-section">
                    <div className="section-head">
                        <h2 className="section-title font-display">FEATURED SOLAR SYSTEMS</h2>
                        <span className="section-badge font-mono">POPULAR GALAXIES</span>
                    </div>

                    <div className="systems-grid">
                        {FEATURED_SYSTEMS.map((sys) => (
                            <button
                                key={sys.username}
                                type="button"
                                className="system-card"
                                onClick={() => handleWarp(sys.username)}
                                style={{ '--star-glow': sys.starColor }}
                            >
                                <div className="card-top">
                                    <div className="star-orb" />
                                    <div className="card-meta">
                                        <span className="sys-name">{sys.name}</span>
                                        <span className="sys-user font-mono">@{sys.username}</span>
                                    </div>
                                    <span className="sys-tag font-mono">{sys.tag}</span>
                                </div>
                                <div className="card-bottom font-mono">
                                    <span className="star-type">{sys.starType}</span>
                                    <span className="planet-count">{sys.planets} →</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── Celestial Taxonomy ── */}
                <section className="taxonomy-section">
                    <h2 className="section-title font-display">CELESTIAL TAXONOMY</h2>
                    <p className="taxonomy-sub font-body">
                        How your GitHub code metrics translate into celestial bodies in real time.
                    </p>

                    <div className="taxonomy-grid">
                        <div className="taxonomy-card">
                            <span className="tax-icon">☀️</span>
                            <h3 className="tax-title">Central Star</h3>
                            <p className="tax-desc font-body">
                                Sized by total star count; coronal temperature powered by annual commit streak velocity.
                            </p>
                        </div>
                        <div className="taxonomy-card">
                            <span className="tax-icon">🌍</span>
                            <h3 className="tax-title">Habitable Outposts</h3>
                            <p className="tax-desc font-body">
                                Repositories with lush documentation, stars, clean tags, and high code maintainability.
                            </p>
                        </div>
                        <div className="taxonomy-card">
                            <span className="tax-icon">🪐</span>
                            <h3 className="tax-title">Gas Giants with Rings</h3>
                            <p className="tax-desc font-body">
                                Massive enterprise codebases with extensive fork density and deep nested architecture.
                            </p>
                        </div>
                        <div className="taxonomy-card">
                            <span className="tax-icon">🌋</span>
                            <h3 className="tax-title">Inferno Worlds</h3>
                            <p className="tax-desc font-body">
                                High-frequency push repositories actively enduring production hotfixes within 14 days.
                            </p>
                        </div>
                        <div className="taxonomy-card">
                            <span className="tax-icon">❄️</span>
                            <h3 className="tax-title">Cryo Ice Worlds</h3>
                            <p className="tax-desc font-body">
                                Abandoned repos drifting in deep space with no commits in over 365 days.
                            </p>
                        </div>
                        <div className="taxonomy-card">
                            <span className="tax-icon">🕳️</span>
                            <h3 className="tax-title">Technical Debt Singularity</h3>
                            <p className="tax-desc font-body">
                                Supermassive black holes sucking light and sanity with unmaintained multi-hundred megabyte blobs.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <style jsx>{`
                .universe-portal-page {
                    min-height: 100vh;
                    padding-top: 5rem;
                    padding-bottom: 7rem; /* Rule 2.3: Fixed footer clearance >= 6.5rem */
                    position: relative;
                    background: radial-gradient(circle at 50% 10%, rgba(0, 229, 255, 0.05) 0%, rgba(7, 7, 7, 1) 75%);
                }
                .container {
                    max-width: 1080px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                }
                .portal-header {
                    text-align: center;
                    margin: 2.5rem 0 3rem;
                }
                .header-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(0, 229, 255, 0.1);
                    border: 1px solid rgba(0, 229, 255, 0.3);
                    color: #00E5FF;
                    padding: 6px 14px;
                    border-radius: 999px;
                    font-size: 11px;
                    letter-spacing: 1.5px;
                    margin-bottom: 1.25rem;
                }
                .pulsing-star {
                    animation: pulseStar 1.5s infinite ease-in-out;
                }
                @keyframes pulseStar {
                    0%, 100% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.3); opacity: 1; text-shadow: 0 0 10px #00E5FF; }
                }
                .portal-title {
                    font-family: var(--font-display-loaded, inherit);
                    font-size: clamp(2.5rem, 6vw, 4.5rem);
                    line-height: 1.05;
                    margin: 0 0 1rem;
                    color: #FFFFFF;
                    letter-spacing: 1px;
                }
                .title-fire {
                    background: linear-gradient(135deg, #00E5FF 0%, #7C4DFF 50%, #FF4500 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .portal-subtitle {
                    max-width: 680px;
                    margin: 0 auto;
                    color: #A3A3A3;
                    font-size: 1.05rem;
                    line-height: 1.6;
                }

                /* ── Warp Controller ── */
                .warp-card {
                    background: rgba(20, 20, 20, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(16px);
                    border-radius: 18px;
                    padding: 2rem;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    margin-bottom: 4rem;
                }
                .warp-form {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 1.25rem;
                }
                .input-wrap {
                    flex: 1;
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .input-icon {
                    position: absolute;
                    left: 16px;
                    font-size: 18px;
                    pointer-events: none;
                }
                .warp-input {
                    width: 100%;
                    padding: 16px 44px 16px 48px;
                    background: #0A0A0A;
                    border: 1px solid #333333;
                    border-radius: 12px;
                    color: #FFFFFF;
                    font-size: 14px;
                    letter-spacing: 0.5px;
                    transition: all 0.2s ease;
                }
                .warp-input:focus {
                    outline: none;
                    border-color: #00E5FF;
                    box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.2);
                }
                .clear-btn {
                    position: absolute;
                    right: 14px;
                    background: none;
                    border: none;
                    color: #666666;
                    cursor: pointer;
                    font-size: 14px;
                    padding: 4px;
                }
                .clear-btn:hover {
                    color: #FFFFFF;
                }
                .warp-submit-btn {
                    padding: 16px 28px;
                    background: linear-gradient(135deg, #00E5FF 0%, #0088FF 100%);
                    border: none;
                    border-radius: 12px;
                    color: #000000;
                    font-weight: 700;
                    font-size: 13px;
                    letter-spacing: 1px;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: transform 0.15s ease, box-shadow 0.2s ease;
                }
                .warp-submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 229, 255, 0.4);
                }
                .warp-submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .warp-hint {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    font-size: 11px;
                    color: #888888;
                }
                .dot {
                    opacity: 0.4;
                }

                /* ── Featured Systems ── */
                .featured-section {
                    margin-bottom: 4rem;
                }
                .section-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.5rem;
                }
                .section-title {
                    font-size: 1.75rem;
                    color: #FFFFFF;
                    letter-spacing: 1px;
                    margin: 0;
                }
                .section-badge {
                    font-size: 11px;
                    color: #00E5FF;
                    background: rgba(0, 229, 255, 0.1);
                    border: 1px solid rgba(0, 229, 255, 0.2);
                    padding: 4px 10px;
                    border-radius: 6px;
                }
                .systems-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 16px;
                }
                .system-card {
                    background: #111111;
                    border: 1px solid #222222;
                    border-radius: 14px;
                    padding: 18px;
                    text-align: left;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                }
                .system-card:hover {
                    border-color: var(--star-glow, #00E5FF);
                    transform: translateY(-3px);
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 229, 255, 0.15);
                }
                .card-top {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .star-orb {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: var(--star-glow, #00E5FF);
                    box-shadow: 0 0 12px var(--star-glow, #00E5FF);
                    flex-shrink: 0;
                }
                .card-meta {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .sys-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #FFFFFF;
                }
                .sys-user {
                    font-size: 12px;
                    color: #888888;
                }
                .sys-tag {
                    font-size: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #CCCCCC;
                    padding: 3px 8px;
                    border-radius: 4px;
                }
                .card-bottom {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 11px;
                    border-top: 1px solid #1C1C1C;
                    padding-top: 10px;
                }
                .star-type {
                    color: #888888;
                }
                .planet-count {
                    color: #00E5FF;
                    font-weight: 600;
                }

                /* ── Taxonomy ── */
                .taxonomy-section {
                    margin-bottom: 2rem;
                }
                .taxonomy-sub {
                    color: #888888;
                    font-size: 14px;
                    margin: 0.5rem 0 2rem;
                }
                .taxonomy-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 16px;
                }
                .taxonomy-card {
                    background: rgba(18, 18, 18, 0.7);
                    border: 1px solid #222222;
                    border-radius: 12px;
                    padding: 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .tax-icon {
                    font-size: 24px;
                }
                .tax-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: #FFFFFF;
                    margin: 0;
                }
                .tax-desc {
                    font-size: 13px;
                    color: #888888;
                    line-height: 1.5;
                    margin: 0;
                }

                @media (max-width: 680px) {
                    .warp-form {
                        flex-direction: column;
                    }
                    .warp-submit-btn {
                        width: 100%;
                    }
                    .systems-grid, .taxonomy-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </main>
    )
}
