/* iamodu/iamodu.js — 「어떤 일에 어떤 도구」 표. data/tasks.json(안내서 카드)을 도구별로 묶는다.
   fetch 가 막히면(file://) data/tasks.js 의 GUIDE_TASKS 를 쓴다. */
(function () {
  'use strict';
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function draw(data) {
    var box = document.getElementById('im-table');
    var tasks = data && (data.tasks || data);
    if (!tasks || !tasks.length) { box.textContent = '자료를 불러오지 못했습니다. 안내서 첫 화면에서 업무를 찾아 주세요.'; return; }
    var order = [], by = {};
    tasks.forEach(function (t) {
      var k = t.tool || '기타';
      if (!by[k]) { by[k] = { path: t.path, items: [] }; order.push(k); }
      by[k].items.push(t);
    });
    var rows = order.map(function (k) {
      var g = by[k];
      var where = g.path && g.path.length ? esc(g.path.join(' › ')) : '<span class="need">확인 필요</span>';
      var links = g.items.map(function (t) {
        return '<a href="../index.html#' + esc(t.no) + '">' + esc(t.no) + ' ' + esc(t.title) + '</a>';
      }).join('<br>');
      return '<tr><th scope="row">' + esc(k) + '</th><td>' + where + '</td><td>' + links + '</td></tr>';
    }).join('');
    box.innerHTML = '<table class="im-table"><thead><tr><th scope="col">도구</th><th scope="col">여는 길</th><th scope="col">이럴 때</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }
  fetch('../data/tasks.json').then(function (r) { return r.json(); })
    .catch(function () { return window.GUIDE_TASKS; }).then(draw);
})();
