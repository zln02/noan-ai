/* iamodu/iamodu.js — 「어떤 일에 어떤 도구」. data/tasks.json(안내서 카드)을 도구별 카드로 묶는다.
   fetch 가 막히면(file://) data/tasks.js 의 GUIDE_TASKS 를 쓴다. */
(function () {
  'use strict';
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  /* 도구마다 다른 아이콘. 모두 같은 틀(24×24, 선 1.9, 둥근 끝)이라 한 벌로 보인다.
     위 「안에 무엇이 있나」 카드와 같은 도구는 같은 그림을 쓴다(JNE GPT 말풍선, NotebookLM 책, 미리캔버스 붓).
     새 도구가 생기면 여기에 한 줄 더하면 된다. 없으면 맨 아래 「문서」 그림이 나온다. */
  var ICONS = [
    [/JNE GPT \+/, 'is-mint', '<path d="M3.5 4.5h11v8H8l-4.5 3.5z"/><path d="M14 19.5l5.5-5.5 1.5 1.5-5.5 5.5H14z"/>'],
    [/JNE GPT/, 'is-lilac', '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>'],
    [/AI 이미지/, '', '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>'],
    [/미리캔버스/, 'is-rose', '<path d="M4 20c3 0 5-1 5-3.5L7.5 15 15 7.5 17 9.5 9.5 17"/><path d="M15 7.5 18.5 4 21 6.5 17 10"/>'],
    [/NotebookLM/, 'is-peach', '<path d="M12 6.3c-2-1.6-5-2.1-8-1.7v13c3-.4 6 .1 8 1.7 2-1.6 5-2.1 8-1.7v-13c-3-.4-6 .1-8 1.7z"/><path d="M12 6.3v13"/>'],
    [/유레카|설문/, 'is-mint', '<path d="M4 20h16"/><rect x="6" y="11" width="3" height="6" rx="1"/><rect x="11" y="6" width="3" height="11" rx="1"/><rect x="16" y="13" width="3" height="4" rx="1"/>'],
    [/관리자/, 'is-butter', '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>'],
    [/퀴즈/, 'is-lilac', '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/><path d="M12 17h.01"/>'],
    [/티처블/, 'is-peach', '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3.5"/>'],
    [/아이모두/, '', '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>']
  ];
  var DOC = '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>';
  /* [찾는 글자, 색(위 카드와 같은 도구는 같은 색), 그림] */
  function icoFor(tool) {
    var hit = ['', DOC];
    for (var i = 0; i < ICONS.length; i++) if (ICONS[i][0].test(tool)) { hit = [ICONS[i][1], ICONS[i][2]]; break; }
    return { tone: hit[0], svg: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + hit[1] + '</svg>' };
  }
  var TONE_INK = { '': 'var(--pm-sky-ink)', 'is-mint': 'var(--pm-mint-ink)', 'is-lilac': 'var(--pm-lilac-ink)', 'is-peach': 'var(--pm-peach-ink)', 'is-rose': 'var(--pm-rose-ink)', 'is-butter': 'var(--pm-butter-ink)' };
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
      var g = by[k], ico = icoFor(k);
      var where = g.path && g.path.length
        ? '<ol class="pm-path" aria-label="여는 길">' + g.path.map(function (p) { return '<li><span>' + esc(p) + '</span></li>'; }).join('') + '</ol>'
        : '<span class="need">여는 길 확인 필요</span>';
      var links = g.items.map(function (t) {
        return '<li><a href="../index.html#' + esc(t.no) + '"><span class="pm-chip">' + esc(t.no) + '</span><span>' + esc(t.title) + '</span></a></li>';
      }).join('');
      return '<article class="im-tcard" style="--tone:' + TONE_INK[ico.tone] + '"><div class="im-thead"><span class="pm-ico ' + ico.tone + '">' + ico.svg + '</span><div><h3>' + esc(k) + '</h3><small>카드 ' + g.items.length + '개</small></div></div>' +
        where + '<ul class="im-tlinks">' + links + '</ul></article>';
    }).join('');
  }
  fetch('../data/tasks.json').then(function (r) { return r.json(); })
    .catch(function () { return window.GUIDE_TASKS; }).then(draw);
})();

/* 아이모두 한눈에 — 13초 그림. 눌러야 재생(자동재생 없음), 소리 없음, 자막 항상. 같은 사이트의 한 장짜리 HTML 을 sandbox iframe 으로 연다. */
(function () {
  'use strict';
  var box = document.querySelector('[data-mini]');
  if (!box) return;
  var btn = box.querySelector('.im-mini-play');
  btn.addEventListener('click', function () {
    var fr = document.createElement('iframe');
    fr.src = box.getAttribute('data-mini') + '?autoplay=1';
    fr.title = '아이모두 13초 그림';
    fr.setAttribute('sandbox', 'allow-scripts');
    box.innerHTML = '';
    box.appendChild(fr);
    box.className += ' is-playing';
    try { fr.focus(); } catch (e) { }
  });
})();
