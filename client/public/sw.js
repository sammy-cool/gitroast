// ============================================================
// GITROAST — Progressive Web App (PWA) Service Worker
// ============================================================
// WHAT: Lightweight service worker providing offline caching for static assets
//       while prioritizing real-time network requests for API routes and dynamic pages.
//
// WHY: Enables mobile 'Add to Home Screen' PWA installation and faster asset loading
//      without breaking real-time AI streaming or Express API contracts.
// ============================================================

const CACHE_NAME = 'gitroast-static-v1'
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
]

// ── Install Event ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// ── Activate Event ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

// ── Fetch Event (Network-First for APIs, Cache-First for Assets) ───
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests and SSE streaming
  if (event.request.method !== 'GET') return
  if (url.pathname.includes('/stream') || url.pathname.startsWith('/api/')) {
    return // Pure network pass-through for API requests
  }

  // Static Assets (fonts, images, manifest, icons): Cache-first with network fallback
  if (
    url.pathname.match(/\.(svg|png|jpg|jpeg|gif|ico|webp|woff|woff2|ttf)$/) ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) return response
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
          return response
        }).catch(() => null)
      })
    )
    return
  }

  // Navigation & HTML: Network-first with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
