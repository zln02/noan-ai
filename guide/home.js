(function () {
'use strict';

var listView = document.getElementById('gListView');
var detailView = document.getElementById('gDetailView');
var listEl = document.getElementById('gQuickCards');
var countEl = document.getElementById('gCount');
var filterBox = document.getElementById('gFilters');
var searchForm = document.getElementById('gSearchForm');
var searchInput = document.getElementById('gSearch');
var tipBox = document.getElementById('gTip');

var DATA = null;
var GROUPS = {};
var GUIDES = [];
var searchTerm = '';
var filterKey = 'all';

var ICON_MAP = {
  '가정통신문': 'letter',
  '회의록': 'mic',
  '긴 공문': 'doc-long',
  '활동지 · 문항': 'book',
  '활동지·문항': 'book',
  '설문': 'shield',
  '발표자료': 'slides',
  '수업자료': 'school',
  '자료 여러 개 비교': 'search-doc',
  '자료 비교': 'search-doc',
  '문서 검토': 'search-doc'
};

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function icon(name, size) {
  if (!name || !window.NoanIcons || !window.NoanIcons.icon) return '';
  return window.NoanIcons.icon(name, size);
}

function mountStaticIcons() {
  var nodes = document.querySelectorAll('[data-static-icon]');
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].innerHTML = icon(
      nodes[i].getAttribute('data-static-icon'),
      nodes[i].classList.contains('g-support-icon') ? 40 : (nodes[i].classList.contains('g-card-icon') ? 30 : 24)
    );
    if (!nodes[i].innerHTML) nodes[i].remove();
  }
}

function taskByNo(no) {
  if (!DATA) return null;
  for (var i = 0; i < DATA.tasks.length; i++) {
    if (DATA.tasks[i].no === no) return DATA.tasks[i];
  }
  return null;
}

function findTask(key) {
  if (!DATA) return -1;
  var i;

  for (i = 0; i < DATA.tasks.length; i++) {
    if (DATA.tasks[i].no === key) return i;
  }

  for (i = 0; i < DATA.tasks.length; i++) {
    if (DATA.tasks[i].id === key) return i;
  }

  return -1;
}

function minutesOf(task) {
  var m = task.min && task.min[1];
  return m ? m + '분' : '';
}

function matches(task, term) {
  if (filterKey === 'work' && task.group !== 'work') return false;
  if (filterKey === 'class' && task.group !== 'class') return false;
  if (filterKey === 'prompt' && !task.prompt) return false;
  if (!term) return true;
  var haystack = [task.no, task.title, task.when, task.tool]
    .concat(task.keywords || []).join(' ').toLowerCase();
  var words = term.split(/\s+/);
  for (var i = 0; i < words.length; i++) {
    if (words[i] && haystack.indexOf(words[i]) === -1) return false;
  }
  return true;
}

function iconFor(task) {
  var t = (task.title || '') + ' ' + (task.tool || '');
  var map = [
    [/가정통신문|알림|홈페이지/, 'letter'], [/회의|녹음|발언/, 'mic'],
    [/공문|지침|요강|계획서/, 'doc-long'], [/활동지|문항|퀴즈|형성평가|질문/, 'book'],
    [/설문|동의|인증|계정|안전/, 'shield'], [/발표|팜플렛|포스터|PPT|슬라이드/, 'slides'],
    [/수업|과학|캐릭터|배우/, 'school'], [/검토|비교|찾기|체크|지시서|운영/, 'search-doc']
  ];
  for (var i = 0; i < map.length; i++) if (map[i][0].test(t)) return map[i][1];
  return 'doc-long';
}

function taskCardHtml(task, index) {
  var group = GROUPS[task.group] || {};
  var time = minutesOf(task);
  return '<a class="g-quick-card g-pastel-' + ((index % 6) + 1) + '" href="#' + esc(task.no) + '" data-group="' + esc(task.group) + '">' +
    '<span class="g-card-icon" aria-hidden="true">' + icon(iconFor(task), 30) + '</span>' +
    '<h3>' + esc(task.title) + '</h3>' +
    '<p class="g-card-desc">' + esc(task.when) + '</p>' +
    '<div class="g-card-bottom">' +
      '<span class="g-tool-label">추천 도구</span>' +
      '<span class="g-tool-pill">' + esc(task.tool) + '</span>' +
      (time ? '<span class="g-card-time">' + esc(time) + '</span>' : '') +
      (task.prompt ? '<span class="g-card-prompt">지시서</span>' : '') +
    '</div>' +
    '<span class="g-card-arrow" aria-hidden="true">→</span>' +
  '</a>';
}

