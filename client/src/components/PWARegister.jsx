'use client'


import { useEffect } from 'react'
import { notify, toast } from '@/utils/toast'

let deferredPrompt = null

export async function promptPWAInstall() {
  if (!deferredPrompt) return false
  try {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    return outcome === 'accepted'
  } catch {
    return false
  }
}

export function isPWAInstallable() {
  return Boolean(deferredPrompt)
}

const NUDGE_KEY = 'gitroast_install_nudge_at'
const NUDGE_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000

// Install with restraint: only after the person has seen value (a finished roast),
// at most once per 14 days, never when already installed or not installable.
export function maybeNudgeInstall() {
  try {
    if (!deferredPrompt) return
    if (window.matchMedia?.('(display-mode: standalone)').matches) return
    const last = Number(localStorage.getItem(NUDGE_KEY) || 0)
    if (Date.now() - last < NUDGE_COOLDOWN_MS) return
    localStorage.setItem(NUDGE_KEY, String(Date.now()))
    notify.installApp({
      onAction: async () => {
        if (await promptPWAInstall()) toast.success('GitRoast installed', { description: 'Open it from your home screen.' })
      },
    })
  } catch {
    /* storage unavailable: skip the nudge */
  }
}

export default function PWARegister() {
  // Offline honesty: say so once, and confirm when we are back.
  useEffect(() => {
    const off = () => notify.offline()
    const on = () => notify.backOnline()
    window.addEventListener('offline', off)
    window.addEventListener('online', on)
    if (!navigator.onLine) off()
    return () => {
      window.removeEventListener('offline', off)
      window.removeEventListener('online', on)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    function handleLoad() {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {})
    }

    function handleInstallPrompt(e) {
      e.preventDefault()
      deferredPrompt = e
      window.dispatchEvent(new CustomEvent('gitroast-installable', { detail: { available: true } }))
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
    }
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)

    return () => {
      window.removeEventListener('load', handleLoad)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
    }
  }, [])

  return null
}

