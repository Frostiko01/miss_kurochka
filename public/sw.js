/* Miss Kurochka — Service Worker
 * Стратегии:
 *  - Навигация (HTML): network-first → кеш → офлайн-страница
 *  - Статика (_next/static, изображения, иконки): cache-first
 *  - Прочее: stale-while-revalidate
 * API-запросы (/api/*) и аутентификация не кешируются.
 */

const VERSION = 'v1.0.2'
const PRECACHE = `mk-precache-${VERSION}`
const RUNTIME = `mk-runtime-${VERSION}`
const OFFLINE_URL = '/offline'

// Базовые ресурсы, которые кешируем сразу при установке
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/logo.png',
  '/icon-192.png?v=3',
  '/icon-512.png?v=3',
  '/apple-icon.png?v=3',
  '/favicon.ico?v=3',
]

// ── INSTALL: предзагрузка офлайн-страницы и базовых ресурсов ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE)
      // addAll падает целиком, если хоть один ресурс не загрузился — кешируем по одному
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })),
        ),
      )
      await self.skipWaiting()
    })(),
  )
})

// ── ACTIVATE: чистим старые кеши ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key !== PRECACHE && key !== RUNTIME)
          .map((key) => caches.delete(key)),
      )
      // Включаем navigation preload, если поддерживается
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable()
      }
      await self.clients.claim()
    })(),
  )
})

// Определяем, нужно ли вообще трогать запрос
function shouldBypass(request, url) {
  // Только GET
  if (request.method !== 'GET') return true
  // Другой origin (CDN, аналитика, S3-картинки и т.д.) — пропускаем
  if (url.origin !== self.location.origin) return true
  // API, авторизация, server actions — всегда сеть
  if (url.pathname.startsWith('/api/')) return true
  if (url.pathname.startsWith('/admin')) return true
  if (url.pathname.startsWith('/branch')) return true
  return false
}

// ── FETCH ──
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (shouldBypass(request, url)) return

  // Навигационные запросы (открытие страниц)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Сначала пробуем navigation preload
          const preload = await event.preloadResponse
          if (preload) return preload

          const network = await fetch(request)
          return network
        } catch {
          // Сеть недоступна → отдаём кеш страницы или офлайн-страницу
          const cache = await caches.open(PRECACHE)
          const cached = await cache.match(request)
          if (cached) return cached
          const offline = await cache.match(OFFLINE_URL)
          if (offline) return offline
          return new Response('Офлайн', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        }
      })(),
    )
    return
  }

  // Статика Next.js и изображения → cache-first
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image') ||
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|otf)$/.test(url.pathname)

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME)
        const cached = await cache.match(request)
        if (cached) return cached
        try {
          const network = await fetch(request)
          if (network && network.status === 200) {
            cache.put(request, network.clone())
          }
          return network
        } catch {
          return cached || Response.error()
        }
      })(),
    )
    return
  }

  // Прочие GET-запросы → stale-while-revalidate
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME)
      const cached = await cache.match(request)
      const networkPromise = fetch(request)
        .then((network) => {
          if (network && network.status === 200) {
            cache.put(request, network.clone())
          }
          return network
        })
        .catch(() => null)
      return cached || (await networkPromise) || Response.error()
    })(),
  )
})

// ── PUSH (заготовка под уведомления) ──
self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Miss Kurochka', body: event.data.text() }
  }
  const title = payload.title || 'Miss Kurochka'
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: payload.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// ── Клик по уведомлению ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      for (const client of allClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl)
    })(),
  )
})

// Позволяет странице форсировать обновление SW
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})