function renderList() {
  if (!DATA || !listEl) return;
  var term = searchTerm.trim().toLowerCase();
  var items = DATA.tasks.filter(function (t) { return matches(t, term); });
  if (items.length) {
    listEl.innerHTML = items.map(taskCardHtml).join('');
  } else {
    listEl.innerHTML = '<div class="g-empty"><p><b>찾으시는 안내서가 아직 없습니다.</b></p>' +
      '<p>다른 낱말로 찾아보시거나, 필요한 일을 알려 주세요.</p>' +
      '<a class="g-support-cta" href="request/index.html">요청하기</a></div>';
  }
  if (countEl) countEl.textContent = items.length + '장';
  if (window.NoanMotion) window.NoanMotion.reveal(listEl);
}

function renderFilters() {
  if (!filterBox) return;
  var n = {all: DATA.tasks.length, work: 0, 'class': 0, prompt: 0};
  DATA.tasks.forEach(function (t) { n[t.group]++; if (t.prompt) n.prompt++; });
  var defs = [['all', '전체'], ['work', '업무'], ['class', '수업'], ['prompt', '지시서 있음']];
  filterBox.innerHTML = defs.map(function (d) {
    return '<button type="button" data-f="' + d[0] + '" aria-pressed="' + (filterKey === d[0]) + '">' +
      d[1] + ' <small>' + n[d[0]] + '</small></button>';
  }).join('');
}

function openTask(no) {
  if (no) location.hash = '#' + no;
}

function markHtml(mark) {
  var label = mark[4] ? '<span>' + esc(mark[4]) + '</span>' : '';

  return '<span class="g-mark" style="left:' + Number(mark[0]) +
    '%;top:' + Number(mark[1]) +
    '%;width:' + Number(mark[2]) +
    '%;height:' + Number(mark[3]) + '%">' +
    label +
  '</span>';
}

function shotHtml(task) {
  /* shot 은 문자열 한 장이거나 여러 장의 배열이다.
     배열이면 앞에서부터 단계 카드가 한 장씩 가져간다(stepsHtml).
     여기는 단계보다 캡처가 많을 때 남는 것만 맡는다.
     문자열 한 장인 기존 카드는 예전과 똑같이 이 칸에 걸린다. */
  var array = Array.isArray(task.shot);
  var list = array ? task.shot : (task.shot ? [task.shot] : []);
  var rest = array ? list.slice(task.steps.length) : list;

  if (!rest.length) return '';

  var many = rest.length > 1;

  var figures = rest.map(function (file, i) {
    var alt = esc(task.title) + ' 화면' + (many ? ' ' + (i + 1) : '');

    return '<div class="g-shot-wrap">' +
      '<img class="g-shot-img" src="assets/guide/' + esc(file) +
        '" alt="' + alt + '">' +
      (array ? '' : (task.marks || []).map(markHtml).join('')) +
    '</div>';
  }).join('');

  return '<section class="g-section g-shot-section' + (many ? ' g-shot-many' : '') + '" hidden>' +
    '<h2>실제 화면 · 누를 곳</h2>' +
    figures +
    (task.shot_caption ? '<p class="g-shot-caption">' + esc(task.shot_caption) + '</p>' : '') +
  '</section>';
}

function resultHtml(task) {
  var lines = task.result_example || [];
  if (!lines.length) return '';
  return '<section class="g-section g-result-section">' +
    '<h2>이런 결과가 나와요</h2>' +
    '<p class="g-result-note">' + esc(task.result_note || '가상 정보로 만든 결과 구성 예시') + '</p>' +
    '<div class="g-result-preview">' + lines.map(function (line) {
      return '<p>' + esc(line) + '</p>';
    }).join('') + '</div>' +
    (task.result_shot ? '<figure class="g-result-shot"><img src="assets/guide/' + esc(task.result_shot) + '" alt="' + esc(task.title) + ' 결과 화면"><figcaption>가상 학교·행사 정보로 생성한 실제 화면</figcaption></figure>' : '') +
  '</section>';
}

