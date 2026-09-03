/* shared/deck.js — 프레젠테이션 덱 동작 (외부 요청 0건, tools/CONTRACT.md 준수)
 * 상태: slides, idx, startedAt, projector, blackout, notesOn
 */
(function (global) {
  'use strict';

  var slides = [];
  var idx = 0;
  var startedAt = null;
  var projector = false;
  var blackout = false;
  var notesOn = false;

  var hudNum = null;
  var hudTime = null;
  var tickTimer = null;
  var tocEl = null;

  /* ---------- 유틸 ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function formatTime(sec) { return pad(Math.floor(sec / 60)) + ':' + pad(sec % 60); }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- HUD ---------- */
  function setupHud() {
    var hud = document.querySelector('.hud');
    if (!hud) return;
    hudNum = hud.querySelector('.hud-num');
    if (!hudNum) { hudNum = document.createElement('span'); hudNum.className = 'hud-num'; hud.appendChild(hudNum); }
    hudTime = hud.querySelector('.hud-time');
    if (!hudTime) { hudTime = document.createElement('span'); hudTime.className = 'hud-time'; hud.appendChild(hudTime); }
    updateHudNum();
    updateHudTime();
  }
  function updateHudNum() {
    if (hudNum) hudNum.textContent = (idx + 1) + ' / ' + slides.length;
  }
  function updateHudTime() {
    if (!hudTime) return;
    var sec = startedAt ? Math.floor((performance.now() - startedAt) / 1000) : 0;
    hudTime.textContent = formatTime(sec);
    hudTime.classList.toggle('is-over', sec > 3600);
  }

  function markStart() {
    if (startedAt) return;
    startedAt = performance.now();
    tickTimer = setInterval(function () { updateHudTime(); updateNotes(); }, 1000);
  }

  /* ---------- 이동 ---------- */
  function animateCards(el) {
    var cards = el.querySelectorAll('.card3d');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.remove('is-in');
      cards[i].style.transitionDelay = (i * 60) + 'ms';
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        for (var i = 0; i < cards.length; i++) cards[i].classList.add('is-in');
      });
    });
  }

  function setCurrent(n, opts) {
    opts = opts || {};
    n = Math.max(0, Math.min(slides.length - 1, n));
    idx = n;
    var el = slides[idx];
    if (!el) return;
    if (opts.scroll) el.scrollIntoView({ behavior: opts.behavior || 'smooth', block: 'start' });
    try { history.replaceState(null, '', '#' + (el.id || ('s' + (idx + 1)))); } catch (e) {}
    for (var i = 0; i < slides.length; i++) slides[i].classList.toggle('is-active', i === idx);
    updateHudNum();
    updateHudTime();
    animateCards(el);
    initMapForSlide(el);
    updateNotes();
  }
  function go(n) { setCurrent(n, { scroll: true }); }
  function next() { markStart(); go(idx + 1); }
  function prev() { markStart(); go(idx - 1); }

  function setupScrollObserver() {
    if (!('IntersectionObserver' in global)) return;
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          var n = slides.indexOf(entry.target);
          if (n >= 0 && n !== idx) setCurrent(n, { scroll: false });
        }
      }
    }, { threshold: [0.5] });
    for (var i = 0; i < slides.length; i++) io.observe(slides[i]);
  }

  /* ---------- 노트 페이스 ---------- */
  function updateNotes() {
    var el = slides[idx];
    if (!el) return;
    var notes = el.querySelector('aside.notes');
    if (!notes || !notesOn) return;
    var pace = notes.querySelector('.note-pace');
    if (!pace) {
      pace = document.createElement('div');
      pace.className = 'note-pace';
      notes.insertBefore(pace, notes.firstChild);
    }
    var t = parseFloat(el.getAttribute('data-t'));
    if (!startedAt) {
      pace.textContent = isNaN(t) ? '아직 시작 전' : ('목표 ' + t + '분 · 아직 시작 전');
      return;
    }
    var elapsedSec = (performance.now() - startedAt) / 1000;
    var cur = formatTime(Math.floor(elapsedSec));
    if (isNaN(t)) { pace.textContent = '현재 ' + cur; return; }
    var diff = Math.round(elapsedSec / 60 - t);
    var label = diff === 0 ? '정시' : (diff > 0 ? '+' + diff + '분 밀림' : diff + '분 빠름');
    pace.textContent = '목표 ' + t + '분 · 현재 ' + cur + ' · ' + label;
  }

  /* ---------- 목차 ---------- */
  function buildToc() {
    tocEl = document.createElement('div');
    tocEl.className = 'toc';
    tocEl.setAttribute('role', 'dialog');
    tocEl.setAttribute('aria-label', '목차');
    var back = document.createElement('a');
    back.href = '../index.html';
    back.textContent = '← 사이트로 돌아가기';
    tocEl.appendChild(back);
    var list = document.createElement('div');
    list.className = 'toc-list';
    for (var i = 0; i < slides.length; i++) {
      (function (i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = slides[i].getAttribute('data-title') || ('슬라이드 ' + (i + 1));
        btn.addEventListener('click', function () { closeToc(); go(i); });
        list.appendChild(btn);
      })(i);
    }
    tocEl.appendChild(list);
    document.body.appendChild(tocEl);
  }
  function openToc() {
    if (!tocEl) buildToc();
    tocEl.classList.add('is-open');
    var first = tocEl.querySelector('a, button');
    if (first) first.focus();
  }
  function closeToc() { if (tocEl) tocEl.classList.remove('is-open'); }
  function toggleToc() {
    if (tocEl && tocEl.classList.contains('is-open')) closeToc(); else openToc();
  }

  /* ---------- 블랙아웃 / 노트 / 프로젝터 / 전체화면 ---------- */
  function toggleBlackout() {
    var el = document.querySelector('.blackout');
    if (!el) return;
    blackout = !blackout;
    el.classList.toggle('is-on', blackout);
  }
  function toggleNotes() {
    notesOn = !notesOn;
    document.body.classList.toggle('notes-on', notesOn);
    updateNotes();
  }
  function toggleProjector() {
    projector = !projector;
    if (projector) document.documentElement.setAttribute('data-projector', '');
    else document.documentElement.removeAttribute('data-projector');
    try { localStorage.setItem('noan-projector', projector ? '1' : '0'); } catch (e) {}
  }
  function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch (e) {}
  }

  /* ---------- 지도 줌 ---------- */
  function getViewBox(svg) {
    var vb = svg.viewBox && svg.viewBox.baseVal;
    if (vb && vb.width) return { w: vb.width, h: vb.height };
    var a = (svg.getAttribute('viewBox') || '0 0 1200 760').split(/\s+/);
    return { w: +a[2] || 1200, h: +a[3] || 760 };
  }
  function centerFromCache(nodeList) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, any = false;
    for (var i = 0; i < nodeList.length; i++) {
      var c = nodeList[i].__bbox;
      if (!c) continue;
      any = true;
      minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
      minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y);
    }
    return any ? { x: (minX + maxX) / 2, y: (minY + maxY) / 2 } : null;
  }
  function initMapForSlide(el) {
    if (!el.classList || !el.classList.contains('slide-map')) return;
    var svg = el.querySelector('svg.aimap');
    if (!svg) return;
    if (!svg.getAttribute('data-zoom')) svg.setAttribute('data-zoom', '0');
    bindMapEvents(svg);
    if (svg.__bboxReady) return;
    try {
      var nodes = svg.querySelectorAll('.node');
      for (var i = 0; i < nodes.length; i++) {
        try {
          var b = nodes[i].getBBox();
          nodes[i].__bbox = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        } catch (e) {}
      }
      svg.__jneCenter = centerFromCache(svg.querySelectorAll('.node[data-jne="1"]'));
      svg.__bboxReady = true;
    } catch (e) {}
  }
  function bindMapEvents(svg) {
    if (svg.getAttribute('data-bound')) return;
    svg.setAttribute('data-bound', '1');
    var nodes = svg.querySelectorAll('.node');
    for (var i = 0; i < nodes.length; i++) {
      (function (node) {
        node.addEventListener('click', function () { setZoom(svg, 2, node); });
        node.addEventListener('mouseenter', function () { showNodeInfo(svg, node); });
        node.addEventListener('focus', function () { showNodeInfo(svg, node); });
        node.addEventListener('mouseleave', function () { restorePanel(svg); });
        node.addEventListener('blur', function () { restorePanel(svg); });
      })(nodes[i]);
    }
  }
  function setZoom(svg, level, focusNode) {
    var zoomer = svg.querySelector('.zoomer');
    var vb = getViewBox(svg);
    var prevFocus = svg.querySelector('.node.is-focus');
    if (prevFocus) prevFocus.classList.remove('is-focus');

    if (level === 0) {
      if (zoomer) zoomer.setAttribute('transform', 'translate(0,0) scale(1)');
    } else if (level === 1) {
      var c = svg.__jneCenter;
      if (c && zoomer) {
        var s = 1.6, tx = vb.w / 2 - s * c.x, ty = vb.h / 2 - s * c.y;
        zoomer.setAttribute('transform', 'translate(' + tx + ',' + ty + ') scale(' + s + ')');
      }
    } else if (level === 2) {
      var node = focusNode || svg.querySelector('.node[data-jne="1"]');
      if (node) {
        var c2 = node.__bbox;
        if (!c2) {
          try {
            var b = node.getBBox();
            c2 = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
            node.__bbox = c2;
          } catch (e) {}
        }
        if (c2 && zoomer) {
          var s2 = 3.2, tx2 = vb.w / 2 - s2 * c2.x, ty2 = vb.h / 2 - s2 * c2.y;
          zoomer.setAttribute('transform', 'translate(' + tx2 + ',' + ty2 + ') scale(' + s2 + ')');
        }
        node.classList.add('is-focus');
      }
    }
    svg.setAttribute('data-zoom', String(level));
    updateMapPanel(svg, level, focusNode);
  }
  function updateMapPanel(svg, level, focusNode) {
    var slideEl = svg.closest ? svg.closest('.slide') : null;
    var panel = slideEl && slideEl.querySelector('.map-panel');
    if (!panel) return;
    if (level === 0) {
      panel.innerHTML = '<p>노드를 클릭하거나 Z를 눌러 확대해 보세요.</p>';
    } else if (level === 1) {
      var jne = svg.querySelectorAll('.node[data-jne="1"]');
      var names = [];
      for (var i = 0; i < jne.length; i++) names.push(escapeHtml(jne[i].getAttribute('data-name') || ''));
      panel.innerHTML = '<h3>전남교육청이 이미 드린 것</h3><ul><li>' + names.join('</li><li>') + '</li></ul>';
    } else if (level === 2) {
      var node = focusNode || svg.querySelector('.node.is-focus');
      if (node) {
        panel.innerHTML = '<h3>' + escapeHtml(node.getAttribute('data-name') || '') + '</h3>' +
          '<p>' + escapeHtml(node.getAttribute('data-desc') || '') + '</p>' +
          '<p>' + escapeHtml(node.getAttribute('data-use') || '') + '</p>';
      }
    }
  }
  function showNodeInfo(svg, node) {
    var slideEl = svg.closest ? svg.closest('.slide') : null;
    var panel = slideEl && slideEl.querySelector('.map-panel');
    if (!panel) return;
    panel.innerHTML = '<h3>' + escapeHtml(node.getAttribute('data-name') || '') + '</h3>' +
      '<p>' + escapeHtml(node.getAttribute('data-desc') || '') + '</p>';
  }
  function restorePanel(svg) {
    updateMapPanel(svg, +svg.getAttribute('data-zoom') || 0, svg.querySelector('.node.is-focus'));
  }
  function mapZoomKeyPress() {
    var el = slides[idx];
    if (!el || !el.classList.contains('slide-map')) return;
    var svg = el.querySelector('svg.aimap');
    if (!svg) return;
    setZoom(svg, ((+svg.getAttribute('data-zoom') || 0) + 1) % 3);
  }

  /* ---------- 키보드 ---------- */
  function handleKey(e) {
    var t = e.target;
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (typing && e.key !== 'Escape') return;

    var key = e.key, code = e.code;

    if (key === 'Escape') {
      if (t && t.blur) t.blur();
      toggleToc();
      return;
    }

    var node = t && t.closest ? t.closest('.node') : null;
    if (node && (key === 'Enter' || key === ' ')) {
      e.preventDefault();
      var svg = node.closest('svg.aimap');
      if (svg) setZoom(svg, 2, node);
      return;
    }

    /* 포커스가 조작 요소에 있으면 Enter/Space 는 그 요소에 양보한다.
       (목차 버튼, 타이머, 링크가 전역 "다음 슬라이드"에 먹히는 것을 막는다) */
    if (t && t.closest) {
      var press = t.closest('button, [role="button"], summary, .timer');
      if (press && (key === 'Enter' || key === ' ' || key === 'Spacebar')) return;
      var link = t.closest('a[href]');
      if (link && key === 'Enter') return;
    }

    if (key === 'ArrowRight' || key === ' ' || key === 'Spacebar' || key === 'Enter' || key === 'PageDown') {
      e.preventDefault(); next();
    } else if (key === 'ArrowLeft' || key === 'Backspace' || key === 'PageUp') {
      e.preventDefault(); prev();
    } else if (key === 'F5' || code === 'F5') {
      e.preventDefault(); toggleFullscreen();
    } else if (key === 'f' || key === 'F' || code === 'KeyF') {
      toggleFullscreen();
    } else if (key === '.' || key === 'b' || key === 'B' || code === 'KeyB') {
      toggleBlackout();
    } else if (key === 'n' || key === 'N' || code === 'KeyN') {
      toggleNotes();
    } else if (key === 'z' || key === 'Z' || code === 'KeyZ') {
      mapZoomKeyPress();
    } else if (key === 'p' || key === 'P' || code === 'KeyP') {
      toggleProjector();
    }
  }

  /* ---------- 터치 ---------- */
  var touchX = 0, touchY = 0;
  function onTouchStart(e) {
    var tt = e.changedTouches[0];
    touchX = tt.clientX; touchY = tt.clientY;
  }
  function onTouchEnd(e) {
    var tt = e.changedTouches[0];
    var dx = tt.clientX - touchX, dy = tt.clientY - touchY;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 40) { if (dx < 0) next(); else prev(); }
  }

  /* ---------- 온라인 표시 ---------- */
  function initOnlineDot() {
    var dot = document.querySelector('.online-dot');
    if (!dot) return;
    function update() { dot.classList.toggle('is-online', navigator.onLine); }
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
  }

  /* ---------- 시연 영상 ---------- */
  function initDemo() {
    var demos = document.querySelectorAll('.demo[data-src]');
    for (var i = 0; i < demos.length; i++) {
      (function (el) {
        var src = el.getAttribute('data-src');
        if (!src) return;
        var video = document.createElement('video');
        video.autoplay = true; video.muted = true; video.loop = true;
        video.playsInline = true; video.preload = 'metadata'; video.src = src;
        video.setAttribute('aria-label', el.getAttribute('data-label') || '시연 영상');
        el.innerHTML = '';
        el.appendChild(video);
      })(demos[i]);
    }
  }

  /* ---------- 폼 ---------- */
  function initPoll() {
    var polls = document.querySelectorAll('.poll[data-form]');
    for (var i = 0; i < polls.length; i++) {
      (function (el) {
        var src = el.getAttribute('data-form');
        if (!src) return;
        el.innerHTML = '';
        var iframe = document.createElement('iframe');
        iframe.src = src; iframe.title = '설문 폼'; iframe.loading = 'lazy';
        var btn = document.createElement('a');
        btn.href = src; btn.target = '_blank'; btn.rel = 'noopener'; btn.className = 'btn';
        btn.textContent = '폼 링크 열기';
        el.appendChild(iframe);
        el.appendChild(btn);
      })(polls[i]);
    }
  }

  /* ---------- 타이머 ---------- */
  function initTimers() {
    var timers = document.querySelectorAll('.timer[data-min]');
    for (var i = 0; i < timers.length; i++) {
      (function (el) {
        var total = (+el.getAttribute('data-min') || 0) * 60;
        var remaining = total, running = false, done = false, iv = null;
        function render() { el.textContent = formatTime(remaining); }
        render();
        el.addEventListener('click', function () {
          if (done) { done = false; remaining = total; el.classList.remove('is-done'); render(); return; }
          if (running) { running = false; clearInterval(iv); return; }
          running = true;
          iv = setInterval(function () {
            remaining--;
            if (remaining <= 0) {
              remaining = 0; running = false; done = true;
              clearInterval(iv); el.classList.add('is-done');
            }
            render();
          }, 1000);
        });
      })(timers[i]);
    }
  }

  /* ---------- 체크리스트 ---------- */
  function initChecklist() {
    document.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches && t.matches('.checklist input[type="checkbox"]')) {
        var li = t.closest('li');
        if (li) li.classList.toggle('is-checked', t.checked);
      }
    });
  }

  /* ---------- 초기화 ---------- */
  function init() {
    var list = document.querySelectorAll('.deck > section.slide');
    slides = Array.prototype.slice.call(list);

    setupHud();
    initOnlineDot();
    initDemo();
    initPoll();
    initTimers();
    initChecklist();

    try { if (global.NoanIcons && global.NoanIcons.mount) global.NoanIcons.mount(); } catch (e) {}

    try {
      if (localStorage.getItem('noan-projector') === '1') {
        projector = true;
        document.documentElement.setAttribute('data-projector', '');
      }
    } catch (e) {}

    var hashIdx = -1;
    if (location.hash) {
      var hid = location.hash.slice(1);
      for (var i = 0; i < slides.length; i++) { if (slides[i].id === hid) { hashIdx = i; break; } }
    }
    /* 'auto' 는 CSS 의 scroll-behavior:smooth 를 따라가서 첫 페인트 도중 취소되는 일이 있다.
       첫 진입만 즉시 이동시킨다. 좌우 이동은 setCurrent 가 'smooth' 를 직접 넘기므로 그대로다. */
    if (hashIdx >= 0) slides[hashIdx].scrollIntoView({ behavior: 'instant', block: 'start' });
    setCurrent(hashIdx >= 0 ? hashIdx : 0, { scroll: false });

    setupScrollObserver();
    document.addEventListener('keydown', handleKey);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
