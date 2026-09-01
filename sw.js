// P2P Group Drop Pro — offline app-shell service worker.
// The HTML file already vendors Tailwind, PeerJS and QRCode inline,
// so there's nothing external to cache — this just lets the page
// itself be reopened with zero network activity after first visit.
// Peer connections still need either internet (Online mode) or a
// shared local network (Offline mode); that part is unrelated to
// this file.

const CACHE = 'p2p-group-drop-v1';
const APP_SHELL = [
  './p2p-group-drop-pro.html',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate: serve from cache instantly if we have it,
// and refresh the cache in the background whenever the network is up.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && (response.ok || response.type === 'opaque')) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