function pathHtml(task) {
  if (!task.path || !task.path.length) return '';

  var parts = task.path.slice();
  var last = parts.pop();
  var path = parts.map(esc).join(' &gt; ');

  if (path) path += ' &gt; ';
  path += '<b>' + esc(last) + '</b>';

  return '<div class="g-path">[ ' + path + ' ]</div>';
}

function evidenceHtml(task) {
  var sources = task.sources || [];
  if (!sources.length) return '';

  return '<div class="g-evidence"><strong>확인한 가이드</strong><ul>' +
    sources.map(function (source) {
      var label = esc(source.label);
      var title = source.url ?
        '<a href="' + esc(source.url) + '" target="_blank" rel="noopener">' + label + '</a>' : label;
      return '<li>' + title +
        (source.detail ? ' · ' + esc(source.detail) : '') +
        (source.checked ? ' <small>확인 ' + esc(source.checked) + '</small>' : '') +
      '</li>';
    }).join('') + '</ul></div>';
}

function stepsHtml(task) {
  /* 단계마다 흰 카드 하나 — 번호 동그라미, 문장, 그 단계의 화면.
     shot 이 배열이면 n번째 캡처가 n번째 단계로 들어간다.
     파일 이름(01b-1 … 01b-4)이 이미 단계 번호와 맞춰져 있다.
     캡처가 없는 카드는 번호와 문장만 나온다 — 예전과 같은 내용이다. */
  var shots = Array.isArray(task.shot) ? task.shot : [];
  /* 캡처가 배열이면 marks 도 캡처 한 장에 한 묶음씩이다.
     marks[i] 가 i번째 캡처 위에 얹히는 붉은 동그라미들이다.
     캡처가 문자열 한 장인 기존 카드는 marks 가 예전처럼 납작한 목록이라
     여기서는 건드리지 않는다. */
  var markSets = (shots.length && Array.isArray(task.marks)) ? task.marks : [];

  return '<ol class="g-steps">' +
    task.steps.map(function (step, i) {
      var file = shots[i];
      var marks = Array.isArray(markSets[i]) ? markSets[i] : [];
      /* 프롬프트는 그 문장을 치는 단계 안에 들어간다.
         prompt_step 이 없는 카드는 예전처럼 아래 따로 선다. */
      var here = task.prompt_step === i + 1;

      return '<li class="g-step">' +
        '<span class="g-step-no">' + (i + 1) + '</span>' +
        '<div class="g-step-main">' +
          '<h3>' + esc(step) + '</h3>' +
          (here ? promptHtml(task) + noteHtml(task) : '') +
          (file ?
            '<div class="g-shot-wrap g-step-shot">' +
              '<img class="g-shot-img" src="assets/guide/' + esc(file) +
                '" alt="' + esc(task.title) + ' ' + (i + 1) + '단계 화면">' +
              marks.map(markHtml).join('') +
            '</div>' : '') +
        '</div>' +
      '</li>';
    }).join('') +
  '</ol>';
}

/* 지시서 안의 [ ] 와 「○○」 는 선생님이 바꿔 넣는 자리다. 눈에 띄게 칠한다. */
function blanksHtml(text) {
  var n = 0;
  var html = esc(text).replace(/\[[^\]\n]*\]|「[○ ]+」/g, function (m) {
    n++;
    return '<mark class="blank">' + m + '</mark>';
  });
  return { html: html, n: n };
}

function promptHtml(task) {
  if (!task.prompt) return '';

  var id = 'gPrompt-' + task.id;
  var b = blanksHtml(task.prompt);

  return '<div class="g-prompt">' +
    '<div class="g-prompt-head">' +
      '<span class="g-prompt-lab">지시서 — 그대로 붙여넣으세요</span>' +
      '<button type="button" class="g-copybtn" data-target="' + esc(id) + '">지시서 복사</button>' +
    '</div>' +
    '<pre id="' + esc(id) + '" tabindex="0">' + b.html + '</pre>' +
    (b.n ? '<p class="g-prompt-blank"><mark class="blank">이렇게 표시된 곳</mark>만 내 내용으로 바꾸세요.</p>' : '') +
    '<span class="g-copyhint" role="status" aria-live="polite" hidden></span>' +
  '</div>';
}

function noteHtml(task) {
  if (!task.prompt_note) return '';
  return '<div class="g-note">' + esc(task.prompt_note) + '</div>';
}

