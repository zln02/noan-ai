/* terms/terms.js — data/terms.json(16:9) 갤러리. 눌러야 재생, 자동재생 없음, 자막 항상 표시.
   file 이 .html 이면 같은 사이트의 오프라인 애니메이션을 sandbox iframe 으로, .mp4 면 video 로 연다.
   대표 그림(poster)이 있으면 썸네일로, 없으면 글자 면으로 보여 준다. */
(function () {
  'use strict';
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  function mmss(n) { n = Math.round(Number(n) || 0); var s = n % 60; return Math.floor(n / 60) + ':' + (s < 10 ? '0' : '') + s; }
  function secText(n) { n = Math.round(Number(n) || 0); return n >= 60 ? Math.floor(n / 60) + '분 ' + (n % 60) + '초' : n + '초'; }

  function thumb(t, ready) {
    var art = t.poster
      ? '<img src="../' + esc(t.poster) + '" alt="" width="960" height="540" loading="lazy" decoding="async">'
      : '<span class="tcard-fallback"><b>' + esc(t.term) + '</b><span>' + esc(t.analogy) + '</span></span>';
    var dur = (ready && t.duration_sec) ? '<span class="tcard-dur">' + PLAY + mmss(t.duration_sec) + '</span>' : '';
    var soon = ready ? '' : '<span class="tcard-soon pm-chip is-butter">준비 중</span>';
    if (!ready) return '<div class="tcard-frame">' + art + soon + '</div>';
    return '<button type="button" class="tcard-frame" data-file="' + esc(t.file) + '" data-x="' + esc(t.term) + '" aria-label="' +
      esc(t.term) + ' 애니메이션 재생' + (t.duration_sec ? ' ' + mmss(t.duration_sec) + ' (' + secText(t.duration_sec) + ')' : '') + '">' + art + '<span class="tcard-play">' + PLAY + '</span>' + dur + '</button>';
  }

  function card(t) {
    var ready = t.status === 'ready' && t.file;
    var caps = (t.captions || []).map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('');
    var chk = t.checked
      ? '<span class="pm-chip is-mint" title="사람이 내용을 확인한 날">내용 확인 ' + esc(t.checked) + '</span>'
      : '<span class="pm-chip is-butter" title="아직 사람이 내용을 확인하지 않았어요">내용 확인 필요</span>';
    return '<article class="tcard"><div class="tcard-media">' + thumb(t, ready) + '</div>' +
      '<div class="tcard-body"><h3 class="tcard-title">' + esc(t.term) + '</h3>' +
      '<p class="tcard-analogy">' + esc(t.analogy) + '</p>' +
      '<p class="tcard-meaning">' + esc(t.meaning) + '</p>' +
      '<div class="tcard-meta">' + chk + '</div>' +
      (caps ? '<details class="tcard-caps"><summary>자막 글로 읽기</summary><ol>' + caps + '</ol></details>' : '') +
      '</div></article>';
  }

  function play(btn) {
    var media = btn.parentNode;
    var f = btn.getAttribute('data-file');
    var saved = media.innerHTML;
    var name = btn.getAttribute('data-x') || '애니메이션';
    var inner;
    if (/\.mp4$/i.test(f)) {
      inner = '<video src="../' + esc(f) + '" controls playsinline preload="none"></video>';
    } else {
      inner = '<div class="tcard-load" role="status"><span class="tcard-spin" aria-hidden="true"></span><span>그림 불러오는 중…</span></div>' +
        '<iframe src="../' + esc(f) + '?autoplay=1" title="' + esc(name) + ' 애니메이션" sandbox="allow-scripts" allow=""></iframe>';
    }
    media.className = 'tcard-media is-playing';
    media.innerHTML = inner + '<button type="button" class="tcard-close" aria-label="' + esc(name) + ' 닫고 그림으로 돌아가기">' + CLOSE + '</button>';
    var fr = media.querySelector('iframe');
    var vd = media.querySelector('video');
    if (fr) {
      var ready = function () { media.className = 'tcard-media is-playing is-ready'; try { fr.focus(); } catch (e) { } };
      fr.addEventListener('load', ready);
      setTimeout(function () { if (media.className.indexOf('is-ready') < 0) media.className = 'tcard-media is-playing is-ready'; }, 4000);
    }
    if (vd) { vd.play(); }
    media.querySelector('.tcard-close').addEventListener('click', function () {
      media.className = 'tcard-media';
      media.innerHTML = saved;
      var b = media.querySelector('button.tcard-frame');
      if (b) b.focus();
    });
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
