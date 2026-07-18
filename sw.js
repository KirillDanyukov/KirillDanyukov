'use strict';

const CACHE = 'v2';

const PRECACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/lang.js',
  '/game.js',
  '/fonts/fonts.css',
  '/fonts/caveat-cyrillic-ext.woff2',
  '/fonts/caveat-cyrillic.woff2',
  '/fonts/caveat-latin-ext.woff2',
  '/fonts/caveat-latin.woff2',
  '/favicon.svg',
  '/favicon.ico',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (e.request.method !== 'GET') return;

  if (url.pathname.includes('/Видео/Видео') && url.pathname.endsWith('.webm')) return;

  const isNavigation = e.request.mode === 'navigate' || e.request.destination === 'document' || url.pathname === '/' || url.pathname.endsWith('.html');
  if (isNavigation) {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then(cached => {
        const networkFetch = fetch(e.request)
          .then(res => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE).then(cache => cache.put(e.request, clone));
            }
            return res;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      });
    })
  );
});
