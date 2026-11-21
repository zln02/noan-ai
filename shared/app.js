/* shared/app.js — 앱처럼 쓰는 껍데기 (머리글 메뉴 통일 · 폰 아래 탭바 · 오프라인 등록)
   외부 요청 0건. 모든 선생님 쪽 페이지가 <head> 에서 먼저 읽는다. */
(function () {
  'use strict';

  /* 이 파일 위치로 사이트 뿌리를 알아낸다 (…/shared/app.js → …/) */
  var me = document.currentScript && document.currentScript.src;
  var ROOT = me ? me.replace(/shared\/app\.js.*$/, '') : '';

  /* file:// 에서 크롬은 .json fetch 를 막고 콘솔에 빨간 오류를 남긴다.
     각 페이지는 막히면 data/*.js 의 전역 변수로 넘어가므로, 시작부터 조용히 넘기게 한다. */
  if (location.protocol === 'file:' && window.fetch) {
    var realFetch = window.fetch;
    window.fetch = function (url) {
      if (/\.(json|md)(\?|$)/.test(String(url))) return Promise.reject(new TypeError('file:// 에서는 data/*.js 를 쓴다'));
      return realFetch.apply(this, arguments);
    };
  }

  /* 움직임: 줄이기 설정이면 켜지 않는다. 켜진 경우에만 .has-motion 이 붙어 카드가 떠오른다 */
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!REDUCED && !/\/ops\//.test(location.pathname)) {
    document.documentElement.classList.add('has-motion');
    /* 첫 화면 깜빡임이 없게 head 에서 바로 읽는다 (운영 쪽은 제외) */
    if (document.readyState === 'loading') document.write('<script src="' + ROOT + 'shared/motion.js"><\/script>');
  }

  /* Web Awesome 부품(탭·펼침·복사·말풍선·진행 막대·대화 상자): 쓰는 쪽에서만, 받쳐 주는 브라우저에서만 불러온다.
     평범한 <script>(즉시 실행 함수)라 file:// 에서도 돈다. 안 불러와지면 premium.css 의 대체 모양이 남는다. */
  function needWA() {
    return document.querySelector('[data-wa],wa-tab-group,wa-details,wa-copy-button,wa-tooltip,wa-progress-bar,wa-dialog');
  }
  function canWA() {
    try {
      return !!(window.customElements && window.CSS && CSS.supports &&
        CSS.supports('color', 'oklch(50% 0.1 100)') && CSS.supports('selector(:has(*))'));
    } catch (e) { return false; }
  }
  function loadWA() {
    if (window.NOAN_WA_LOADING || !needWA() || !canWA()) return;
    window.NOAN_WA_LOADING = true;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = ROOT + 'shared/vendor/webawesome/webawesome.css';
    document.head.appendChild(l);
    var s = document.createElement('script');
    s.src = ROOT + 'shared/vendor/webawesome/webawesome.js';
    document.head.appendChild(s);
  }
  /* 쪽 스크립트가 부품을 나중에 그려 넣었으면 이걸 한 번 더 부른다 */
  window.NOAN_LOAD_WA = loadWA;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadWA);
  else loadWA();

  /* Alpine.js(shared/vendor/alpine, MIT): 찾기·분류·찜·최근 본 카드처럼 「앱 같은」 움직임을 맡는다.
     받쳐 주는 브라우저(크롬 80 이상)에서만 <html class="alpine-ok"> 를 붙이고, x-data 가 있는 쪽에서만 불러온다.
     못 받치거나, 불러오지 못하거나, 5초 안에 켜지지 않으면 class 를 떼어 「자바스크립트 없이도 보이는 목록」으로 돌아간다. */
  function canAlpine() {
    try {
      return !!(window.Proxy && window.queueMicrotask && Array.prototype.flatMap &&
        new Function('var o={a:{b:1}};return o?.a?.b ?? 0')() === 1);
    } catch (e) { return false; }
  }
  var root = document.documentElement;
  if (canAlpine()) root.classList.add('alpine-ok');
  function alpineFail() { root.classList.remove('alpine-ok'); root.classList.add('alpine-off'); }
  function loadAlpine() {
    if (!root.classList.contains('alpine-ok')) return;
    if (!document.querySelector('[x-data]')) return;
    var on = false;
    document.addEventListener('alpine:initialized', function () { on = true; });
    var s = document.createElement('script');
    s.src = ROOT + 'shared/vendor/alpine/alpine.min.js';
    s.onerror = alpineFail;
    document.head.appendChild(s);
    setTimeout(function () { if (!on) alpineFail(); }, 5000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadAlpine);
  else loadAlpine();

  var ICON = {
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    iamodu: '<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    ai: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V5"/><circle cx="12" cy="4" r="1"/><circle cx="9.5" cy="13" r="1"/><circle cx="14.5" cy="13" r="1"/>',
    learn: '<path d="M12 6.3c-2-1.6-5-2.1-8-1.7v13c3-.4 6 .1 8 1.7 2-1.6 5-2.1 8-1.7v-13c-3-.4-6 .1-8 1.7z"/><path d="M12 6.3v13"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/><path d="M12 17h.01"/>'
  };
  var TABS = [
    { key: 'home',   label: '홈',       href: 'index.html',          ico: 'home',   at: [] },
    { key: 'iamodu', label: '아이모두', href: 'iamodu/index.html',   ico: 'iamodu', at: ['iamodu'] },
    { key: 'ai',     label: 'AI 알기',  href: 'ai/index.html',       ico: 'ai',     at: ['ai', 'terms', 'how-ai-answers'] },
    { key: 'learn',  label: '연수·자료', href: 'training/index.html', ico: 'learn',  at: ['training', 'library', 'showcase', 'contest', 'start'] },
    { key: 'help',   label: '도움',     href: 'start/index.html#stuck', ico: 'help', at: ['about'] }
  ];

  function currentKey() {
    var rel = location.href.replace(ROOT, '').replace(/[?#].*$/, '');
    var seg = rel.split('/')[0];
    for (var i = 0; i < TABS.length; i++) {
      if (TABS[i].at.indexOf(seg) !== -1) return TABS[i].key;
    }
    if (seg === 'studio' || seg === 'class') return '';
    return 'home';
  }

  function svg(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICON[name] + '</svg>';
  }

  function buildTabbar(key) {
    var nav = document.createElement('nav');
    nav.className = 'tabbar';
    nav.setAttribute('aria-label', '아래 메뉴');
    nav.innerHTML = TABS.map(function (t) {
      return '<a href="' + ROOT + t.href + '"' + (t.key === key ? ' aria-current="page"' : '') + '>' + svg(t.ico) + '<span>' + t.label + '</span></a>';
    }).join('');
    var idx = 0;
    for (var i = 0; i < TABS.length; i++) if (TABS[i].key === key) idx = i;
    var ind = document.createElement('span');
    ind.className = 'tabbar-ind';
    ind.setAttribute('aria-hidden', 'true');
    ind.style.setProperty('--i', key ? idx : -2);
    nav.appendChild(ind);
    document.body.appendChild(nav);
    document.body.classList.add('has-tabbar');
    /* 이전 페이지에서 눌렀던 칸에서 미끄러져 온다 */
    try {
      var from = sessionStorage.getItem('noan-tab');
      if (from !== null && !REDUCED && from !== String(idx)) {
        ind.style.setProperty('--i', from);
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          ind.style.transition = 'transform .35s cubic-bezier(.3,1.2,.4,1)';
          ind.style.setProperty('--i', key ? idx : -2);
        }); });
      }
      sessionStorage.setItem('noan-tab', String(key ? idx : -2));
    } catch (e) { /* 저장이 막혀 있어도 괜찮다 */ }
  }

  /* 위쪽 메뉴를 한 벌로 맞춘다. 아이모두 바로가기(CTA)는 그대로 둔다. */
  function unifyTopNav(key) {
    var navs = document.querySelectorAll('.g-nav, .p-nav');
    for (var i = 0; i < navs.length; i++) {
      var nav = navs[i];
      var cta = nav.querySelector('[class*="cta"]');
      var html = TABS.map(function (t) {
        var label = t.key === 'home' ? '업무별 안내서' : t.label;
        return '<a href="' + ROOT + t.href + '"' + (t.key === key ? ' class="is-here" aria-current="page"' : '') + '>' + label + '</a>';
      }).join('') + '<a href="' + ROOT + 'studio/index.html">수업 도구</a>';
      nav.innerHTML = html;
      if (cta) nav.appendChild(cta);
    }
  }

  function note(text) {
    var el = document.createElement('div');
    el.className = 'offline-note';
    el.setAttribute('role', 'status');
    el.textContent = text;
    document.body.appendChild(el);
    return el;
  }

  function offlineNotice() {
    var el = null;
    function update() {
      if (!navigator.onLine && !el) el = note('인터넷이 끊겨 있습니다. 저장된 화면으로 보여 드립니다.');
      if (navigator.onLine && el) { el.remove(); el = null; }
    }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }

  /* 「홈 화면에 추가」 + 오프라인: 루트 서비스 워커 (https 또는 localhost 에서만 동작) */
  function registerWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    navigator.serviceWorker.register(ROOT + 'sw.js', { scope: ROOT }).catch(function () { /* 조용히 넘어간다 */ });
  }

  /* 접근성: 이름표가 화면 글자를 포함하게, 옆으로 밀리는 표는 키보드로 닿게 */
  function a11y() {
    var brands = document.querySelectorAll('.g-brand, .p-brand');
    for (var i = 0; i < brands.length; i++) brands[i].setAttribute('aria-label', '노안중학교 AI교육 포털 홈');
    var tw = document.querySelectorAll('.p-table-wrap, .tw');
    for (var j = 0; j < tw.length; j++) if (!tw[j].hasAttribute('tabindex')) tw[j].setAttribute('tabindex', '0');
  }


  /* 가벼운 알림(토스트) — 움직임 설정과 상관없이 쓴다. 복사됐다는 것을 화면 아래에 잠깐 알린다 */
  var toastEl = null, toastTimer = 0;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    void toastEl.offsetWidth;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
  }
  window.NoanApp = { toast: toast, reduced: REDUCED };

  /* 새 하위 페이지의 끈끈이 목차: 붙으면 배경이 서서히 나타나고, 보고 있는 구역이 켜진다 */
  function secNav() {
    var nav = document.querySelector('.sec-nav');
    if (!nav || !('IntersectionObserver' in window)) return;
    var sent = document.createElement('div');
    sent.style.cssText = 'height:1px;margin-top:-1px;pointer-events:none';
    sent.setAttribute('aria-hidden', 'true');
    nav.parentNode.insertBefore(sent, nav);
    new IntersectionObserver(function (es) { nav.classList.toggle('is-stuck', !es[0].isIntersecting && es[0].boundingClientRect.top < 0); }).observe(sent);
    var links = nav.querySelectorAll('a[href^="#"]');
    var map = {};
    Array.prototype.forEach.call(links, function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var vis = {};
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vis[e.target.id] = e.isIntersecting; });
      var first = null;
      Object.keys(map).forEach(function (id) { map[id].classList.remove('is-on'); if (!first && vis[id]) first = id; });
      if (first) map[first].classList.add('is-on');
    }, { rootMargin: '-20% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) { var sec = document.getElementById(id); if (sec) so.observe(sec); });
  }

  function init() {
    if (/\/ops\//.test(location.pathname)) { a11y(); return; }
    a11y();
    var key = currentKey();
    unifyTopNav(key);
    buildTabbar(key);
    offlineNotice();
    secNav();
    registerWorker();
    window.addEventListener('load', function () { setTimeout(a11y, 600); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
