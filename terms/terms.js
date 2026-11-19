/* terms/terms.js — data/terms.json(16:9) 갤러리. 눌러야 재생, 자동재생 없음, 자막 항상 표시.
   file 이 .html 이면 같은 사이트의 오프라인 애니메이션을 iframe 으로, .mp4 면 video 로 연다. */
(function () {
  'use strict';
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var PLAY = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  function card(t) {
    var ready = t.status === 'ready' && t.file;
    var poster = '<span class="term-poster">' + (ready ? '<span class="term-play">' + PLAY + '</span>' : '') +
      '<b>' + esc(t.term) + '</b><span>' + esc(t.analogy) + '</span>' + (ready ? '<span class="sr-only"> — 재생</span>' : '') + '</span>';
    var frame = ready
      ? '<button type="button" class="term-frame" data-file="' + esc(t.file) + '" data-x="' + esc(t.term) + '">' + poster + '</button>'
      : '<div class="term-frame">' + poster + '</div>';
    var caps = (t.captions || []).map(esc).join(' · ');
    return '<article class="term">' + frame +
      '<div class="term-cap"><b>' + esc(t.term) + (ready ? '' : ' <span class="chip">준비 중</span>') + '</b>' +
      '<span>' + esc(t.meaning) + '</span>' +
      '<small>' + (t.duration_sec ? t.duration_sec + '초 · ' : '') + '내용 확인한 날: ' + (t.checked ? esc(t.checked) : '확인 필요') + '</small></div>' +
      (caps ? '<p class="term-captions">' + caps + '</p>' : '') + '</article>';
  }
  function play(btn) {
    var f = btn.getAttribute('data-file');
    if (/\.mp4$/i.test(f)) {
      btn.innerHTML = '<video src="../' + f + '" controls playsinline preload="none"></video>';
      btn.querySelector('video').play();
    } else {
      btn.innerHTML = '<iframe src="../' + f + '?autoplay=1" title="' + esc(btn.getAttribute('data-x') || '애니메이션') + '" sandbox="allow-scripts" allow=""></iframe>';
    }
  }
  function draw(data) {
    var box = document.getElementById('terms');
    if (!data || !data.items) { box.textContent = '자료를 불러오지 못했습니다.'; return; }
    box.innerHTML = data.items.map(card).join('');
    box.addEventListener('click', function (e) { var b = e.target.closest('button[data-file]'); if (b) play(b); });
  }
  fetch('../data/terms.json').then(function (r) { return r.json(); })
    .catch(function () { return window.TERMS_DATA; }).then(draw);
})();
