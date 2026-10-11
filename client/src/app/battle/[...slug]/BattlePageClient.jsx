'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast, notify } from '@/utils/toast'
import BattleCard from '@/components/BattleCard'
import Breadcrumb from '@/components/Breadcrumb'
import { getBattleRoast } from '@/services/roastService'
import { useAuth } from '@/context/AuthContext'

const MIN_BATTLE_TIME = 6000

const BATTLE_STEPS = [
    { text: 'Fetching both profiles', delay: 0 },
    { text: 'Reading the first commit history', delay: 800 },
    { text: 'Reading the second commit history', delay: 1600 },
    { text: 'Comparing public signals', delay: 2400 },
    { text: 'Counting abandoned repositories', delay: 3200 },
    { text: 'Writing the verdict', delay: 4000 },
    { text: 'Weighing the evidence', delay: 4800 },
    { text: 'Preparing the result', delay: 5600 },
]

export default function BattlePageClient({ user1, user2 }) {
    const [view, setView] = useState('analyzing')
    const [battleData, setBattleData] = useState(null)
    const [visibleSteps, setVisibleSteps] = useState(0)
    const router = useRouter()
    const searchParams = useSearchParams()
    const isRematch = searchParams?.get('rematch') === 'true'
    const { getToken } = useAuth()

    useEffect(() => {
        const timers = BATTLE_STEPS.map((step, i) =>
            setTimeout(() => setVisibleSteps(i + 1), step.delay)
        )
        return () => timers.forEach(clearTimeout)
    }, [])

    useEffect(() => {
        let cancelled = false

        async function fetchBattle() {
            const pairKey = [(user1 || '').toLowerCase(), (user2 || '').toLowerCase()].sort().join('-vs-')
            const cacheKey = `gitroast_battle_${pairKey}`
            if (!isRematch) {
                try {
                    const cached = sessionStorage.getItem(cacheKey)
                    if (cached) {
                        const parsed = JSON.parse(cached)
                        if (Date.now() - parsed.cachedAt < 5 * 60 * 1000) {
                            if (cancelled) return
                            setBattleData(parsed.data)
                            setView('result')
                            return
                        }
                    }
                } catch {
                }
            }

            try {
                const token = getToken()

                const [data] = await Promise.all([
                    getBattleRoast(user1, user2, token, isRematch),
                    new Promise(resolve => setTimeout(resolve, MIN_BATTLE_TIME)),
                ])

                if (cancelled) return

                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify({ data, cachedAt: Date.now() }))
                } catch {
                }

                setBattleData(data)
                setView('result')

                notify.battleComplete({ winner: data.winner, score: `${data.score1}–${data.score2}`, onAction: () => router.push(`/battle/${user1}/vs/${user2}?rematch=true`) })

            } catch (err) {
                if (cancelled) return

                const isLoggedIn = !!getToken();
                if (err.code === 'CAPTCHA_REQUIRED' || err.code === 'CAPTCHA_FAILED') {
                    toast.warning(
                        err.message || (isLoggedIn ? 'Bot verification check could not be completed. Please try again.' : 'Bot verification blocked by browser shield. Please log in with GitHub to battle!'),
                        {
                            duration: 8000,
                            ...(!isLoggedIn && {
                                cta: {
                                    label: 'Login via GitHub ↗',
                                    onClick: () => {
                                        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
                                        window.location.href = `${apiBase}/api/auth/github`
                                    },
                                    autoClose: true,
                                },
                            }),
                        }
                    )
                } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
                    toast.rateLimit(
                        err.retryAfter,
                        !isLoggedIn
                            ? () => {
                                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
                                window.location.href = `${apiBase}/api/auth/github`
                            }
                            : null
                    )
                } else {
                    toast.error(err.message || 'Battle failed. Check both usernames.')
                }
                router.push('/battle')
            }
        }

        fetchBattle()
        return () => { cancelled = true }
    }, [user1, user2, router, getToken, isRematch])

    const progress = Math.round((visibleSteps / BATTLE_STEPS.length) * 100)
    const current = BATTLE_STEPS[Math.max(0, visibleSteps - 1)]

    if (view === 'analyzing') {
        return (
            <main className="bp-wait" role="status" aria-live="polite">
                <div className="gr-state gr-state--loading bp-wait__card">
                    <span className="gr-state__tag">Loading</span>
                    <h1 className="gr-h3">Battle in progress</h1>
                    <p className="gr-help">@{user1} vs @{user2}. Comparing public evidence for both profiles.</p>
                    <div className="gr-meter">
                        <div className="gr-meter__head"><span>{current.text}</span><b>{progress}%</b></div>
                        <div className="gr-meter__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Battle progress">
                            <div className="gr-meter__fill" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>
                <style jsx>{`
          .bp-wait { min-height: 70vh; display: grid; place-items: center; padding: 32px 16px; background: var(--paper); }
          .bp-wait__card { width: min(520px, 100%); display: grid; gap: 14px; padding: 28px; }
        `}</style>
            </main>
        )
    }

    if (view === 'result' && battleData) {
        return (
            <main className="bp-result">
                <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Battles', href: '/battle' }, { label: `@${user1} vs @${user2}` }]} />
                <BattleCard data={battleData} />
                <style jsx>{`
          .bp-result { min-height: 100vh; padding: 24px 24px 72px; background: var(--paper); display: grid; gap: 16px; align-content: start; }
          @media (max-width: 700px) { .bp-result { padding: 12px 12px 56px; } }
        `}</style>
            </main>
        )
    }

    return null
}
