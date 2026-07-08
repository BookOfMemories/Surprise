/* ================================================================
   Service Worker — Our Little Book of Memories
   Cache-first strategy for all static assets.
   ================================================================ */

const CACHE_NAME  = 'book-of-memories-v4';

/* All files to pre-cache on install */
const PRECACHE = [
  './',
  './index.html',
  './letter.html',
  './manifest.json',

  /* CSS */
  './css/style.css',
  './css/animations.css',
  './css/book.css',
  './css/mobile.css',

  /* JS */
  './js/app.js',
  './js/book.js',
  './js/chapters.js',
  './js/config.js',
  './js/music.js',
  './js/storage.js',

  /* Icons */
  './images/icons/icon-192x192.png',
  './images/icons/icon-512x512.png',

  /* Chapter images */
  './images/chapters/ch01.jpg',
  './images/chapters/ch02.jpg',
  './images/chapters/ch03.jpg',
  './images/chapters/ch04.jpg',
  './images/chapters/ch05.jpg',
  './images/chapters/ch06.jpg',
  './images/chapters/ch07.jpg',
  './images/chapters/ch08.jpg',
  './images/chapters/ch09.jpg',
  './images/chapters/ch10.jpg',
  './images/chapters/ch11.jpg',
  './images/chapters/ch12.jpg',
  './images/chapters/ch13.jpg',
  './images/chapters/ch14a.jpg',
  './images/chapters/ch14b.jpg',
  './images/chapters/ch14c.jpg',
  './images/chapters/ch14d.jpg',
  './images/chapters/ch15.jpg',
  './images/chapters/ch16.jpg',
];

/* ── Install: pre-cache everything ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      /* Use individual adds so one missing image doesn't block all */
      return Promise.allSettled(
        PRECACHE.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

/* ── Activate: remove old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: cache-first, fallback to network ── */
self.addEventListener('fetch', event => {
  /* Only handle GET requests for same-origin or GH Pages assets */
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        /* Cache successful responses */
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      /* Offline fallback for navigation */
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
