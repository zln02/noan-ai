/* 노안중 AI 안내서 — 오프라인용 서비스 워커.
   화면 글과 데이터는 미리 담아 두고(precache), 그림은 본 만큼 담는다(runtime).
   안내서 문장이나 파일 목록을 바꿨다면 CACHE_VERSION 숫자를 하나 올린다. 이 파일 하나만 고치면 된다. */
var CACHE_VERSION = 'noan-guide-v4';
var CACHE_PREFIX = 'noan-guide-';
var CORE = [
  'index.html', 'manifest.webmanifest', 'offline.html',
  'shared/tokens.css', 'shared/site.css', 'shared/portal.css', 'shared/portal-pages.css', 'shared/app.css',
  'shared/app.js', 'shared/motion.js', 'shared/dial.js', 'data/schedule.js', 'shared/icons.js', 'shared/site.js', 'shared/feedback.js', 'shared/config.js',
  'guide/guide.css', 'guide/home.js',
  'data/tasks.js', 'data/tasks.json', 'data/guides.js', 'data/guides.json',
  'data/ai-models.js', 'data/ai-models.json', 'data/terms.js', 'data/terms.json',
  'iamodu/index.html', 'ai/index.html', 'ai/ai.js', 'terms/index.html', 'terms/terms.js', 'how-ai-answers/index.html', 'how-ai-answers/how.js', 'how-ai-answers/scene3d.js', 'iamodu/iamodu.js',
  'terms/anim/model.html', 'terms/anim/prompt.html', 'terms/anim/harness.html', 'terms/anim/skill.html', 'terms/anim/tool.html', 'terms/anim/hallucination.html',
  'shared/vendor/three/three.min.js', 'start/index.html',
  'training/index.html', 'library/index.html', 'library/rules.html', 'library/approval.html', 'data/approval.js',
  'showcase/index.html', 'data/showcase.js', 'request/index.html', 'data/requests.js', 'about/index.html',
  'assets/logo.png', 'assets/noan-ai-icon-32.png', 'assets/noan-ai-touch-180.png',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/guide-hero-sm.jpg', 'assets/guide-hero.jpg'
];
var scopeURL = self.registration.scope;
function abs(p) { return new URL(p, scopeURL).href; }

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_VERSION).then(function (cache) {
    /* 파일 하나가 없어도 설치가 멎지 않게 하나씩 담는다 */
    return Promise.all(CORE.map(function (p) { return cache.add(abs(p)).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE_VERSION; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           /* 바깥 주소는 건드리지 않는다 */
  var path = url.pathname.replace(new URL(scopeURL).pathname, '');
  if (path.indexOf('studio/') === 0 || path.indexOf('ops/') === 0) return;  /* 수업 도구는 자기 워커가 있다 */

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || caches.match(abs('offline.html'));
      });
    }));
    return;
  }
  /* 그 밖: 담아 둔 것을 먼저 보여 주고, 뒤에서 새로 받아 둔다 */
  event.respondWith(caches.open(CACHE_VERSION).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
