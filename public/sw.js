// Service Worker — Dforzze PWA
const CACHE_VERSION = 'v2'
const STATIC_CACHE = `dforzze-static-${CACHE_VERSION}`
const API_CACHE = `dforzze-api-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/',
  '/dforzze-logo.png',
  '/dforzze-logo-small.png',
  '/manifest.json',
]

// ── Install: cache static assets ──────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate: delete old caches ────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ── Fetch: routing strategy ────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and cross-origin
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) return

  // API routes: Network-first, fallback to cache (offline support)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(API_CACHE).then(cache => {
              // Only cache safe endpoints (not auth/mutations)
              const safe = ['/api/productos', '/api/drops', '/api/ventas', '/api/pedidos', '/api/clientes']
              if (safe.some(path => url.pathname.startsWith(path))) {
                cache.put(request, clone)
              }
            })
          }
          return response
        })
        .catch(() =>
          caches.match(request).then(cached =>
            cached || new Response(JSON.stringify({ error: 'Sin conexión', offline: true }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            })
          )
        )
    )
    return
  }

  // Static assets: Cache-first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?|ttf)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        const clone = response.clone()
        caches.open(STATIC_CACHE).then(cache => cache.put(request, clone))
        return response
      }))
    )
    return
  }

  // HTML navigation: Network-first, fallback to cached '/' (offline shell)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/').then(cached =>
          cached || new Response('<h1>Sin conexión</h1>', {
            headers: { 'Content-Type': 'text/html' },
          })
        ))
    )
    return
  }
})
