(function () {
'use strict';

var listView = document.getElementById('gListView');
var detailView = document.getElementById('gDetailView');
var tipBox = document.getElementById('gTip');
/* 목록(찾기·분류·찜·최근 본)은 guide/home-alpine.js 가 맡는다. 이 파일은 상세 쪽(#02 같은 주소)과 지시서 복사를 맡는다. */
var Store = window.NoanGuideStore || null;

var DATA = null;
var GROUPS = {};
var GUIDES = [];
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

/* 누를 곳 표시 — 빨간 상자 + 번호 동그라미. 이름은 그림 아래 「누를 곳」 목록(markLegendHtml)에 16px 글씨로 적는다.
   (예전처럼 이름표를 그림 위에 얹으면 폰에서 글씨가 12px로 작아지고, 옆 상자를 가리거나 그림 밖으로 잘렸다.) */
function markHtml(mark, i) {
  var x = Number(mark[0]), y = Number(mark[1]);
  var cls = 'g-mark' + (y < 6 ? ' is-top' : '') + (x < 4 ? ' is-left' : '');
  return '<span class="' + cls + '" style="left:' + x +
    '%;top:' + y +
    '%;width:' + Number(mark[2]) +
    '%;height:' + Number(mark[3]) + '%">' +
    '<b class="g-mark-no" aria-hidden="true">' + (i + 1) + '</b>' +
  '</span>';
}

function markName(mark) {
  return String(mark[4] || '').replace(/^[①-⑳]\s*/, '');
}

function markLegendHtml(marks) {
  var named = (marks || []).filter(function (m) { return m[4]; });
  if (!named.length) return '';
  return '<ol class="g-mark-legend" aria-label="누를 곳">' +
    (marks || []).map(function (m, i) {
      return m[4] ? '<li><b aria-hidden="true">' + (i + 1) + '</b><span>' + esc(markName(m)) + '</span></li>' : '';
    }).join('') +
  '</ol>';
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
    '</div>' +
    (array ? '' : markLegendHtml(task.marks));
  }).join('');

  return '<section class="g-section g-shot-section' + (many ? ' g-shot-many' : '') + '" hidden>' +
    '<h2>실제 화면 · 누를 곳</h2>' +
    figures +
    (task.shot_caption ? '<p class="g-shot-caption">' + esc(task.shot_caption) + '</p>' : '') +
  '</section>';
}

