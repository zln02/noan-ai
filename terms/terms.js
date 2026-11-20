/* terms/terms.js — data/terms.json(16:9) 갤러리. 눌러야 재생, 자동재생 없음, 자막 항상 표시.
   file 이 .html 이면 같은 사이트의 오프라인 애니메이션을 sandbox iframe 으로, .mp4 면 video 로 연다.
   대표 그림(poster)이 있으면 썸네일로, 없으면 글자 면으로 보여 준다. */
(function () {
  'use strict';
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var BIG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  function mmss(n) { n = Math.round(Number(n) || 0); var s = n % 60; return Math.floor(n / 60) + ':' + (s < 10 ? '0' : '') + s; }
  function secText(n) { n = Math.round(Number(n) || 0); return n >= 60 ? Math.floor(n / 60) + '분 ' + (n % 60) + '초' : n + '초'; }

  function thumb(t, ready) {
    var art = t.poster
      ? '<img src="../' + esc(t.poster) + '" alt="" width="960" height="540" loading="lazy" decoding="async">'
      : '<span class="tcard-fallback"><b>' + esc(t.term) + '</b><span>' + esc(t.analogy || t.en || '') + '</span></span>';
    var dur = (ready && t.duration_sec) ? '<span class="tcard-dur">' + PLAY + mmss(t.duration_sec) + '</span>' : '';
    var soon = ready ? '' : '<span class="tcard-soon pm-chip is-butter">준비 중</span>';
    if (!ready) return '<div class="tcard-frame">' + art + soon + '</div>';
    return '<button type="button" class="tcard-frame" data-file="' + esc(t.file) + '" data-x="' + esc(t.term) + '" aria-label="' +
      esc(t.term) + ' 애니메이션 재생' + (t.duration_sec ? ' ' + mmss(t.duration_sec) + ' (' + secText(t.duration_sec) + ')' : '') + '">' + art + '<span class="tcard-play">' + PLAY + '</span>' + dur + '</button>';
  }

  var ICO = {
    bi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11h13a3 3 0 0 1 0 6H6a2 2 0 0 1-2-2z"/><path d="M17 13h3"/></svg>',
    real: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/></svg>',
    use: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
  };
  function row(kind, lab, text) {
    return '<div class="tc-row is-' + kind + '"><dt class="tc-lab">' + ICO[kind] + lab + '</dt><dd>' + esc(text) + '</dd></div>';
  }
  /* 한 줄 답: 「용어 =」 다음 줄만 크게. 그 꼴이 아니면 두 줄을 이어서 */
  function keyLine(t) {
    var s = t.summary || [];
    if (!s.length) return '';
    return /=\s*$/.test(s[0]) ? s.slice(1).join(' ') : s.join(' ');
  }
  /* 비유가 없는 편은 그림 첫 장면 「예 · …」를 같은 자리에 보여 준다 (자리가 늘 같게) */
  function example(t) {
    if (t.analogy_line || t.analogy) return row('bi', '비유', t.analogy_line || t.analogy);
    var ex = String(t.scene_label || '').replace(/^예\s*·\s*/, '');
    return ex ? row('bi', '예', ex) : '';
  }
  function card(t) {
    var ready = t.status === 'ready' && t.file;
    var caps = (t.captions || []).map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('');
    var gapLab = t.gap_label || '비유와 다른 점';
    return '<article class="tcard" id="t-' + esc(t.id) + '"><div class="tcard-media">' + thumb(t, ready) + '</div>' +
      '<div class="tcard-body"><h3 class="tcard-title">' + esc(t.term) + (t.en ? ' <span class="tcard-en">' + esc(t.en) + '</span>' : '') + '</h3>' +
      (keyLine(t) ? '<p class="tcard-sum">' + esc(keyLine(t)) + '</p>' : '') +
      '<dl class="tc-rows">' + example(t) + row('use', '활용', t.use || '') + '</dl>' +
      '<details class="tcard-caps"><summary>더 보기 · 진짜 이름 · ' + esc(gapLab) + '</summary>' +
        '<p class="tc-gap"><b>진짜</b> ' + esc(t.real || t.meaning) + '</p>' +
        (t.real_more ? '<p class="tc-gap"><b>조금 더</b> ' + esc(t.real_more) + '</p>' : '') +
        (t.gap ? '<p class="tc-gap"><b>' + esc(gapLab) + '</b> ' + esc(t.gap) + '</p>' : '') +
        (caps ? '<p class="tc-caps-h">그림 자막</p><ol>' + caps + '</ol>' : '') +
        '<p class="tc-chk">' + (t.checked ? '내용 확인 ' + esc(t.checked) : '사람이 아직 내용을 확인하지 않았어요 (확인 필요)') + '</p>' +
      '</details></div></article>';
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
    media.innerHTML = inner + '<button type="button" class="tcard-close" aria-label="' + esc(name) + ' 닫고 그림으로 돌아가기">' + CLOSE + '</button>' +
      '<button type="button" class="tcard-big" aria-pressed="false">' + BIG + '<span>크게 보기</span></button>';
    var fr = media.querySelector('iframe');
    var vd = media.querySelector('video');
    if (fr) {
      var ready = function () { media.className = 'tcard-media is-playing is-ready'; try { fr.focus(); } catch (e) { } };
      fr.addEventListener('load', ready);
      setTimeout(function () { if (media.className.indexOf('is-ready') < 0) media.className = 'tcard-media is-playing is-ready'; }, 4000);
    }
    if (vd) { vd.play(); }
    var big = media.querySelector('.tcard-big');
    function setBig(on) {
      media.classList.toggle('is-big', on); document.documentElement.classList.toggle('t-big-open', on);
      big.setAttribute('aria-pressed', on ? 'true' : 'false'); big.lastChild.textContent = on ? '작게 보기' : '크게 보기';
      if (on) { document.addEventListener('keydown', onKey); } else { document.removeEventListener('keydown', onKey); }
    }
    function onKey(e) { if (e.key === 'Escape') { setBig(false); big.focus(); } }
    big.addEventListener('click', function () { setBig(!media.classList.contains('is-big')); });
    media.querySelector('.tcard-close').addEventListener('click', function () {
      setBig(false);
      media.className = 'tcard-media';
      media.innerHTML = saved;
      var b = media.querySelector('button.tcard-frame');
      if (b) b.focus();
    });
  }

  function draw(data) {
    var box = document.getElementById('terms');
    if (!data || !data.items) { box.textContent = '자료를 불러오지 못했습니다.'; return; }
    var groups = (data.meta && data.meta.groups) || {};
    var order = Object.keys(groups);
    var html = order.length ? order.map(function (g, gi) {
      var list = data.items.filter(function (t) { return t.group === g; });
      if (!list.length) return '';
      return '<section class="t-group" aria-labelledby="tg-' + g + '"><h2 class="t-group-h" id="tg-' + g + '"><span>' + (gi + 1) + '</span>' + esc(groups[g]) + ' <small>' + list.length + '편</small></h2>' +
        '<div class="term-grid">' + list.map(card).join('') + '</div></section>';
    }).join('') : '<div class="term-grid">' + data.items.map(card).join('') + '</div>';
    box.innerHTML = html;
    box.addEventListener('click', function (e) { var b = e.target.closest('button[data-file]'); if (b) play(b); });
    var merged = (data.meta && data.meta.merged) || {}, m = /^#t-([a-z]+)$/.exec(location.hash);
    var id = m ? (merged[m[1]] || m[1]) : null, el = id && document.getElementById('t-' + id);
    if (el) { el.scrollIntoView(); }
  }
  fetch('../data/terms.json').then(function (r) { return r.json(); })
    .catch(function () { return window.TERMS_DATA; }).then(draw);
})();
