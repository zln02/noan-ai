/* 노안중 AI 안내서 — 오프라인용 서비스 워커.
   화면 글과 데이터는 미리 담아 두고(precache), 그림은 본 만큼 담는다(runtime).
   안내서 문장이나 파일 목록을 바꿨다면 CACHE_VERSION 숫자를 하나 올린다. 이 파일 하나만 고치면 된다. */
var CACHE_VERSION = 'noan-guide-v21';
var CACHE_PREFIX = 'noan-guide-';
var CORE = [
  'index.html', 'manifest.webmanifest', 'offline.html',
  'shared/tokens.css', 'shared/site.css', 'shared/portal.css', 'shared/portal-pages.css', 'shared/app.css',
  'shared/app.js', 'shared/motion.js', 'shared/dial.js', 'data/schedule.js', 'shared/icons.js', 'shared/site.js', 'shared/feedback.js', 'shared/config.js',
  'guide/guide.css', 'guide/home.js', 'guide/home-alpine.js', 'guide/home-alpine.css', 'shared/vendor/alpine/alpine.min.js',
  'data/tasks.js', 'data/tasks.json', 'data/guides.js', 'data/guides.json',
  'data/ai-models.js', 'data/ai-models.json', 'data/terms.js', 'data/terms.json',
  'iamodu/index.html', 'ai/index.html', 'ai/ai.js', 'terms/index.html', 'terms/terms.js', 'how-ai-answers/index.html', 'how-ai-answers/how.js', 'how-ai-answers/scene3d.js', 'iamodu/iamodu.js', 'iamodu/dict.js', 'data/iamodu-tools.js', 'data/iamodu-tools.json',
  /* assets/iamodu/*.webp(도구 사전 화면 49장)는 일부러 넣지 않는다. 줄을 펼쳐 본 그림만 아래 fetch 에서 담긴다. */
  'terms/anim/model.html', 'terms/anim/token.html', 'terms/anim/context.html', 'terms/anim/training.html', 'terms/anim/hallucination.html', 'terms/anim/prompt.html', 'terms/anim/rag.html', 'terms/anim/multimodal.html', 'terms/anim/agent.html', 'terms/anim/harness.html', 'terms/anim/privacy.html', 'terms/anim/students.html', 'terms/anim/iamodu.html',
  'shared/vendor/three/three.min.js', 'shared/premium.css', 'shared/readability.css', 'shared/zoom.js', 'shared/vendor/open-props/open-props.subset.css', 'shared/vendor/webawesome/webawesome.js', 'shared/vendor/webawesome/webawesome.css',
  'iamodu/iamodu.css', 'ai/ai.css', 'terms/terms.css', 'how-ai-answers/how.css',
  'assets/terms/model.webp', 'assets/terms/token.webp', 'assets/terms/context.webp', 'assets/terms/training.webp', 'assets/terms/hallucination.webp', 'assets/terms/prompt.webp', 'assets/terms/rag.webp', 'assets/terms/multimodal.webp', 'assets/terms/agent.webp', 'assets/terms/harness.webp', 'assets/terms/privacy.webp', 'assets/terms/students.webp',
  'start/index.html',
  /* training/s2-deck-v2.html(약 6.8MB)은 일부러 여기 넣지 않는다. 모든 방문자가 설치할 때 받게 되기 때문.
     한 번 열면 아래 navigate 처리에서 담겨서 그다음부터는 오프라인으로 열린다. */
  'training/index.html', 'library/index.html', 'library/rules.html', 'library/approval.html', 'data/approval.js',
  'showcase/index.html', 'data/showcase.js', 'about/index.html',
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