function toolLogoHtml(task) {
  /* 도구 로고는 meta.tool_logos 가 정한다. 없으면 아무것도 안 나온다.
     파일이 assets/guide/ 에 들어오는 순간 저절로 살아난다. */
  var logos = (DATA.meta && DATA.meta.tool_logos) || {};
  var file = logos[task.tool];

  if (!file) return '';

  return '<span class="g-tool-logo">' +
    '<img src="assets/guide/' + esc(file) + '" alt="' + esc(task.tool) + '">' +
  '</span>';
}

function timePillHtml(task) {
  /* 목업의 「2분」 배지. 숫자는 지어내지 않고 min 의 뒤쪽 값을 쓴다. */
  var mins = task.min || [0, 0];

  if (!mins[1]) return '';

  return '<span class="g-time-pill">' + esc(mins[1]) + '분</span>';
}

function minsHtml(task) {
  var mins = task.min || [0, 0];

  if (!mins[0]) return '';

  return '<p class="g-mins">보통 <b>' + esc(mins[0]) +
    '분</b> 걸리던 일이 <b>' + esc(mins[1]) +
    '분</b> 쯤으로 줄어듭니다. — 초기 추정입니다. 해보시고 알려주세요.</p>';
}

function manualsHtml(task) {
  var manuals = GUIDES.filter(function (guide) {
    return guide.tool === task.tool;
  });

  if (!manuals.length) return '';

  return '<details class="g-section g-fold">' +
    '<summary>관련 공식 안내·도구</summary>' +
    '<div class="g-fold-body"><ul class="g-manuals">' +
      manuals.map(function (guide) {
        var label = guide.note || guide.source || guide.tool;

        return '<li>' +
          '<a href="' + esc(guide.url) + '">' + esc(label) + '</a>' +
          (guide.source ? '<span>' + esc(guide.source) + '</span>' : '') +
        '</li>';
      }).join('') +
    '</ul></div>' +
  '</details>';
}

function pagerHtml(index) {
  var previous = index > 0 ? DATA.tasks[index - 1] : null;
  var next = index < DATA.tasks.length - 1 ? DATA.tasks[index + 1] : null;

  return '<nav class="g-pager" aria-label="안내서 이동">' +
    (previous ?
      '<a href="#' + esc(previous.no) + '">← 이전</a>' :
      '<span aria-disabled="true">← 이전</span>') +
    (next ?
      '<a href="#' + esc(next.no) + '">다음 →</a>' :
      '<span aria-disabled="true">다음 →</span>') +
  '</nav>';
}

function pagerBottomHtml(index) {
  /* 위쪽 작은 「← 이전 / 다음 →」 은 그대로 두고,
     목업처럼 카드 이름이 보이는 큰 이동 줄을 아래에 더한다. */
  var previous = index > 0 ? DATA.tasks[index - 1] : null;
  var next = index < DATA.tasks.length - 1 ? DATA.tasks[index + 1] : null;

  if (!previous && !next) return '';

  return '<nav class="g-pager-bottom" aria-label="다른 카드로 이동">' +
    (previous ?
      '<a class="g-pager-prev" href="#' + esc(previous.no) + '">' +
        '<span class="g-pager-lab">← 이전 카드</span>' +
        '<span class="g-pager-title">' + esc(previous.title) + '</span>' +
      '</a>' : '<span></span>') +
    (next ?
      '<a class="g-pager-next" href="#' + esc(next.no) + '">' +
        '<span class="g-pager-lab">다음 카드 →</span>' +
        '<span class="g-pager-title">' + esc(next.title) + '</span>' +
      '</a>' : '<span></span>') +
  '</nav>';
}

