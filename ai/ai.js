/* ai/ai.js — data/ai-models.json 을 비교 카드로 그린다 (막히면 AI_MODELS_DATA) */
(function () {
  'use strict';
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var NEED = '<span class="need">확인 필요</span>';
  /* "잘하는 일" 글을 태그로: 첫 문장 끝의 (괄호 안내)는 따로, 나머지 문장은 작은 주의 글로 */
  function goodFor(text) {
    if (!text) return '<p class="ai-missing">' + NEED + ' 아직 확인하지 못했습니다.</p>';
    var s = String(text), rest = '', i = s.indexOf('. ');
    if (i > -1) { rest = s.slice(i + 2); s = s.slice(0, i); }
    var note = '', m = s.match(/\s*\(([^)]*)\)\s*$/);
    if (m) { note = m[1]; s = s.slice(0, m.index); }
    var tags = s.split(/\s*[·,]\s*/).filter(function (x) { return x; });
    return '<ul class="ai-tags">' + tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      (note ? '<p class="ai-note">(' + esc(note) + ')</p>' : '') + (rest ? '<p class="ai-note">' + esc(rest) + '</p>' : '');
  }
  function inside(v) {
    if (!v) return '<p class="ai-in"><span class="pm-chip is-butter">확인 필요</span></p>';
    var yes = /^예/.test(v), parts = String(v).split(/\s*—\s*/);
    var chip = yes ? '<span class="pm-chip is-mint">아이모두 안에 있음</span>' : '<span class="pm-chip">' + esc(parts[0]) + '</span>';
    var detail = parts.length > 1 ? parts.slice(1).join(' — ') : '';
    return '<p class="ai-in">' + chip + (detail ? '<span>' + esc(detail) + '</span>' : '') + '</p>';
  }
  function card(m) {
    var kr = m.kind === '국내', empty = !m.summary && !m.good_for && !m.in_aimodu && !m.url;
    var kindChip = '<span class="pm-chip ' + (kr ? 'is-mint' : 'is-lilac') + '">' + esc(m.kind || '구분 확인 필요') + '</span>';
    var checked = m.checked
      ? '<span class="pm-chip is-mint"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>확인한 날 ' + esc(m.checked) + '</span>'
      : '<span class="pm-chip is-butter">확인한 날 · 확인 필요</span>';
    var link = m.url
      ? '<a class="pm-btn-ghost" href="' + esc(m.url) + '" target="_blank" rel="noopener" aria-label="' + esc(m.name) + ' 공식 쪽 보기 (새 창)">공식 쪽 보기 <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg></a>'
      : '<span class="ai-note">공식 쪽 주소 ' + NEED + '</span>';
    return '<article class="ai-card ' + (empty ? 'is-todo' : (kr ? 'is-kr' : 'is-global')) + '"><div class="ai-top">' + kindChip + '</div>' +
      '<h2>' + esc(m.name) + '</h2>' + (m.maker ? '<p class="ai-maker">' + esc(m.maker) + '</p>' : '') +
      (m.summary ? '<p class="ai-sum">' + esc(m.summary) + '</p>' : '<p class="ai-missing">' + NEED + ' 소개 한 줄을 아직 확인하지 못했습니다.</p>') +
      '<div class="ai-sec"><h3>잘하는 일</h3>' + goodFor(m.good_for) + '</div>' +
      '<div class="ai-sec"><h3>아이모두 안에</h3>' + inside(m.in_aimodu) + '</div>' +
      '<div class="ai-foot">' + checked + link + '</div></article>';
  }
  function draw(data) {
    var box = document.getElementById('models');
    if (!data || !data.items || !data.items.length) {
      box.innerHTML = '<div class="pm-empty"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg><b>자료를 불러오지 못했습니다</b><span>잠시 뒤 다시 열어 주세요.</span></div>';
      return;
    }
    box.innerHTML = '<div class="ai-grid">' + data.items.map(card).join('') + '</div>';
  }
  fetch('../data/ai-models.json').then(function (r) { return r.json(); })
    .catch(function () { return window.AI_MODELS_DATA; }).then(draw);
})();
