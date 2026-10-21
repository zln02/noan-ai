/* Offline bundle for the five tools that can run without a server.
   Bump CACHE_VERSION whenever the bundled pages or assets change. */
const CACHE_VERSION = 'noan-studio-v4';
const CACHE_PREFIX = 'noan-studio-';
const FILES = [
  'index.html',
  'offline.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'quiz/index.html',
  'quiz/fonts/jua.woff2',
  'dokdo/index.html',
  'dokdo/img/pear-happy.webp',
  'dokdo/img/pear-idle.webp',
  'dokdo/img/pear-sad.webp',
  'dokdo/img/pear-star.webp',
  'dokdo-ox/index.html',
  'dokdo-ox/img/dokdo-scene.webp',
  'dokdo-ox/img/gangchi-happy.webp',
  'dokdo-ox/img/gangchi-idle.webp',
  'dokdo-ox/img/gangchi-sad.webp',
  'dokdo-ox/img/gangchi-star.webp',
  'dokdo-merge/index.html',
  'math/index.html',
  'thumbs/art-motion.webp',
  'thumbs/dokdo-merge.webp',
  'thumbs/dokdo-ox.webp',
  'thumbs/dokdo-silhouette.webp',
  'thumbs/dokdo.webp',
  'thumbs/math.webp',
  'thumbs/quiz.webp',
  '../shared/tokens.css',
  '../shared/site.css',
  '../shared/portal.css',
  '../shared/icons.js',
  '../shared/site.js',
  '../assets/logo.png',
  '../assets/noan-ai-icon-32.png',
  '../assets/noan-ai-touch-180.png'
];
const URLS = FILES.map(path => new URL(path, self.registration.scope).href);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.includes('/api/')) return;
  const inStudio = url.pathname.startsWith(new URL(self.registration.scope).pathname);
  if (!inStudio && !URLS.some(asset => new URL(asset).pathname === url.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (error) {
        const saved = await cache.match(request, {ignoreSearch: true});
        if (saved) return saved;
        throw error;
      }
    }
    const saved = await cache.match(request, {ignoreSearch: true});
    if (saved) return saved;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});

self.addEventListener('message', event => {
  if (!event.data || event.data.type !== 'OFFLINE_PREPARE' || !event.ports[0]) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const missing = [];
    for (const url of URLS) {
      if (await cache.match(url)) continue;
      try {
        const response = await fetch(url, {cache: 'reload'});
        if (!response.ok) throw new Error(String(response.status));
        await cache.put(url, response);
      } catch (_) {
        missing.push(new URL(url).pathname);
      }
    }
    event.ports[0].postMessage({ok: missing.length === 0, total: URLS.length, missing});
  })());
});
