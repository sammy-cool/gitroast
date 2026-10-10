'use client'


import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast, notify } from '@/utils/toast'
import { playFireSizzle } from '@/utils/soundFX'
import AnalyzingScreen from '@/components/AnalyzingScreen'
import dynamic from 'next/dynamic';
const RoastCard = dynamic(() => import('@/components/RoastCard'));
const ProModal = dynamic(() => import('@/components/ProModal'), { ssr: false });
import Link from 'next/link';
import { getRoast } from '@/services/roastService'
import { useAuth } from '@/context/AuthContext'
import { normalizeIntensity, normalizePersona } from '@/utils/vocab'

const MIN_ANALYSIS_TIME = 5800
const parsedScore = (d) => d?.score ?? ''

export default function RoastPageClient({ username }) {
  const [view, setView] = useState('analyzing')
  const [roastData, setRoastData] = useState(null)
  const [showProModal, setShowProModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getToken, isPro, user } = useAuth()

  const idempotencyKey = useRef('')

  useEffect(() => {
    if (!idempotencyKey.current) {
      idempotencyKey.current = `${username}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
    if (
      !username ||
      username.length > 39 ||
      !/^[a-zA-Z0-9-]+$/.test(username)
    ) {
      toast.error('Invalid GitHub username.')
      router.push('/')
      return
    }

    let cancelled = false

    async function fetchRoast() {
      const cacheKey = `gitroast_roast_${username}`
      const cachedRoast = sessionStorage.getItem(cacheKey)

      if (cachedRoast) {
        try {
          const parsed = JSON.parse(cachedRoast)
          const cacheAge = Date.now() - parsed.cachedAt
          if (cacheAge < 10 * 60 * 1000) {
            if (cancelled) return
            setRoastData(parsed.data)
            setView('result')
            playFireSizzle()
            return
          } else {
            sessionStorage.removeItem(cacheKey)
          }
        } catch {
          sessionStorage.removeItem(cacheKey)
        }
      }

      try {
        const token = getToken()
        const queryIntensity = searchParams.get('intensity')
        const queryPersona = searchParams.get('persona')
        const intensity = normalizeIntensity(queryIntensity || sessionStorage.getItem('gitroast_intensity'))
        const persona = normalizePersona(queryPersona || sessionStorage.getItem('gitroast_persona'))

        const [data] = await Promise.all([
          getRoast(username, idempotencyKey.current, token, intensity, persona),
          new Promise(resolve => setTimeout(resolve, MIN_ANALYSIS_TIME)),
        ])

        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ data, cachedAt: Date.now() }))
        } catch {
        }
        setRoastData(data)
        setView('result')
        playFireSizzle()

        notify.roastReady({ username, score: parsedScore(data), onAction: () => document.querySelector('.rr')?.scrollIntoView({ behavior: 'smooth' }) })

      } catch (err) {
        if (cancelled) return

        if (err.code === 'ORGANIZATION_NOT_SUPPORTED') {
          toast.error(err.message || `@${username} is an Organization. GitRoast roasts individual developers!`)
          router.push('/')
          return
        }

        if (err.code === 'USER_NOT_FOUND') {
          toast.error(`GitHub user "@${username}" not found.`, {
            cta: {
              label: 'Search Wall 🔍',
              onClick: () => router.push('/leaderboard'),
              autoClose: true,
            },
          })
          router.push('/')
          return
        }

        if (err.code === 'RATE_LIMIT_EXCEEDED') {
          const isOurLimit = err.status === 429
          const retryAfter = err.retryAfter || 60
          const seconds = `${retryAfter} seconds`

          if (isOurLimit && retryAfter) {
            sessionStorage.setItem('gitroast_rate_limit', JSON.stringify({
              retryAfter,
              setAt: Date.now(),
            }))
          }

          const isLoggedIn = !!getToken();
          toast.rateLimit(
            retryAfter,
            !isLoggedIn
              ? () => {
                  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
                  window.location.href = `${apiBase}/api/auth/github`
                }
              : null
          )
          router.push('/')
          return
        }

        if (err.code === 'CAPTCHA_REQUIRED' || err.code === 'CAPTCHA_FAILED') {
          const isLoggedIn = !!getToken();
          toast.warning(
            err.message || (isLoggedIn ? 'Bot verification check could not be completed. Please try again.' : 'Bot verification blocked by browser shield. Please log in with GitHub to roast!'),
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
          router.push('/')
          return
        }

        if (err.name === 'TimeoutError') {
          toast.error('Request timed out. Try again.')
          router.push('/')
          return
        }

        toast.error('Something broke. Not your fault... probably.')
        router.push('/')
      }
    }

    fetchRoast()
    return () => { cancelled = true }
  }, [username, router, getToken, searchParams])

  function handleRoastAnother() {
    sessionStorage.removeItem(`gitroast_roast_${username}`)
    router.push('/')
  }

  if (view === 'analyzing') {
    return <AnalyzingScreen username={username} />
  }

  if (view === 'result' && roastData) {
    return (
      <>
        <main className="roast-result-page">
          <RoastCard
            data={{ ...roastData, isPro }}
            onProClick={() => setShowProModal(true)}
            onRoastAnother={handleRoastAnother}
            historyHref={`/history/${roastData.username}`}
          />

          {user?.proPlan !== 'historian' && (
            <Link href="/pricing" className="gr-card gr-card--interactive roast-upsell">
              <div>
                <p className="gr-eyebrow">Historian</p>
                <p className="roast-upsell__title">Monthly report, score trends and roast history.</p>
              </div>
              <span className="gr-btn gr-btn--outline">See plans</span>
            </Link>
          )}
        </main>

        {showProModal && <ProModal onClose={() => setShowProModal(false)} />}

        <style jsx>{`
          .roast-result-page { min-height: 100vh; padding: 24px 24px 64px; background: var(--paper); }
          .roast-upsell { max-width: 1280px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; text-decoration: none; color: inherit; }
          .roast-upsell__title { font: 500 18px var(--font-sans); margin-top: 4px; }
          @media (max-width: 700px) { .roast-result-page { padding: 12px 12px 48px; } }
        `}</style>
      </>
    )
  }

  return null
}

