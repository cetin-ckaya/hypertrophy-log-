/**
 * Hipertrofi — çevrimdışı çalışma için servis çalışanı.
 * Önbellek listesi ve sürüm, derleme sonrası scripts/pwa-postbuild.mjs tarafından yazılır.
 */
const VERSION = '__VERSION__';
const CACHE = `hipertrofi-${VERSION}`;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Sayfa açılışları: önce ağ, olmazsa önbellekteki uygulama kabuğu (çevrimdışı).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(PRECACHE[0], copy));
          return response;
        })
        .catch(() => caches.match(PRECACHE[0]).then((r) => r || Response.error()))
    );
    return;
  }

  // Diğer istekler: önbellek öncelikli, yeni gelenler önbelleğe eklenir.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
