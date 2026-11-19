/* Service worker for Vite static build + journal reminder web push */
const CACHE_NAME = 'caldo-cache-v3';
const BASE_PATH = new URL(self.registration.scope).pathname;
const CORE_ASSETS = [
  BASE_PATH,
  BASE_PATH + 'index.html'
];
const REMINDER_STORE = 'journal-reminder-schedule-v1';

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

function iconPath() {
  return BASE_PATH + 'icons/icon-192.png';
}

async function showJournalNotification(payload = {}) {
  const title = payload.title || 'Time to journal';
  const body = payload.body || "Take a moment to write today's journal entry.";
  const data = payload.data || { type: 'journal-reminder', openTab: 'journal' };
  await self.registration.showNotification(title, {
    body,
    icon: iconPath(),
    badge: iconPath(),
    tag: 'caldo-journal-reminder',
    renotify: true,
    data,
  });
}

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let payload = {
      title: 'Time to journal',
      body: "Take a moment to write today's journal entry.",
      data: { type: 'journal-reminder', openTab: 'journal' },
    };
    try {
      if (event.data) {
        const parsed = event.data.json();
        payload = {
          title: parsed.title || payload.title,
          body: parsed.body || payload.body,
          data: parsed.data || payload.data,
        };
      }
    } catch {
      try {
        const text = event.data && event.data.text();
        if (text) payload.body = text;
      } catch {}
    }
    await showJournalNotification(payload);
  })());
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

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type !== 'SCHEDULE_JOURNAL_REMINDER') return;

  event.waitUntil((async () => {
    try {
      const cache = await caches.open(REMINDER_STORE);
      const body = new Response(JSON.stringify({
        reminder: data.reminder || null,
        updatedAt: Date.now(),
      }));
      await cache.put('schedule', body);
    } catch {}
  })());
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
