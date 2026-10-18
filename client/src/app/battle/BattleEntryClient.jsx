'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast, notify } from '@/utils/toast'
import { useAuth } from '@/context/AuthContext'
import Breadcrumb from '@/components/Breadcrumb'
import Icon from '@/components/Icon'
import { cleanGithubTarget, isGithubUser } from '@/utils/githubTarget'
import './battle-entry.css'

const FEATURED_RIVALRIES = [
  { title: 'Kernel vs React', tag: 'OS vs Frontend', user1: 'torvalds', user2: 'gaearon' },
  { title: 'Vue vs Svelte', tag: 'Framework war', user1: 'yyx990803', user2: 'rich-harris' },
  { title: 'UI vs Next.js', tag: 'Modern web', user1: 'shadcn', user2: 'leerob' },
  { title: 'NPM vs Node/Go', tag: 'Open source titans', user1: 'sindresorhus', user2: 'tj' },
  { title: 'C vs Rust', tag: 'Systems clash', user1: 'antirez', user2: 'burntsushi' },
]

const clean = (raw) => cleanGithubTarget(raw).toLowerCase()

export default function BattleEntryClient() {
  const { user } = useAuth()
  const router = useRouter()
  const [user1, setUser1] = useState('')
  const [user2, setUser2] = useState('')

  function launchBattle(u1, u2) {
    const p1 = clean(u1 || user1)
    const p2 = clean(u2 || user2)
    if (!p1 || !p2) return toast.warning('Enter both usernames', { description: 'A rivalry needs two public GitHub profiles.' })
    if (!isGithubUser(p1) || !isGithubUser(p2)) return toast.warning('Check the usernames', { description: 'Use public GitHub usernames, for example octavia-labs.' })
    if (p1 === p2) return toast.warning('Pick two different profiles', { description: 'You cannot battle yourself. Or can you? No. You cannot.' })
    router.push(`/battle/${p1}/vs/${p2}`)
  }

  function handleRandom() {
    const pick = FEATURED_RIVALRIES[Math.floor(Math.random() * FEATURED_RIVALRIES.length)]
    setUser1(pick.user1)
    setUser2(pick.user2)
    toast.info(`Selected @${pick.user1} vs @${pick.user2}`, { description: 'Ready when you are.', action: { label: 'Fight now', onClick: () => launchBattle(pick.user1, pick.user2) } })
  }

  function handleFillMyself() {
    if (!user?.username) return
    setUser1(user.username.toLowerCase())
    toast.info(`@${user.username} is player 1`, { description: 'Pick your opponent.' })
  }

  function handleSwap() {
    setUser1(user2)
    setUser2(user1)
  }

  return (
    <main className="be">
      <section className="be-hero">
        <div className="gr-page be-hero__inner">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Battles' }]} />
          <p className="gr-eyebrow be-on-dark">Developer battles</p>
          <h1 className="be-title">Settle a rivalry with public evidence.</h1>
          <p className="be-lede">Two profiles enter. Friendly rivalry, zero dunking down. Only public data is compared.</p>
        </div>
      </section>

      <div className="gr-page be-body">
        <form className="gr-card gr-card--dark be-setup" onSubmit={(e) => { e.preventDefault(); launchBattle() }} aria-labelledby="be-setup-h">
          <p className="gr-eyebrow be-on-dark">Rivalry setup</p>
          <h2 id="be-setup-h" className="gr-h3 be-on-dark">Choose your two profiles.</h2>
          <div className="be-slots">
            <div>
              <label className="gr-label be-on-dark" htmlFor="be-u1">Player 1</label>
              <input id="be-u1" className="gr-input gr-mono" value={user1} onChange={(e) => setUser1(e.target.value)} placeholder="octavia-labs" autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={80} />
            </div>
            <button type="button" className="be-swap" onClick={handleSwap} aria-label="Swap players" title="Swap players">VS</button>
            <div>
              <label className="gr-label be-on-dark" htmlFor="be-u2">Player 2</label>
              <input id="be-u2" className="gr-input gr-mono" value={user2} onChange={(e) => setUser2(e.target.value)} placeholder="aria-moon" autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={80} />
            </div>
          </div>
          <div className="be-actions">
            <button type="submit" className="gr-btn gr-btn--primary"><Icon name="flame" size={16} /> Preview battle</button>
            <button type="button" className="gr-btn gr-btn--outline" onClick={handleRandom}>Random rivalry</button>
            {user?.username && <button type="button" className="gr-btn gr-btn--outline" onClick={handleFillMyself}>Battle as me</button>}
          </div>
          <p className="be-fine">Ghost Mode profiles stay out of public battles. Private results stay private.</p>
        </form>

        <section aria-labelledby="be-feat-h">
          <p className="gr-eyebrow">Featured rivalries</p>
          <h2 id="be-feat-h" className="gr-h2 be-h">Classic matchups.</h2>
          <div className="be-grid">
            {FEATURED_RIVALRIES.map((r) => (
              <button key={r.title} type="button" className="gr-card gr-card--interactive be-card" onClick={() => { setUser1(r.user1); setUser2(r.user2); launchBattle(r.user1, r.user2) }}>
                <span className="gr-pill gr-pill--blue">{r.tag}</span>
                <b className="be-card__t">{r.title}</b>
                <span className="gr-mono be-card__u">@{r.user1} vs @{r.user2}</span>
                <span className="rc-link">Start battle →</span>
              </button>
            ))}
          </div>
        </section>

        <section className="gr-card gr-card--blue be-how">
          <h2 className="rc-card-title">How a battle works</h2>
          <p className="gr-help">We read both public profiles, compare repositories, commit quality and documentation, then write a verdict. Rankings never use identity, geography or follower count. <Link href="/about#methodology" className="rc-link">Read the methodology →</Link></p>
        </section>
      </div>
    </main>
  )
}