function resultHtml(task) {
  if (!task.result_shot) return '';
  return '<section class="g-section g-result-section">' +
    '<h2>결과 화면</h2>' +
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
          (here ? '<p class="g-step-pointer">↑ 위 「지시서」 칸에서 복사해 붙여넣습니다.</p>' : '') +
          (file ?
            '<div class="g-shot-wrap g-step-shot">' +
              '<img class="g-shot-img" src="assets/guide/' + esc(file) +
                '" alt="' + esc(task.title) + ' ' + (i + 1) + '단계 화면">' +
              marks.map(markHtml).join('') +
            '</div>' + markLegendHtml(marks) : '') +
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

/* 한눈에 카드 — 쇼츠처럼 필요한 것만: 무엇을 · 어디서 · 지시서 · 결과 예시 · 주의 */
function glanceHtml(task) {
  var path = (task.path || []).map(function (p, i, all) {
    return '<li' + (i === all.length - 1 ? ' class="is-last"' : '') + '><span>' + esc(p) + '</span></li>';
  }).join('');
  var lines = (task.result_example || []).slice(0, 3);
  var order = task.prompt ? promptHtml(task) + noteHtml(task) :
    '<p class="g-gl-noprompt">' + esc(task.prompt_note || '지시서 없이 화면 순서대로 하면 됩니다.') + '</p>';
  var full = task.caution && task.caution_one && task.caution !== task.caution_one;
  return '<section class="g-glance" aria-label="한눈에">' +
    '<div class="g-gl-row is-what"><span class="g-gl-lab">무엇을</span><p class="g-gl-what">' + esc(task.what || task.when) + '</p></div>' +
    (path ? '<div class="g-gl-row is-where"><span class="g-gl-lab">어디서</span><ol class="g-pills" aria-label="여는 길">' + path + '</ol></div>' : '') +
    '<div class="g-gl-row is-order"><span class="g-gl-lab">지시서</span><div class="g-gl-body">' + order + '</div></div>' +
    (lines.length ? '<div class="g-gl-row is-result"><span class="g-gl-lab">결과 예시</span><div class="g-gl-body"><ul class="g-gl-result">' +
      lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul><small>' + esc(task.result_note || '가상 정보로 만든 결과 구성 예시') + '</small></div></div>' : '') +
    (task.caution ? '<div class="g-gl-row is-caution"><span class="g-gl-lab">주의</span><div class="g-gl-body"><p class="g-gl-caution">' + esc(task.caution_one || task.caution) + '</p>' +
      (full ? '<details class="g-gl-more"><summary>자세히</summary><p>' + esc(task.caution) + '</p></details>' : '') + '</div></div>' : '') +
  '</section>';
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
      '<div class="g-head-actions">' +
        (Store ? '<button type="button" class="g-fav-detail" aria-pressed="' + Store.isFav(task.no) + '">' + FAV_SVG + '<span>' + (Store.isFav(task.no) ? '찜했어요' : '찜하기') + '</span></button>' : '') +
        '<button type="button" class="g-printcard">이 카드만 인쇄 · PDF</button>' +
      '</div>' +
    '</header>' +

    '<div class="g-detail-body">' +
      '<p class="g-when-line"><b>이럴 때</b> ' + esc(task.when) + '</p>' +
      glanceHtml(task) +
      minsHtml(task) +

      '<section class="g-section">' +
        '<h2>도구와 근거</h2>' +
        '<p class="g-tool-line">도구: ' + esc(task.tool) + '</p>' +
        evidenceHtml(task) +
      '</section>' +

      '<section class="g-section g-steps-section">' +
        '<h2>' + task.steps.length + '단계 사용법</h2>' +
        stepsHtml(task) +
      '</section>' +

      shotHtml(task) +
      resultHtml(task) +

      manualsHtml(task) +
      pagerBottomHtml(index) +
    '</div>';

  detailView.innerHTML = html;
  listView.hidden = true;
  detailView.hidden = false;

  bindCopyButtons();
  bindFavButton(task);
  if (Store) Store.pushRecent(task.no);
  bindShotFallback();
  bindPrintButton();
  bindLogoFallback();
  if (window.NoanMotion) window.NoanMotion.detail(detailView);
}

var FAV_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>';

/* 상세 쪽의 「찜하기」. 첫 화면 「찜」 탭과 같은 저장소를 쓴다(카드 번호만 남는다). */
function bindFavButton(task) {
  var b = detailView.querySelector('.g-fav-detail');
  if (!b || !Store) return;
  b.addEventListener('click', function () {
    var on = Store.toggleFav(task.no);
    b.setAttribute('aria-pressed', String(on));
    b.querySelector('span').textContent = on ? '찜했어요' : '찜하기';
    if (window.NoanApp) window.NoanApp.toast(on ? '찜했어요 — 첫 화면 「찜」 탭에 모여요' : '찜을 풀었어요');
  });
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
      var legend = wrap.nextElementSibling;
      if (legend && legend.classList.contains('g-mark-legend')) legend.parentNode.removeChild(legend);
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
  renderTip();
  if (location.hash === '' ) document.title = '노안중 AI 안내서 — 무엇을 하시려고요?';
}

function fail() {
  /* 데이터를 못 읽으면 Alpine 목록 대신 「자바스크립트 없이도 보이는 목록」을 보여 준다 */
  document.documentElement.classList.remove('alpine-ok');
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

mountStaticIcons();

/* 목록(home-alpine.js)도 이 약속을 기다렸다가 같은 데이터를 쓴다 */
var ready = Promise.all([
  loadJson('data/tasks.json?v=20261021', 'GUIDE_TASKS'),
  loadJson('data/guides.json', 'GUIDES_DATA')
]);
window.NoanGuideReady = ready.then(function (loaded) { return loaded[0]; });
ready.then(function (loaded) {
  GUIDES = loaded[1] || [];
  if (!loaded[0]) { fail(); return; }
  boot(loaded[0]);
}).catch(fail);
})();
