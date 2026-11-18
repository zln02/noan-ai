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
    { key: 'help',   label: '도움',     href: 'request/index.html',  ico: 'help',   at: ['request', 'about'] }
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
    document.body.appendChild(nav);
    document.body.classList.add('has-tabbar');
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

  function init() {
    if (/\/ops\//.test(location.pathname)) { a11y(); return; }   /* 운영 쪽은 껍데기 없이 보호 코드만 */
    a11y();
    var key = currentKey();
    unifyTopNav(key);
    buildTabbar(key);
    offlineNotice();
    registerWorker();
    window.addEventListener('load', function () { setTimeout(a11y, 600); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
