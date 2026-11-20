/* shared/zoom.js — 화면 그림 「크게 보기」 (가독성 손질 2026-11).
   안내서 카드의 실제 화면(.g-shot-wrap · .g-result-shot)과 도구 사전 화면(.dc-shot)에
   「크게 보기」 단추를 붙이고, 누르면 원래 크기로 펼쳐 손가락으로 밀어 볼 수 있게 한다.
   빨간 「누를 곳」 표시도 같이 커진다. 외부 요청 없음 · ES2017 · 모양은 shared/readability.css. */
(function () {
  'use strict';
  if (!document.querySelector || !window.MutationObserver) return;
  var HOSTS = '.g-shot-wrap, .g-result-shot, .dc-shot';
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6"/></svg>';
  var view = null, stage = null, frame = null, cap = null, fitBtn = null, closeBtn = null, lastFocus = null, natural = 0, fitted = false;

  function textOf(host, img) {
    var fc = host.querySelector('figcaption');
    if (fc && fc.textContent.trim()) return fc.textContent.trim();
    var sec = host.closest ? host.closest('.g-shot-section') : null;
    var c = sec ? sec.querySelector('.g-shot-caption') : null;
    if (c && c.textContent.trim() && sec.querySelectorAll('.g-shot-wrap').length === 1) return c.textContent.trim();
    return img.getAttribute('alt') || '화면';
  }

  function enhance() {
    var hosts = document.querySelectorAll(HOSTS);
    Array.prototype.forEach.call(hosts, function (host) {
      if (host.getAttribute('data-zm') || (host.closest && host.closest('.zm-view'))) return;
      var img = host.querySelector('img');
      if (!img) return;
      host.setAttribute('data-zm', '1');
      /* 그림 칸(.g-shot-wrap)은 이미 기준 상자다. figure 는 그림만 감싸 단추를 그림 위에 둔다. */
      var box = host;
      if (host.tagName === 'FIGURE') {
        box = document.createElement('span');
        box.style.display = 'block';
        img.parentNode.insertBefore(box, img);
        box.appendChild(img);
      }
      box.classList.add('zm-host');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'zm-btn';
      b.innerHTML = ICON + '<span>크게 보기</span>';
      b.setAttribute('aria-label', '크게 보기: ' + textOf(host, img));
      box.appendChild(b);
      b.addEventListener('click', function () { open(box, img, textOf(host, img), b); });
      img.addEventListener('click', function () { open(box, img, textOf(host, img), b); });
    });
  }

  function build() {
    view = document.createElement('div');
    view.className = 'zm-view';
    view.hidden = true;
    view.setAttribute('role', 'dialog');
    view.setAttribute('aria-modal', 'true');
    view.setAttribute('aria-labelledby', 'zm-cap');
    view.innerHTML = '<div class="zm-bar"><p class="zm-cap" id="zm-cap"></p>' +
      '<button type="button" class="zm-fit">화면에 맞추기</button>' +
      '<button type="button" class="zm-close">닫기 ✕</button></div>' +
      '<div class="zm-stage" tabindex="0" aria-label="그림 — 손가락이나 화살표 키로 밀어 보세요"><div class="zm-frame"></div></div>' +
      '<p class="zm-hint">손가락으로 밀어 보세요 · 빨간 표시가 누를 곳</p>';
    document.body.appendChild(view);
    stage = view.querySelector('.zm-stage');
    frame = view.querySelector('.zm-frame');
    cap = view.querySelector('.zm-cap');
    fitBtn = view.querySelector('.zm-fit');
    closeBtn = view.querySelector('.zm-close');
    closeBtn.addEventListener('click', close);
    fitBtn.addEventListener('click', function () { size(!fitted); });
    stage.addEventListener('click', function (e) { if (e.target === stage) close(); });
    view.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') {
        var f = [fitBtn, closeBtn, stage].filter(function (x) { return !x.hidden; });
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
    });
  }

  function size(fit) {
    fitted = fit;
    var room = stage.clientWidth - 24;
    var w = fit ? Math.min(natural, room) : Math.max(natural, room);
    frame.style.width = Math.round(w) + 'px';
    fitBtn.textContent = fit ? '원래 크기로' : '화면에 맞추기';
    fitBtn.hidden = natural <= room;
  }

  function open(box, img, text, opener) {
    if (!view) build();
    lastFocus = opener || document.activeElement;
    natural = img.naturalWidth || parseInt(img.getAttribute('width'), 10) || 1200;
    frame.className = 'zm-frame ' + (box.className || '').replace(/\bzm-host\b/, '');
    frame.innerHTML = '';
    Array.prototype.forEach.call(box.children, function (ch) {
      if (ch.classList && ch.classList.contains('zm-btn')) return;
      var c = ch.cloneNode(true);
      if (c.tagName === 'IMG') { c.removeAttribute('loading'); c.removeAttribute('width'); c.removeAttribute('height'); c.className = ''; }
      frame.appendChild(c);
    });
    frame.style.overflow = 'visible';
    cap.textContent = text;
    view.hidden = false;
    document.documentElement.classList.add('zm-open');
    size(false);
    /* 원래 크기로 펼쳤을 때 첫 「누를 곳」이 화면 가운데 오게 */
    var mk = frame.querySelector('.g-mark');
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
    if (mk && !fitted) {
      var left = parseFloat(mk.style.left) || 0, wid = parseFloat(mk.style.width) || 0;
      var top = parseFloat(mk.style.top) || 0, hei = parseFloat(mk.style.height) || 0;
      stage.scrollLeft = Math.max(0, frame.offsetWidth * (left + wid / 2) / 100 - stage.clientWidth / 2 + 12);
      stage.scrollTop = Math.max(0, frame.offsetHeight * (top + hei / 2) / 100 - stage.clientHeight / 2 + 12);
    }
    closeBtn.focus();
  }

  function close() {
    if (!view || view.hidden) return;
    view.hidden = true;
    frame.innerHTML = '';
    document.documentElement.classList.remove('zm-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  var t = 0;
  new MutationObserver(function () { clearTimeout(t); t = setTimeout(enhance, 60); })
    .observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', function () { if (view && !view.hidden) size(fitted); });
  enhance();
})();
