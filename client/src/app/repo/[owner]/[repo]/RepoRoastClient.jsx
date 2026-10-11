'use client'


import { normalizeIntensity } from '@/utils/vocab'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast, notify } from '@/utils/toast'
import AnalyzingScreen from '@/components/AnalyzingScreen'
import RepoRoastCard from '@/components/RepoRoastCard'
import ProModal from '@/components/ProModal'
import Breadcrumb from '@/components/Breadcrumb'
import { getRepoRoast } from '@/services/roastService'
import { useAuth } from '@/context/AuthContext'

const MIN_ANALYSIS_TIME = 4500

export default function RepoRoastClient({ owner, repo }) {
  const [view, setView] = useState('analyzing')
  const [roastData, setRoastData] = useState(null)
  const [showProModal, setShowProModal] = useState(false)
  const router = useRouter()
  const { getToken } = useAuth()

  const idempotencyKey = useRef('')

  useEffect(() => {
    if (!idempotencyKey.current && owner && repo) {
      idempotencyKey.current = `repo-${owner}-${repo}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }

    if (!owner || !repo) {
      toast.error('Invalid repository target.')
      router.push('/')
      return
    }

    let cancelled = false

    async function fetchRepo() {
      const cacheKey = `gitroast_repo_${owner}_${repo}`
      try {
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.cachedAt < 5 * 60 * 1000) {
            if (cancelled) return
            setRoastData(parsed.data)
            setView('result')
            return
          }
        }
      } catch {
      }
      try {
        const token = getToken()
        const intensity = normalizeIntensity(sessionStorage.getItem('gitroast_intensity'))

        const [data] = await Promise.all([
          getRepoRoast(owner, repo, token, intensity, idempotencyKey.current),
          new Promise((resolve) => setTimeout(resolve, MIN_ANALYSIS_TIME)),
        ])

        if (cancelled) return

        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ data, cachedAt: Date.now() }))
        } catch {
        }

        setRoastData(data)
        setView('result')

        notify.roastReady({ username: `${owner}/${repo}`, score: data?.score ?? '', line: 'The repository has opinions.' })
      } catch (err) {
        if (cancelled) return
        setView('error')

        if (err.status === 404 || err.code === 'REPO_NOT_FOUND') {
          toast.error(`Repository "${owner}/${repo}" not found or is private.`)
        } else if (err.status === 429) {
          toast.rateLimit(err.retryAfter || 60, () => {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
            window.location.href = `${apiBase}/api/auth/github`
          })
        } else {
          toast.error(err.message || 'Failed to roast repository.')
        }
      }
    }

    fetchRepo()

    return () => {
      cancelled = true
    }
  }, [owner, repo, router, getToken])

  return (
    <main className="repo-page">
      {view === 'analyzing' && <AnalyzingScreen username={`${owner}/${repo}`} />}

      {view === 'result' && roastData && (
        <div className="repo-result">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: `@${owner}`, href: `/history/${owner}` }, { label: `${repo}` }]} />
          <RepoRoastCard data={roastData} onProClick={() => setShowProModal(true)} />
        </div>
      )}

      {view === 'error' && (
        <div className="gr-state gr-state--error repo-error" role="alert">
          <span className="gr-state__tag">Error</span>
          <h1 className="gr-h3">Repository roast failed</h1>
          <p className="gr-help">Could not analyze {owner}/{repo}. The repository might be private, empty, or rate limited. Nothing was charged.</p>
          <Link href="/" className="gr-btn gr-btn--primary">Try another target</Link>
        </div>
      )}

      {showProModal && <ProModal isOpen={showProModal} onClose={() => setShowProModal(false)} />}

      <style jsx>{`
        .repo-page { min-height: 100vh; padding: 24px 24px 72px; background: var(--paper); }
        .repo-result { max-width: 1280px; margin: 0 auto; display: grid; gap: 16px; }
        .repo-error { max-width: 520px; margin: 64px auto; display: grid; gap: 12px; justify-items: start; padding: 28px; }
        @media (max-width: 700px) { .repo-page { padding: 12px 12px 56px; } }
      `}</style>
    </main>
  )
}