function renderDetail(task, index) {
  var group = GROUPS[task.group];

  var html =
    '<div class="g-detail-top">' +
      '<div class="g-detail-actions">' +
        '<a class="g-back" href="#">← 목록으로</a>' +
        '<a class="g-request" href="request/index.html">요청하기</a>' +
      '</div>' +
      pagerHtml(index) +
    '</div>' +

    '<header class="g-detail-head">' +
      toolLogoHtml(task) +
      '<span class="g-big-number">' + esc(task.no) + '</span>' +
      '<div>' +
        '<h1>' + esc(task.title) + '</h1>' +
        '<span class="g-group-tag">' + esc(group.label) + '</span>' +
        timePillHtml(task) +
      '</div>' +
      '<button type="button" class="g-printcard">이 카드만 인쇄 · PDF</button>' +
    '</header>' +

    '<div class="g-detail-body">' +
      '<div class="g-when-strip">' +
        '<span class="g-when-lab">이럴 때 씁니다</span>' +
        '<span class="g-when-text">' + esc(task.when) + '</span>' +
      '</div>' +
      minsHtml(task) +

      '<section class="g-section">' +
        '<h2>추천 도구</h2>' +
        '<p class="g-tool-line">도구: ' + esc(task.tool) + '</p>' +
        pathHtml(task) +
        evidenceHtml(task) +
      '</section>' +

      '<section class="g-section g-steps-section">' +
        '<h2>' + task.steps.length + '단계 사용법</h2>' +
        stepsHtml(task) +
      '</section>' +

      (task.prompt && !task.prompt_step ?
        '<section class="g-section">' +
          '<h2>복사할 프롬프트</h2>' +
          promptHtml(task) +
          noteHtml(task) +
        '</section>' : '') +

      shotHtml(task) +
      resultHtml(task) +

      (task.caution ?
        '<div class="g-caution g-caution-box">' +
          '<span class="g-caution-mark" aria-hidden="true">!</span>' +
          '<div class="g-caution-main">' +
            '<div class="g-caution-lab">꼭 확인할 것</div>' +
            '<p class="g-caution-text">' + esc(task.caution) + '</p>' +
          '</div>' +
        '</div>' : '') +

      manualsHtml(task) +
      pagerBottomHtml(index) +
    '</div>';

  detailView.innerHTML = html;
  listView.hidden = true;
  detailView.hidden = false;

  bindCopyButtons();
  bindShotFallback();
  bindPrintButton();
  bindLogoFallback();
  if (window.NoanMotion) window.NoanMotion.detail(detailView);
}

function bindLogoFallback() {
  /* 로고 파일이 없으면 빈 상자를 남기지 않는다. */
  var logo = detailView.querySelector('.g-tool-logo');
  if (!logo) return;

  var image = logo.querySelector('img');

  function drop() {
    if (logo.parentNode) logo.parentNode.removeChild(logo);
  }

  image.addEventListener('error', drop);
  if (image.complete && !image.naturalWidth) drop();
}

function bindPrintButton() {
  /* 브라우저 인쇄창을 그대로 쓴다. 「PDF로 저장」 도 거기 있다.
     인쇄용 페이지를 따로 만들지 않는다 — 지금 보고 계신 이 카드가 그대로 나간다. */
  var button = detailView.querySelector('.g-printcard');
  if (!button) return;
  button.addEventListener('click', function () {
    window.print();
  });
}

function bindShotFallback() {
  /* 캡처는 단계 카드 안에도 있고, 아래 「시연 영상 / 캡처」 칸에도 있다.
     못 뜬 사진은 그 사진 하나만 지운다 — 자리를 비워두지 않는다.
     아래 칸은 한 장이라도 떠야 열리고, 전부 못 뜨면 통째로 없앤다. */
  var images = detailView.querySelectorAll('.g-shot-img');
  if (!images.length) return;

  var section = detailView.querySelector('.g-shot-section');
  var body = detailView.querySelector('.g-detail-body');
  var left = images.length;
  var sectionShown = 0;

  function settle() {
    if (!section) return;

    if (sectionShown) {
      section.hidden = false;
      if (body) body.classList.add('g-has-shot');
    } else {
      if (section.parentNode) section.parentNode.removeChild(section);
      if (body) body.classList.remove('g-has-shot');
    }
  }

  function mark(image, ok) {
    var wrap = image.parentNode;
    var inSection = section && section.contains(image);

    if (ok) {
      if (inSection) sectionShown++;
    } else if (wrap && wrap.parentNode) {
      wrap.parentNode.removeChild(wrap);
    }

    if (--left === 0) settle();
  }

  Array.prototype.forEach.call(images, function (image) {
    if (image.complete) { mark(image, !!image.naturalWidth); return; }
    image.addEventListener('load', function () { mark(image, true); });
    image.addEventListener('error', function () { mark(image, false); });
  });
}

