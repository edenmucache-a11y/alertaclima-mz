/**
 * sw.js — Service Worker mínimo para PWA
 *
 * Estratégia: cache-first para assets estáticos, network-first para a API.
 */
const CACHE_NAME = 'alertaclima-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // API: network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          // Cache GET bem-sucedidos por 1 min
          if (event.request.method === 'GET' && resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  // Static: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((resp) => {
      if (resp.ok) {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
      }
      return resp;
    }))
  );
});
