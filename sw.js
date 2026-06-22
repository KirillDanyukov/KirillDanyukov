'use strict';

const CACHE = 'v8';

const PRECACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/game.js',
  '/влево.webp',
  '/вправо.webp',
  '/lang.js',
  '/script.js',
  '/fonts/fonts.css',
  '/fonts/caveat-cyrillic.woff2',
  '/fonts/caveat-cyrillic-ext.woff2',
  '/fonts/caveat-latin.woff2',
  '/fonts/caveat-latin-ext.woff2',
  '/fonts/indie-flower-400.woff2',
  '/fonts/patrick-hand-400.woff2',
  '/favicon.svg',
  '/favicon.ico',
  // Hero image — responsive variants (prioritised for fast first paint)
  '/Фото/responsive/Фото-1-480.webp',
  '/Фото/responsive/Фото-1-768.webp',
  // Video thumbnails (original, small files)
  '/Видео/Обложка 1.webp',
  '/Видео/Обложка 2.webp',
  '/Видео/Обложка 3.webp',
  '/Видео/Обложка 4.webp',
  '/Видео/Обложка 5.webp',
  '/Видео/Обложка 6.webp',
  '/Видео/Обложка 7.webp',
  '/Видео/Обложка 8.webp',
  // Original photos kept as fallback for lightbox display
  '/Фото/Фото 1.webp',
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
  const url = e.request.url;

  // Never intercept video files — too large to cache
  if (url.includes('/Видео/Видео') && url.endsWith('.webm')) return;

  // Bypass cache on localhost for easier development updates
  const isLocal = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
  if (isLocal) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (!res || res.status !== 200 || res.type === 'opaque') return res;
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Network-first for HTML (get updates)
  if (e.request.mode === 'navigate' || url.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for everything else (fonts, images, CSS, JS, subtitles)
  // Responsive image variants and PNG downloads are cached on first access.
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    })
  );
});
