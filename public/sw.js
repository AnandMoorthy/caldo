/* Simple service worker for Vite static build */
const CACHE_NAME = 'caldo-cache-v2';
// Determine the base path where the app is served (works for root or /<repo>/)
const BASE_PATH = new URL(self.registration.scope).pathname;
const CORE_ASSETS = [
  BASE_PATH,
  BASE_PATH + 'index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME ? caches.delete(k) : null)))
  );
  self.clients.claim();
});

self.addEventListener('notificationclick', (event) => {
  const data = event.notification?.data || {};
  event.notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        try {
          client.postMessage({
            type: 'OPEN_JOURNAL',
            openTab: data.openTab || 'journal',
          });
        } catch {}
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(BASE_PATH);
      }
      return undefined;
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isHtml =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    url.pathname === BASE_PATH ||
    url.pathname === BASE_PATH + 'index.html';

  // Always try the network first for HTML so hashed asset URLs stay in sync
  // with the latest deploy after a domain or base-path change.
  if (isHtml) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy).catch(() => {});
          });
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy).catch(() => {});
          });
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