function bindCopyButtons() {
  var buttons = detailView.querySelectorAll('.g-copybtn');

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function (event) {
      var button = event.currentTarget;
      var pre = document.getElementById(button.getAttribute('data-target'));
      var hint = button.closest('.g-prompt').querySelector('.g-copyhint');
      var originalLabel = button.textContent;

      function success() {
        button.textContent = '✓ 복사됐어요';
        button.classList.add('is-done');
        if (window.NoanMotion) window.NoanMotion.copied(button, pre);
        if (window.NoanApp) window.NoanApp.toast('복사됐어요 — 입력창에 붙여넣으세요');
        if (hint) { hint.hidden = false; hint.textContent = '복사했습니다. 이제 아이모두 입력창에 붙여넣기(길게 누르기 → 붙여넣기)'; }
        if (window.NoanFeedback) window.NoanFeedback.copied(button.closest('.g-prompt'), pre.id);

        window.setTimeout(function () {
          button.textContent = originalLabel;
          button.classList.remove('is-done');
        }, 2500);
      }

      function manualCopy() {
        try {
          var range = document.createRange();
          var selection = window.getSelection();

          range.selectNodeContents(pre);
          selection.removeAllRanges();
          selection.addRange(range);
          if (document.execCommand && document.execCommand('copy')) { success(); return; }
        } catch (error) {
        }

        if (hint) {
          hint.hidden = false;
          hint.textContent = '본문을 선택했습니다. Ctrl+C 를 누르세요';
        }
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pre.textContent).then(success, manualCopy);
      } else {
        manualCopy();
      }
    });
  }
}

function renderTip() {
  if (!DATA.meta || !DATA.meta.tip) {
    tipBox.innerHTML = '';
    return;
  }

  tipBox.innerHTML =
    '<div class="g-tip"><b>도구가 안 보이실 때</b><p>' +
    esc(DATA.meta.tip) +
    '</p></div>';
}

function route() {
  if (!DATA) return;

  var key = decodeURIComponent(location.hash.replace(/^#/, ''));

  if (key) {
    var index = findTask(key);

    if (index !== -1) {
      renderDetail(DATA.tasks[index], index);
      window.scrollTo(0, 0);
      return;
    }
  }

  detailView.hidden = true;
  detailView.innerHTML = '';
  listView.hidden = false;
  renderFilters();
  renderList();
  renderTip();
  if (location.hash === '' ) document.title = '노안중 AI 안내서 — 무엇을 하시려고요?';
}

function fail() {
  listEl.innerHTML =
    '<p class="g-muted">안내서를 불러오지 못했습니다. ' +
    '<a href="data/tasks.json">tasks.json</a> 을 직접 여세요.</p>';
}

function boot(data) {
  DATA = data;
  GROUPS = {};

  for (var i = 0; i < DATA.groups.length; i++) {
    GROUPS[DATA.groups[i].id] = DATA.groups[i];
  }

  window.addEventListener('hashchange', function () {
    if (window.NoanMotion) window.NoanMotion.transition(route); else route();
  });
  route();
}

function loadJson(path, fallbackName) {
  if (!window.fetch) {
    return Promise.resolve(window[fallbackName] || null);
  }

  return fetch(path)
    .then(function (response) {
      if (!response.ok) return Promise.reject(response.status);
      return response.json();
    })
    .catch(function () {
      return window[fallbackName] || null;
    });
}

function applySearch(value) {
  searchTerm = value;
  renderList();
}

searchInput.addEventListener('input', function () { applySearch(searchInput.value); });
searchForm.addEventListener('submit', function (event) {
  event.preventDefault();
  applySearch(searchInput.value);
  var top = document.getElementById('gGuideTitle');
  if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

filterBox.addEventListener('click', function (event) {
  var b = event.target.closest('button[data-f]');
  if (!b) return;
  filterKey = b.getAttribute('data-f');
  renderFilters();
  renderList();
});

/* 자주 찾는 업무: 누르면 검색어로 들어가 목록이 바로 좁혀진다 */
Array.prototype.forEach.call(document.querySelectorAll('[data-q]'), function (btn) {
  btn.addEventListener('click', function () {
    searchInput.value = btn.getAttribute('data-q');
    filterKey = 'all';
    renderFilters();
    applySearch(searchInput.value);
    document.getElementById('gGuideTitle').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

mountStaticIcons();

Promise.all([
  loadJson('data/tasks.json?v=20261021', 'GUIDE_TASKS'),
  loadJson('data/guides.json', 'GUIDES_DATA')
]).then(function (loaded) {
  GUIDES = loaded[1] || [];
  if (!loaded[0]) { fail(); return; }
  boot(loaded[0]);
}).catch(fail);
})();
