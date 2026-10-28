/* Offline bundle for the five tools that can run without a server.
   Bump CACHE_VERSION whenever the bundled pages or assets change. */
var CACHE_VERSION = 'noan-studio-v25';
var CACHE_PREFIX = 'noan-studio-';
var FILES = [
  'index.html',
  'compat.html',
  'offline.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'quiz/index.html',
  'quiz/assets/pear-idle.png',
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
var URLS = FILES.map(function (path) { return new URL(path, self.registration.scope).href; });

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (cache) { return cache.addAll(URLS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (key) {
          return key.indexOf(CACHE_PREFIX) === 0 && key !== CACHE_VERSION;
        }).map(function (key) { return caches.delete(key); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.indexOf('/api/') !== -1) return;
  var inStudio = url.pathname.indexOf(new URL(self.registration.scope).pathname) === 0;
  if (!inStudio && !URLS.some(function (asset) { return new URL(asset).pathname === url.pathname; })) return;

  event.respondWith(caches.open(CACHE_VERSION).then(function (cache) {
    if (request.mode === 'navigate') {
      return fetch(request).then(function (response) {
        if (!response.ok) return response;
        return cache.put(request, response.clone()).then(function () { return response; });
      }).catch(function () {
        return cache.match(request, {ignoreSearch: true}).then(function (saved) {
          if (saved) return saved;
          throw new Error('Offline page unavailable');
        });
      });
    }
    return cache.match(request, {ignoreSearch: true}).then(function (saved) {
      if (saved) return saved;
      return fetch(request).then(function (response) {
        if (!response.ok) return response;
        return cache.put(request, response.clone()).then(function () { return response; });
      });
    });
  }));
});

self.addEventListener('message', function (event) {
  if (!event.data || event.data.type !== 'OFFLINE_PREPARE' || !event.ports[0]) return;
  event.waitUntil(caches.open(CACHE_VERSION).then(function (cache) {
    var missing = [];
    var stale = [];
    var sequence = Promise.resolve();
    URLS.forEach(function (url) {
      sequence = sequence.then(function () {
        return fetch(url, {cache: 'reload'}).then(function (response) {
          if (!response.ok) throw new Error(String(response.status));
          return cache.put(url, response);
        }).catch(function () {
          return cache.match(url).then(function (saved) {
            (saved ? stale : missing).push(new URL(url).pathname);
          });
        });
      });
    });
    return sequence.then(function () {
      event.ports[0].postMessage({ok: missing.length === 0 && stale.length === 0, version: CACHE_VERSION, total: URLS.length, missing: missing, stale: stale});
    });
  }));
});
