/* shared/site.js — 일반 페이지 공통 동작 (외부 요청 0건, tools/CONTRACT.md 준수) */
(function () {
  'use strict';

  function initNavActive() {
    var links = document.querySelectorAll('.nav-menu a');
    var path = location.pathname;
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      var seg = href.replace(/^(\.\.\/)+/, '').replace(/^\.?\//, '')
        .replace(/index\.html$/, '').replace(/\/$/, '');
      if (seg && path.indexOf('/' + seg + '/') !== -1) {
        links[i].classList.add('is-active');
      }
    }
  }

  function initNavToggle() {
    var btn = document.querySelector('.nav-toggle');
    var menu = document.querySelector('.nav-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function initOnlineDot() {
    var dot = document.querySelector('.online-dot');
    if (!dot) return;
    function update() { dot.classList.toggle('is-online', navigator.onLine); }
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
  }

  function initTilt() {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cards = document.querySelectorAll('.card.tilt');
    if (reduced) return;
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          card.style.setProperty('--ry', (px * 12).toFixed(2) + 'deg');
          card.style.setProperty('--rx', (-py * 12).toFixed(2) + 'deg');
        });
        card.addEventListener('mouseleave', function () {
          card.style.setProperty('--rx', '0deg');
          card.style.setProperty('--ry', '0deg');
        });
      })(cards[i]);
    }
  }

  function initReveal() {
    var cards = document.querySelectorAll('.card.tilt');
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < cards.length; i++) cards[i].classList.add('is-in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('is-in');
          io.unobserve(entries[i].target);
        }
      }
    }, { threshold: .2 });
    for (var i = 0; i < cards.length; i++) io.observe(cards[i]);
  }

  function init() {
    initNavActive();
    initNavToggle();
    initOnlineDot();
    initTilt();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
