'use client'


import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast, notify } from '@/utils/toast'
import { playWarpSpeed } from '@/utils/soundFX'
import Breadcrumb from '@/components/Breadcrumb'
import './universe-entry.css'

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

const TAXONOMY = [
    ['Central star', 'Sized by total stars; coronal temperature reflects annual commit streak velocity.'],
    ['Habitable outposts', 'Repositories with good documentation, stars, clean tags and high maintainability.'],
    ['Gas giants with rings', 'Large codebases with heavy fork density and deep architecture.'],
    ['Inferno worlds', 'High-frequency push repositories with activity in the last 14 days.'],
    ['Cryo ice worlds', 'Repositories drifting in deep space with no commits in over 365 days.'],
    ['Technical debt singularity', 'Supermassive black holes made of unmaintained, very large blobs.'],
]

export default function UniverseEntryClient() {
    const [targetUser, setTargetUser] = useState('')
    const [warping, setWarping] = useState(false)
    const router = useRouter()

    function handleWarp(customUser) {
        const sanitized = (customUser || targetUser || '')
            .trim()
            .replace(/^https?:\/\/(?:www\.)?github\.com\//i, '')
            .replace(/^(?:www\.)?github\.com\//i, '')
            .replace(/^@/, '')
            .replace(/^\/+|\/+$/g, '')
            .toLowerCase()

        if (!sanitized) return toast.warning('Enter a GitHub username', { description: 'We need a public profile to build its solar system.' })

        setWarping(true)
        playWarpSpeed()
        notify.universeRendering()
        setTimeout(() => router.push(`/universe/${sanitized}`), 350)
    }

    return (
        <main className="ue">
            <section className="ue-hero">
                <div className="gr-page ue-hero__inner">
                    <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Repository Universe' }]} />
                    <p className="gr-eyebrow ue-on-dark">Interactive 3D • Optional</p>
                    <h1 className="ue-title">Orbit your codebase in a 3D constellation.</h1>
                    <p className="ue-lede">Every repository becomes a world; technical debt collapses into black holes. Reduced-motion settings turn off travel and spin.</p>
                    <form className="ue-form" onSubmit={(e) => { e.preventDefault(); handleWarp() }}>
                        <label className="gr-sr-only" htmlFor="ue-user">GitHub username for the 3D universe</label>
                        <input id="ue-user" className="gr-input gr-mono" placeholder="octavia-labs" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} disabled={warping} spellCheck={false} autoCapitalize="off" autoComplete="off" />
                        <button type="submit" className="gr-btn gr-btn--primary" disabled={warping}>{warping ? 'Warping…' : 'Enter the universe'}</button>
                    </form>
                    <ul className="ue-facts"><li>Zero install</li><li>Orbit controls</li><li>Optional audio</li></ul>
                </div>
            </section>

            <div className="gr-page ue-body">
                <section aria-labelledby="ue-feat">
                    <p className="gr-eyebrow">Popular galaxies</p>
                    <h2 id="ue-feat" className="gr-h2 ue-h">Featured solar systems.</h2>
                    <div className="ue-grid">
                        {FEATURED_SYSTEMS.map((sys) => (
                            <button key={sys.username} type="button" className="gr-card gr-card--interactive ue-card" onClick={() => handleWarp(sys.username)}>
                                <span className="ue-orb" style={{ background: sys.starColor }} aria-hidden="true" />
                                <b>{sys.name}</b>
                                <span className="gr-mono ue-user">@{sys.username}</span>
                                <span className="gr-pill gr-pill--blue">{sys.tag}</span>
                                <span className="ue-meta">{sys.starType} • {sys.planets}</span>
                                <span className="rc-link">Enter →</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section aria-labelledby="ue-tax">
                    <p className="gr-eyebrow">Celestial taxonomy</p>
                    <h2 id="ue-tax" className="gr-h2 ue-h">How metrics become worlds.</h2>
                    <div className="ue-grid">
                        {TAXONOMY.map(([t, d]) => <article key={t} className="gr-card"><h3 className="ue-t">{t}</h3><p className="gr-help">{d}</p></article>)}
                    </div>
                </section>
            </div>
        </main>
    )
}
