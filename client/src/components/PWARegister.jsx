'use client'

// ============================================================
// GITROAST — PWA Service Worker Registration & Install Controller
// ============================================================
/**
 * WHAT: Registers the PWA service worker and handles browser install prompt events.
 * WHY: Enables mobile installation (PWA "Add to Home Screen") and offline caching.
 * WHERE & WHEN TO USE: Mounted once in root layout (`client/src/app/layout.jsx`).
 * USE CASES: Mobile user installs GitRoast as a native app on iOS/Android.
 * WHEN NOT TO USE: During SSR or when serviceWorker is unsupported.
 */

import { useEffect } from 'react'

let deferredPrompt = null

/**
 * WHAT: Triggers the native browser PWA installation prompt if available.
 * WHY: Allows user-initiated install from dashboard or footer buttons.
 * @returns {Promise<boolean>} Whether the prompt was shown
 */
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

/**
 * Checks whether an installation prompt is pending.
 * @returns {boolean}
 */
export function isPWAInstallable() {
  return Boolean(deferredPrompt)
}

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    // Register service worker after window load to prevent competing with initial paint
    function handleLoad() {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {})
    }

    // Capture beforeinstallprompt for user-initiated install actions
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
