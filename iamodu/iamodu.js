/* iamodu/iamodu.js — 「어떤 일에 어떤 도구」. data/tasks.json(안내서 카드)을 도구별 카드로 묶는다.
   fetch 가 막히면(file://) data/tasks.js 의 GUIDE_TASKS 를 쓴다. */
(function () {
  'use strict';
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var TONES = [
    ['', 'var(--pm-sky-ink)'], ['is-mint', 'var(--pm-mint-ink)'], ['is-lilac', 'var(--pm-lilac-ink)'],
    ['is-peach', 'var(--pm-peach-ink)'], ['is-rose', 'var(--pm-rose-ink)'], ['is-butter', 'var(--pm-butter-ink)']
  ];
  var ICO = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/></svg>';
  function draw(data) {
    var box = document.getElementById('im-table');
    if (!box) return;
    var tasks = data && (data.tasks || data);
    if (!tasks || !tasks.length) {
      box.innerHTML = '<div class="pm-empty"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg><b>자료를 불러오지 못했습니다</b><span>안내서 첫 화면에서 업무를 찾아 주세요.</span><a class="pm-btn-ghost" href="../index.html">안내서 첫 화면</a></div>';
      return;
    }
    var order = [], by = {};
    tasks.forEach(function (t) {
      var k = t.tool || '기타';
      if (!by[k]) { by[k] = { path: t.path, items: [] }; order.push(k); }
      by[k].items.push(t);
    });
    box.innerHTML = order.map(function (k, i) {
      var g = by[k], tone = TONES[i % TONES.length];
      var where = g.path && g.path.length
        ? '<ol class="pm-path" aria-label="여는 길">' + g.path.map(function (p) { return '<li><span>' + esc(p) + '</span></li>'; }).join('') + '</ol>'
        : '<span class="need">여는 길 확인 필요</span>';
      var links = g.items.map(function (t) {
        return '<li><a href="../index.html#' + esc(t.no) + '"><span class="pm-chip">' + esc(t.no) + '</span><span>' + esc(t.title) + '</span></a></li>';
      }).join('');
      return '<article class="im-tcard" style="--tone:' + tone[1] + '"><div class="im-thead"><span class="pm-ico ' + tone[0] + '">' + ICO + '</span><div><h3>' + esc(k) + '</h3><small>카드 ' + g.items.length + '개</small></div></div>' +
        where + '<ul class="im-tlinks">' + links + '</ul></article>';
    }).join('');
  }
  fetch('../data/tasks.json').then(function (r) { return r.json(); })
    .catch(function () { return window.GUIDE_TASKS; }).then(draw);
})();
