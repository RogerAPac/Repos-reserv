/* Service Worker - Majora Games PWA
   Estrategia: cache-first para assets propios, network-first para CDN.
*/
const CACHE_NAME = 'majora-games-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/layout.css',
  './css/tarjeta.css',
  './js/tarjeta.js',
  './js/layout.js'
];

// Instalación: precachear assets propios
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar caches viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first para propios, network-first para CDN
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // Cache-first (assets locales)
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        }).catch(() => caches.match('./index.html'));
      })
    );
  } else {
    // Network-first (CDN: Bootstrap, jQuery, imágenes)
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
  }
});
