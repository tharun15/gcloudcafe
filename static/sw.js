/**
 * GCloud Cafe High-Performance Service Worker
 * Implements CacheFirst for immutable static assets (fonts, css, js, images)
 * and NetworkFirst for HTML navigation requests.
 */

const CACHE_NAME = 'gcloudcafe-v3.0';

const STATIC_ASSETS = [
  '/',
  '/fonts/fa-solid-900.woff2',
  '/fonts/fa-brands-400.woff2',
  '/fonts/fa-regular-400.woff2',
  '/images/logo.png',
  '/images/logo-darkmode.png',
  '/images/favicon.png'
];

// Install: precache critical assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW Precache error:', err);
      });
    })
  );
});

// Activate: clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy based on request type
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests or internal schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. Static Assets: Cache-First strategy (fonts, css, js, images, plugins, webp)
  const isStaticAsset =
    url.pathname.match(/\.(?:woff2|woff|ttf|css|js|png|jpg|jpeg|webp|svg|gif|ico)$/i) ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'fonts.googleapis.com';

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            return caches.match(request);
          });
      })
    );
    return;
  }

  // 2. HTML Navigation: Network-First strategy with Cache Fallback
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }
});
