// GitRoast service worker v2 — offline-aware, never caches API calls.
const STATIC_CACHE = 'gitroast-static-v2'
const PAGE_CACHE = 'gitroast-pages-v2'
const PRECACHE_ASSETS = ['/offline', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      // Best effort: one missing asset must not break installation.
      .then((cache) => Promise.all(PRECACHE_ASSETS.map((u) => cache.add(u).catch(() => null))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return
  if (url.pathname.includes('/stream') || url.pathname.startsWith('/api/')) return

  // Static assets: cache-first.
  if (url.pathname.startsWith('/_next/static/') || /\.(svg|png|jpg|jpeg|gif|ico|webp|woff2?|ttf)$/.test(url.pathname) || url.pathname === '/manifest.json') {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached
        return fetch(req).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy))
          }
          return res
        })
      }),
    )
    return
  }

  // Page navigations: network first, then the last good copy, then the offline page.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(PAGE_CACHE).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/offline'))),
    )
  }
})
