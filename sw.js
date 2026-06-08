'use strict';

const CACHE = 'v3';

const PRECACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/lang.js',
  '/script.js',
  '/fonts/fonts.css',
  '/fonts/caveat-400.woff2',
  '/fonts/caveat-600.woff2',
  '/fonts/caveat-700.woff2',
  '/fonts/indie-flower-400.woff2',
  '/fonts/patrick-hand-400.woff2',
  '/favicon.svg',
  '/favicon.ico',
  // Photos
  '/Фото/Фото 1.webp',
  '/Фото/Фото 2.webp',
  '/Фото/Фото 3.webp',
  '/Фото/Фото 4.webp',
  '/Фото/Фото 5.webp',
  '/Фото/Фото 6.webp',
  '/Фото/Фото 7.webp',
  '/Фото/Фото 8.webp',
  '/Фото/Фото 9.webp',
  '/Фото/Фото 10.webp',
  '/Фото/Фото 11.webp',
  '/Фото/Фото 12.webp',
  '/Фото/Фото 13.webp',
  '/Фото/Фото 14.webp',
  '/Фото/Фото 15.webp',
  '/Фото/Фото 16.webp',
  '/Фото/Фото 17.webp',
  '/Фото/Фото 18.webp',
  '/Фото/Фото 19.webp',
  '/Фото/Фото 20.webp',
  '/Фото/Фото 21.webp',
  '/Фото/Фото 22.webp',
  '/Фото/Фото 23.webp',
  '/Фото/Фото 24.webp',
  // Video thumbnails
  '/Видео/Обложка 1.webp',
  '/Видео/Обложка 2.webp',
  '/Видео/Обложка 3.webp',
  '/Видео/Обложка 4.webp',
  '/Видео/Обложка 5.webp',
  '/Видео/Обложка 6.webp',
  '/Видео/Обложка 7.webp',
  '/Видео/Обложка 8.webp',
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
