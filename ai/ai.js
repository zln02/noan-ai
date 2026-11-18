/* ai/ai.js — data/ai-models.json 을 카드로 그린다 (막히면 AI_MODELS_DATA) */
(function () {
  'use strict';
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function row(k, v) { return '<dt>' + k + '</dt><dd>' + (v ? esc(v) : '<span class="checked">확인 전</span>') + '</dd>'; }
  function draw(data) {
    var box = document.getElementById('models');
    if (!data || !data.items) { box.textContent = '자료를 불러오지 못했습니다.'; return; }
    box.innerHTML = data.items.map(function (m) {
      return '<article class="model"><h2>' + esc(m.name) + '</h2>' +
        '<span class="chip">' + esc(m.kind) + (m.maker ? ' · ' + esc(m.maker) : '') + '</span>' +
        '<dl>' + row('한 줄', m.summary) + row('잘하는 일', m.good_for) + row('아이모두 안에', m.in_aimodu) + '</dl>' +
        '<p class="checked">확인한 날: ' + (m.checked ? esc(m.checked) : '확인 전') + '</p></article>';
    }).join('');
  }
  fetch('../data/ai-models.json').then(function (r) { return r.json(); })
    .catch(function () { return window.AI_MODELS_DATA; }).then(draw);
})();
