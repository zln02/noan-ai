/* shared/motion.js — 가볍고 따뜻한 움직임 (바닐라 JS, 외부 요청 0건)
   · 카드·구역: 스크롤하면 떠오름(투명도+위치만)
   · 제목 밑줄 그려짐, 숫자 세어 올라감
   · 홈 로봇: 마우스·스크롤에 살짝 따라옴
   · 지시서 복사 성공: 작은 색종이와 [빈칸] 깜빡임
   · 쪽 이동: View Transitions API 가 되는 브라우저에서만 부드럽게
   「동작 줄이기」 설정이면 app.js 가 이 파일을 아예 읽지 않는다. 소리는 쓰지 않는다. */
(function () {
  'use strict';
  if (window.NoanMotion) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var M = window.NoanMotion = {
    reveal: function () {}, detail: function () {}, copied: function () {},
    transition: function (fn) { fn(); }
  };
  if (reduced) return;

  var CARD_SEL = '.g-quick-card, .g-support-card, .g-first-steps > li, .toc > .panel, .model, .term, .flow > li, .g-step, .g-result-card';
  var DRAW_SEL = '.g-section-heading h2, .g-more-title, .page-hero h1, .g-section h2, .g-first-heading h2';
  var io = null;
  var listRevealed = false;

  function onIntersect(entries) {
    var k = 0;
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      io.unobserve(el);
      if (el.classList.contains('m-reveal')) el.style.setProperty('--d', Math.min(k++, 6) * 60 + 'ms');
      el.classList.add('is-in');
      if (el.classList.contains('m-reveal')) setTimeout(function () { el.classList.add('is-done'); }, 1000);
    });
  }

  function watch(el, cls) {
    if (el.classList.contains(cls) || !io) return;
    el.classList.add(cls);
    io.observe(el);
  }

  function scan(root) {
    if (!io) return;
    Array.prototype.forEach.call(root.querySelectorAll(CARD_SEL), function (el) { watch(el, 'm-reveal'); });
    Array.prototype.forEach.call(root.querySelectorAll(DRAW_SEL), function (el) { watch(el, 'm-draw'); });
  }

  /* 홈 카드 목록: 처음 한 번만 떠오르게 한다. 검색·분류로 다시 그릴 땐 조용히 바꾼다 */
  M.reveal = function (box) {
    if (!box) return;
    if (listRevealed) return;
    if (!box.querySelector('.g-quick-card')) return;
    listRevealed = true;
    scan(box);
  };

  /* 안내서 상세: 밑줄·떠오름·숫자 세기 */
  M.detail = function (view) {
    scan(view);
    Array.prototype.forEach.call(view.querySelectorAll('.g-mins b'), countUp);
  };

  function countUp(b) {
    var m = /^(\d+)(.*)$/.exec(b.textContent.trim());
    if (!m || !io) return;
    var target = parseInt(m[1], 10), tail = m[2];
    b.style.display = 'inline-block';
    b.style.minWidth = b.offsetWidth + 'px';
    b.style.textAlign = 'center';
    b.style.fontVariantNumeric = 'tabular-nums';
    var done = false;
    var o = new IntersectionObserver(function (es) {
      if (done || !es[0].isIntersecting) return;
      done = true; o.disconnect();
      var t0 = performance.now(), dur = 900;
      b.textContent = '0' + tail;
      (function tick(t) {
        var p = Math.min(1, (t - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        b.textContent = Math.round(target * eased) + tail;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 1 });
    o.observe(b);
  }

  /* 복사 성공: 색종이 + 빈칸 깜빡임 */
  M.copied = function (btn, pre) {
    var colors = ['#FFE58A', '#F6B3C8', '#A9DCC0', '#B9D5F8', '#C9B6F8', '#F6CFA4'];
    for (var i = 0; i < 14; i++) {
      var c = document.createElement('span');
      var a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
      var d = 46 + Math.random() * 34;
      c.className = 'confetti';
      c.setAttribute('aria-hidden', 'true');
      c.style.background = colors[i % colors.length];
      c.style.setProperty('--dx', Math.cos(a) * d + 'px');
      c.style.setProperty('--dy', Math.sin(a) * d - 14 + 'px');
      c.style.setProperty('--r', (Math.random() * 360 - 180) + 'deg');
      btn.appendChild(c);
      (function (n) { setTimeout(function () { n.remove(); }, 900); })(c);
    }
    var marks = pre ? pre.querySelectorAll('mark.blank') : [];
    Array.prototype.forEach.call(marks, function (mk) {
      mk.classList.add('pulse');
      setTimeout(function () { mk.classList.remove('pulse'); }, 2200);
    });
  };

  /* 같은 쪽 안에서 목록 ↔ 상세 */
  M.transition = function (fn) {
    if (document.startViewTransition) document.startViewTransition(fn);
    else fn();
  };

  /* 홈 로봇 따라오기 */
  function hero() {
    var box = document.querySelector('.g-hero-inner');
    var vis = document.querySelector('.g-hero-visual');
    if (!box || !vis) return;
    var raf = 0, mx = 0, my = 0;
    function apply() {
      raf = 0;
      vis.style.setProperty('--mx', mx.toFixed(1) + 'px');
      vis.style.setProperty('--my', my.toFixed(1) + 'px');
    }
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      box.addEventListener('pointermove', function (e) {
        var r = box.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width - 0.5) * -16;
        my = ((e.clientY - r.top) / r.height - 0.5) * -10;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      box.addEventListener('pointerleave', function () { mx = 0; my = 0; if (!raf) raf = requestAnimationFrame(apply); });
    }
    var sraf = 0;
    window.addEventListener('scroll', function () {
      if (sraf) return;
      sraf = requestAnimationFrame(function () {
        sraf = 0;
        var y = Math.min(window.scrollY, 600);
        vis.style.setProperty('--sy', (y * 0.05).toFixed(1) + 'px');
      });
    }, { passive: true });
  }

  function start() {
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(onIntersect, { rootMargin: '0px 0px -5% 0px', threshold: 0.08 });
    }
    scan(document);
    hero();
    /* 만일을 위해: 3초 뒤에도 안 열린 것은 그냥 보이게 한다 */
    setTimeout(function () {
      Array.prototype.forEach.call(document.querySelectorAll('.m-reveal:not(.is-in)'), function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add('is-in');
      });
    }, 3000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
