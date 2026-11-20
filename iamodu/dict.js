/* iamodu/dict.js — 5. 아이모두 도구 사전.
   원본은 data/iamodu-tools.json (짝 파일 data/iamodu-tools.js 의 IAMODU_TOOLS 를 먼저 쓰고, 없으면 fetch).
   찾기(이름·설명·쓰는 법 글자) + 목적 고르기(하나만) + 묶음 제목(meta.groups). 화면 그림은 줄을 펼쳐야 받는다(loading="lazy" + 닫힌 details). ES2017. */
(function () {
  'use strict';
  var list = document.getElementById('dc-list');
  if (!list) return;
  var qBox = document.getElementById('dc-q');
  var fBox = document.getElementById('dc-filters');
  var countBox = document.getElementById('dc-count');
  var DATA = null, purpose = '', query = '';
  var TONE = { '수업 만들기': '', '평가': 'is-lilac', '자료 찾기': 'is-peach', '소통': 'is-mint', '업무': 'is-butter' };

  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function lis(arr) { return (arr || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(''); }
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ''); }

  function card(t) {
    var depth = (DATA.meta.depth || {})[t.depth] || '';
    var path = t.path && t.path.length
      ? '<ol class="pm-path" aria-label="여는 길">' + t.path.map(function (p) { return '<li><span>' + esc(p) + '</span></li>'; }).join('') + '</ol>'
      : '<span class="need">여는 길 확인 필요</span>';
    var warn = [];
    if (t.paid) warn.push('<li class="dc-paid"><b>유료·한도</b> ' + esc(t.paid) + '</li>');
    if (t.student_data) warn.push('<li class="dc-student"><b>학생 정보</b> ' + esc(t.student_data) + '</li>');
    var shots = (t.shots || []).map(function (s) {
      return '<figure class="dc-shot"><img src="../' + esc(s.src) + '" alt="' + esc(t.name + ' 실제 화면: ' + s.cap) + '" width="' + (s.w || 1200) + '" height="' + (s.h || 606) + '" loading="lazy" decoding="async"><figcaption>' + esc(s.cap) + '</figcaption></figure>';
    }).join('');
    return '<li class="dc-item"><details class="dc-card">' +
      '<summary><span class="dc-no" aria-hidden="true">' + (t.no < 10 ? '0' : '') + t.no + '</span>' +
      '<span class="dc-sum"><b class="dc-name">' + esc(t.name) + '</b><span class="dc-one">' + esc(t.one) + '</span>' +
      '<span class="dc-tags">' + t.purpose.map(function (p) { return '<span class="pm-chip ' + (TONE[p] || '') + '">' + esc(p) + '</span>'; }).join('') +
      '<span class="dc-group sr-only">' + esc(t.group) + '</span></span></span>' +
      '<svg class="dc-caret" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6"/></svg></summary>' +
      '<div class="dc-body">' +
        '<div class="dc-row"><h4 class="dc-h">여는 길</h4>' + path + '<p class="dc-open">' + esc(t.open) + (depth ? ' <span class="dc-depth">' + esc(t.depth + ' ' + depth) + '</span>' : '') + '</p></div>' +
        '<div class="dc-row"><h4 class="dc-h">쓰는 법</h4><ol class="dc-steps">' + lis(t.steps) + '</ol></div>' +
        '<div class="dc-row"><h4 class="dc-h">선생님이 만들 수 있는 것</h4><ul class="dc-ul">' + lis(t.makes) + '</ul></div>' +
        '<div class="dc-row dc-warn"><h4 class="dc-h">주의</h4><ul class="dc-ul">' + warn.join('') + lis(t.cautions) + '</ul></div>' +
        (shots ? '<div class="dc-row"><h4 class="dc-h">실제 화면 <small>(개인 정보는 가림)</small></h4><div class="dc-shots">' + shots + '</div></div>' : '') +
      '</div></details></li>';
  }

  function match(t) {
    if (purpose && t.purpose.indexOf(purpose) === -1) return false;
    if (!query) return true;
    var hay = norm([t.name, t.one, t.group, t.open, (t.path || []).join(' '), (t.makes || []).join(' '), (t.steps || []).join(' '), t.purpose.join(' ')].join(' '));
    return query.split(/\s+/).every(function (w) { return !w || hay.indexOf(norm(w)) !== -1; });
  }

  /* 묶음(수업도구 · LMS · 교과서 출판사)별로 제목을 달아 46줄을 세 덩어리로 나눈다. 묶음 안은 번호 순서. */
  function grouped(hits) {
    var groups = (DATA.meta.groups || []).slice();
    hits.forEach(function (t) {
      if (!groups.some(function (g) { return g.name === t.group; })) groups.push({ name: t.group });
    });
    return groups.map(function (g, gi) {
      var inGroup = hits.filter(function (t) { return t.group === g.name; });
      if (!inGroup.length) return '';
      return '<li class="dc-gh" id="dc-g' + gi + '"><h3>' + esc(g.label || g.name) + '</h3><b>' + inGroup.length + '개</b>' +
        (g.note ? '<p>' + esc(g.note) + '</p>' : '') + '</li>' + inGroup.map(card).join('');
    }).join('');
  }

  function draw() {
    var hits = DATA.tools.filter(match);
    list.innerHTML = hits.length ? grouped(hits)
      : '<li class="pm-empty dc-none"><b>맞는 도구가 없어요</b><span>다른 낱말로 찾거나 목적을 「전체」로 바꿔 보세요.</span></li>';
    countBox.textContent = (purpose ? '「' + purpose + '」 ' : '') + (query ? '「' + query + '」 ' : '') + '도구 ' + hits.length + '개' + (hits.length === DATA.tools.length ? ' (전체)' : ' / 전체 ' + DATA.tools.length + '개');
  }

  function setup(data) {
    if (!data || !data.tools || !data.tools.length) {
      list.innerHTML = '<li class="pm-empty"><b>도구 사전을 불러오지 못했습니다</b><span>잠시 뒤 다시 열어 주세요.</span></li>';
      return;
    }
    DATA = data;
    var ps = [''].concat(data.meta.purposes || []);
    fBox.innerHTML = ps.map(function (p) {
      var n = p ? data.tools.filter(function (t) { return t.purpose.indexOf(p) !== -1; }).length : data.tools.length;
      return '<button type="button" class="dc-f" aria-pressed="' + (p === '' ? 'true' : 'false') + '" data-p="' + esc(p) + '">' + esc(p || '전체') + ' <small>' + n + '</small></button>';
    }).join('');
    fBox.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.dc-f') : null;
      if (!b) return;
      purpose = b.getAttribute('data-p');
      Array.prototype.forEach.call(fBox.querySelectorAll('.dc-f'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      draw();
    });
    var timer = 0;
    qBox.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { query = qBox.value.trim(); draw(); }, 120);
    });
    var common = document.getElementById('dc-common');
    if (common) common.innerHTML = lis(data.meta.common);
    draw();
  }

  if (window.IAMODU_TOOLS) setup(window.IAMODU_TOOLS);
  else fetch('../data/iamodu-tools.json').then(function (r) { return r.json(); }).then(setup, function () { setup(null); });
})();
