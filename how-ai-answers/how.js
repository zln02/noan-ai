/* how-ai-answers/how.js — 「AI는 어떻게 답을 만들까」 여섯 걸음 보기
   · 3D(three.js, shared/vendor/three)가 되는 컴퓨터에서는 3D, 약한 기기·동작 줄이기·WebGL 없음이면 2D 그림(SVG)
   · 앞뒤 단추 · 번호 단추 · 키보드 ←/→ · 아래 글을 스크롤해도 걸음이 따라 바뀐다
   · 아주 단순하게 줄인 그림이다. 실제 AI 내부의 모양이 아니다. */
(function () {
  'use strict';
  var STEPS = [
    { t: '입력', f: '주문서', c: '내가 쓴 글이 AI에 들어와요' },
    { t: '토큰으로 쪼개기', f: '김밥 썰기', c: '글을 작은 조각으로 나눠요' },
    { t: '의미 공간에 놓기', f: '비슷한 재료끼리', c: '뜻이 비슷한 조각은 가까이 놓여요' },
    { t: '관계 보기 (어텐션)', f: '어울림 판단', c: '어느 조각이 어느 조각과 이어지는지 따져요' },
    { t: '다음 말 하나씩 예측', f: '한 숟갈씩 뽑기', c: '후보마다 확률을 매기고 하나를 뽑아요 (숫자는 예시)' },
    { t: '답', f: '완성 요리', c: '이어 붙인 말이 답이 돼요' }
  ];
  var WORDS = ['오늘', '급식', '메뉴', '추천', '해줘'];
  var TOK = [['#FFD9E4', '#F2B3C7'], ['#CDEFDB', '#9FD6B6'], ['#CDEFDB', '#9FD6B6'], ['#E6DDFF', '#BFAFF2'], ['#E6DDFF', '#BFAFF2']];
  var ATT = [0.08, 0.42, 0.32, 0, 0.18];
  var INK = '#2A2118';
  var CANDS = [['비빔밥', 40, '#FFC94D', '#F0A91F'], ['김밥', 30, '#9BE0B8', '#6CC592'], ['국수', 20, '#B7CEFA', '#86A9EE']];
  /* 2D 의미 공간 자리 (그림 좌표 720x540) */
  var P2 = [[110, 165], [430, 205], [560, 262], [300, 330], [150, 395]];

  var stage = document.getElementById('howStage');
  if (!stage) return;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var capEl = document.getElementById('howCap');
  var dots = document.querySelectorAll('.how-dot');
  var prev = document.getElementById('howPrev'), next = document.getElementById('howNext'), mode = document.getElementById('howMode');
  var fill = document.getElementById('howFill');
  var items = document.querySelectorAll('.flow > li');
  var svg = document.getElementById('how2d'), canvas = document.getElementById('how3d'), loading = document.getElementById('howLoading');
  var loadTxt = document.getElementById('howLoadTxt');
  var wrap = document.querySelector('.how-stagewrap');
  var cur = 0, scene = null, use3d = false, busy = false;

  /* ---------- 2D 그림 도우미 ---------- */
  var cnt = 0; /* 한 장면 안에서 나타나는 차례 */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function wEst(s, size) {
    var w = 0, i, ch;
    for (i = 0; i < s.length; i++) { ch = s.charCodeAt(i); w += (ch > 0x2E80) ? 1 : (ch === 32 ? 0.32 : 0.6); }
    return w * size;
  }
  function G(inner, x, y) { cnt++; return '<g transform="translate(' + x + ' ' + y + ')"><g class="how-g" style="--i:' + cnt + '">' + inner + '</g></g>'; }
  function shadowE(w, y) { return '<ellipse cx="0" cy="' + y + '" rx="' + (w * 0.46) + '" ry="8" fill="url(#gSh)"/>'; }
  function token(i, o) {
    o = o || {}; var w = o.w || 118, h = o.h || 76, c = o.c || TOK[i], fs = o.fs || 34, label = o.label || WORDS[i];
    var s = '';
    if (!o.noShadow) s += shadowE(w, h / 2 + 12);
    s += '<rect x="' + (-w / 2) + '" y="' + (-h / 2 + 7) + '" width="' + w + '" height="' + h + '" rx="18" fill="' + c[1] + '"/>';
    s += '<rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="18" fill="' + c[0] + '" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>';
    s += '<rect x="' + (-w / 2 + 8) + '" y="' + (-h / 2 + 5) + '" width="' + (w - 16) + '" height="10" rx="5" fill="#fff" opacity=".32"/>';
    s += '<text y="' + (fs * 0.35) + '" text-anchor="middle" font-size="' + fs + '" font-weight="800" fill="' + (o.ink || INK) + '">' + esc(label) + '</text>';
    return '<g opacity="' + (o.op == null ? 1 : o.op) + '">' + s + '</g>';
  }
  function pill(text, o) {
    o = o || {}; var size = o.size || 24, w = wEst(text, size) + size * 1.5, h = size * 1.75;
    return '<g filter="url(#hsd)"><rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="' + (h / 2) + '" fill="' + (o.bg || '#fff') + '"' + (o.line ? ' stroke="' + o.line + '" stroke-width="2.5"' : '') + '/>' +
      '<text y="' + (size * 0.35) + '" text-anchor="middle" font-size="' + size + '" font-weight="800" fill="' + (o.fg || INK) + '">' + esc(text) + '</text></g>';
  }
  function floorShadow(rx, ry, op) { return '<ellipse rx="' + rx + '" ry="' + ry + '" fill="url(#gSh)" opacity="' + (op || 1) + '"/>'; }
  function cluster(cx, cy, rx, ry, fill, line, op) {
    return '<g opacity="' + (op || 1) + '"><ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '" opacity=".75"/><ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (rx - 7) + '" ry="' + (ry - 7) + '" fill="none" stroke="' + line + '" stroke-width="3" stroke-dasharray="3 10" stroke-linecap="round"/></g>';
  }

  function scene2d(k) {
    var s = '', i;
    cnt = 0;
    if (k === 0) {
      s += G(floorShadow(250, 12, .8), 360, 285);
      s += G('<rect x="-300" y="-65" width="600" height="130" rx="22" fill="#FFFDF7" stroke="#EBDDBF" stroke-width="3" filter="url(#hsd)"/><path d="M-300 -37v-12a22 22 0 0 1 22-22H278a22 22 0 0 1 22 22v12z" fill="#FFD58A"/><text y="26" text-anchor="middle" font-size="42" font-weight="800" fill="#3A2E24">오늘 급식 메뉴 추천해줘</text>', 360, 205);
      s += G(pill('주문서 · 내가 쓴 글', { bg: '#FFE9A8', fg: '#6B4A00', size: 24 }), 210, 132);
      s += G('<g filter="url(#hsd)"><path d="M0 0v50" stroke="#1568D2" stroke-width="12" stroke-linecap="round"/><path d="M-26 38L0 68l26-30z" fill="#1568D2" stroke="#1568D2" stroke-width="8" stroke-linejoin="round"/></g>', 360, 300);
      s += G('<rect x="-120" y="-38" width="240" height="76" rx="28" fill="#DCEBFF" stroke="#B9D5F8" stroke-width="3" filter="url(#hsd)"/><text y="11" text-anchor="middle" font-size="34" font-weight="800" fill="#0B4FA8">AI 주방</text>', 360, 420);
    } else if (k === 1) {
      s += G('<rect x="-330" y="-26" width="660" height="52" rx="22" fill="#D9AE6F"/><rect x="-330" y="-26" width="660" height="40" rx="22" fill="#EBC993"/><rect x="-300" y="-16" width="600" height="8" rx="4" fill="#fff" opacity=".35"/>', 360, 352);
      for (i = 0; i < 5; i++) s += G(token(i), 100 + i * 130, 272);
      s += G(pill('작은 조각 = 토큰', { bg: '#E9F7EF', fg: '#17623A', line: '#C9EBD6', size: 28 }), 360, 160);
    } else if (k === 2) {
      s += G(cluster(495, 235, 178, 96, '#CDEFDB', '#7CCB9C'), 0, 0) + G(cluster(225, 365, 168, 92, '#E1D8FC', '#A68CF0'), 0, 0);
      for (i = 0; i < 5; i++) s += G(token(i, { w: 112, h: 72, fs: 32 }), P2[i][0], P2[i][1]);
      s += G(pill('음식 이야기', { fg: '#17623A', size: 24 }), 495, 352);
      s += G(pill('부탁하는 말', { fg: '#5B3DB8', size: 24 }), 225, 482);
    } else if (k === 3) {
      s += G(cluster(495, 235, 178, 96, '#CDEFDB', '#7CCB9C', .45), 0, 0) + G(cluster(225, 365, 168, 92, '#E1D8FC', '#A68CF0', .45), 0, 0);
      s += G('<circle cx="' + P2[3][0] + '" cy="' + P2[3][1] + '" r="98" fill="url(#gHalo)"/>', 0, 0);
      var pc = [];
      for (i = 0; i < 5; i++) if (ATT[i] > 0) {
        var t = i === 2 ? 0.66 : 0.6, px = P2[3][0] + (P2[i][0] - P2[3][0]) * t, py = P2[3][1] + (P2[i][1] - P2[3][1]) * t;
        s += G('<line x1="' + P2[3][0] + '" y1="' + P2[3][1] + '" x2="' + P2[i][0] + '" y2="' + P2[i][1] + '" stroke="#1568D2" stroke-opacity="' + (0.35 + ATT[i]) + '" stroke-width="' + (4 + ATT[i] * 28) + '" stroke-linecap="round"/>', 0, 0);
        pc.push([px, py, Math.round(ATT[i] * 100) + '%']);
      }
      for (i = 0; i < 5; i++) s += G(token(i, { w: 112, h: 72, fs: 32, op: i === 3 ? 1 : 0.82 }), P2[i][0], P2[i][1]);
      pc.forEach(function (p) { s += G(pill(p[2], { bg: '#1568D2', fg: '#fff', size: 24 }), p[0], p[1] - 4); });
      s += G(pill('굵을수록 더 많이 봐요 (예시)', { bg: '#EAF3FF', fg: '#0B4FA8', line: '#CFE2FB', size: 24 }), 360, 40);
    } else if (k === 4) {
      for (i = 0; i < 5; i++) s += G(token(i, { w: 96, h: 58, fs: 28, noShadow: true }), 95 + i * 106, 70);
      s += G(token(0, { w: 96, h: 58, fs: 34, label: '?', c: ['#FFF1BD', '#F3D77C'], ink: '#8A5A00', noShadow: true }), 95 + 5 * 106, 70);
      s += G('<path d="M625 110v32" stroke="#1568D2" stroke-width="5" stroke-dasharray="2 10" stroke-linecap="round"/>', 0, 0);
      s += G(pill('다음에 올 말 후보 (숫자는 예시)', { bg: '#FFF3C4', fg: '#6B4E00', line: '#F4E3A6', size: 24 }), 360, 168);
      CANDS.forEach(function (c, j) {
        var h = c[1] * 4.5, x = 130 + j * 230;
        s += G(floorShadow(90, 10, .8), x, 452);
        s += G('<rect x="-62" y="' + (-h + 7) + '" width="124" height="' + h + '" rx="20" fill="' + c[3] + '"/><rect x="-62" y="' + (-h) + '" width="124" height="' + h + '" rx="20" fill="' + c[2] + '" stroke="#fff" stroke-opacity=".6" stroke-width="2"/><rect x="-50" y="' + (-h + 9) + '" width="100" height="10" rx="5" fill="#fff" opacity=".35"/>', x, 446);
        s += G(pill(c[0] + ' ' + c[1] + '%', { bg: '#fff', line: j === 0 ? '#FFC94D' : null, size: 24 }), x, 446 - h - 34);
      });
    } else {
      for (i = 0; i < 5; i++) s += G(token(i, { w: 92, h: 54, fs: 27, noShadow: true }), 156 + i * 102, 56);
      s += G('<g filter="url(#hsd)"><rect x="-232" y="-48" width="464" height="96" rx="22" fill="#FFFDF7" stroke="#EBDDBF" stroke-width="3"/></g><text y="14" text-anchor="middle" font-size="42" font-weight="800" fill="#3A2E24">비빔밥을 추천해요</text>', 360, 180);
      s += G(pill('완성 요리 = 답', { bg: '#FFE9D6', fg: '#A04A0E', line: '#F8DCC2', size: 22 }), 180, 262);
      s += G('<g fill="none" stroke="#EBD6B8" stroke-width="9" stroke-linecap="round" opacity=".8"><path d="M335 372c-12-14 12-24 0-38"/><path d="M365 372c-12-14 12-24 0-38"/><path d="M395 372c-12-14 12-24 0-38"/></g>', 0, 0);
      s += G(floorShadow(230, 20, 1), 360, 470);
      s += G('<ellipse cx="0" cy="22" rx="205" ry="44" fill="#E9DCC6"/><ellipse cx="0" cy="14" rx="205" ry="44" fill="#fff" stroke="#EADFCB" stroke-width="3"/><ellipse cx="0" cy="8" rx="132" ry="52" fill="#FFF1D2"/>' +
        '<ellipse cx="-62" cy="-6" rx="34" ry="14" fill="#F28C38"/><ellipse cx="62" cy="-6" rx="34" ry="14" fill="#6DBE7B"/><ellipse cx="-30" cy="26" rx="32" ry="13" fill="#9A6B4A"/><ellipse cx="38" cy="28" rx="32" ry="13" fill="#C98AE0"/><ellipse cx="-95" cy="22" rx="22" ry="10" fill="#F2E2A6"/><ellipse cx="96" cy="20" rx="22" ry="10" fill="#B5524A"/>' +
        '<ellipse cx="0" cy="6" rx="36" ry="17" fill="#fff"/><ellipse cx="0" cy="3" rx="17" ry="11" fill="#FFB52E"/>', 360, 410);
    }
    return s;
  }
  function fitView() {
    var w = stage.clientWidth || 640, h = stage.clientHeight || 360;
    svg.setAttribute('viewBox', (w / h < 1.5) ? '120 0 720 540' : '0 0 960 540');
  }
  var DEFS = '<defs>' +
    '<linearGradient id="gBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF9EE"/><stop offset="1" stop-color="#FFEBCF"/></linearGradient>' +
    '<radialGradient id="gSh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8A5A20" stop-opacity=".34"/><stop offset=".6" stop-color="#8A5A20" stop-opacity=".12"/><stop offset="1" stop-color="#8A5A20" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="gHalo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1568D2" stop-opacity=".3"/><stop offset=".55" stop-color="#1568D2" stop-opacity=".12"/><stop offset="1" stop-color="#1568D2" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="gStage" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<filter id="hsd" x="-15%" y="-25%" width="130%" height="170%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="6" result="b"/><feOffset in="b" dy="8" result="o"/><feFlood flood-color="#8A5A20" flood-opacity=".26"/><feComposite in2="o" operator="in" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    '</defs>';
  var BOKE = '<g opacity=".7"><circle cx="70" cy="90" r="46" fill="#FFE2A8"/><circle cx="880" cy="120" r="60" fill="#D9E8FF"/><circle cx="905" cy="430" r="40" fill="#FFD3DF"/><circle cx="48" cy="400" r="54" fill="#D6F0E0"/><circle cx="930" cy="250" r="26" fill="#E6DDFF"/><circle cx="30" cy="250" r="24" fill="#FFD3DF"/></g>';
  function draw2d(k) {
    fitView();
    svg.innerHTML = DEFS + '<rect width="960" height="540" fill="url(#gBg)"/>' + BOKE + '<ellipse cx="480" cy="330" rx="470" ry="300" fill="url(#gStage)"/><g transform="translate(120 0)">' + scene2d(k) + '</g>';
  }

  /* ---------- 걸음 바꾸기 ---------- */
  /* ---------- 휴대폰 4걸음: 관계 카드 ----------
     좁은 화면에서는 3D·2D 그림의 숫자가 너무 작아 읽히지 않는다.
     그래서 4걸음(관계 보기)일 때만 그림을 흐리게 깔고, 그 위에 「추천」이 많이 보는 조각을
     큰 글자 카드로 위에서부터 쌓는다. PC 는 how.css 에서 이 카드를 숨겨 예전 그대로다. */
  function buildAtt() {
    var box = document.getElementById('howAtt');
    if (!box) return;
    var rows = [];
    for (var i = 0; i < WORDS.length; i++) if (ATT[i] > 0) rows.push(i);
    rows.sort(function (a, b) { return ATT[b] - ATT[a]; });
    box.innerHTML = '<p class="how-att-h"><span class="how-att-me">' + WORDS[3] + '</span>이 많이 보는 조각 <small>(숫자는 예시)</small></p>' +
      '<ol class="how-att-list">' + rows.map(function (k, n) {
        var pct = Math.round(ATT[k] * 100);
        return '<li style="--w:' + (ATT[k] / ATT[rows[0]]).toFixed(3) + ';--n:' + n + '"><span class="how-att-w" style="background:' + TOK[k][0] + ';border-color:' + TOK[k][1] + '">' + WORDS[k] + '</span>' +
          '<span class="how-att-bar" aria-hidden="true"><i></i></span><b>' + pct + '%</b></li>';
      }).join('') + '</ol>';
  }
  buildAtt();

  function set(i) {
    i = Math.max(0, Math.min(STEPS.length - 1, i));
    cur = i;
    var S = STEPS[i];
    capEl.innerHTML = '<span class="how-cap-n" aria-hidden="true">' + (i + 1) + '</span><span class="how-cap-t"><b>' + (i + 1) + '/6 · ' + S.t + '</b><span class="how-cap-f">비유 · ' + S.f + '</span><span class="how-cap-p">' + S.c + '</span></span>';
    for (var d = 0; d < dots.length; d++) {
      dots[d].setAttribute('aria-current', d === i ? 'step' : 'false');
      dots[d].classList.toggle('is-done', d < i);
    }
    if (fill) fill.style.transform = 'scaleX(' + (i / (STEPS.length - 1)) + ')';
    stage.setAttribute('data-step', String(i));
    prev.disabled = i === 0; next.disabled = i === STEPS.length - 1;
    for (var j = 0; j < items.length; j++) items[j].classList.toggle('is-on', j === i);
    if (use3d && scene) scene.setStep(i, false); else draw2d(i);
  }

  /* ---------- 3D 불러오기 (되는 기기에서만) ---------- */
  function webgl() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
  }
  function weak() {
    return reduced || !webgl() || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || (navigator.deviceMemory && navigator.deviceMemory <= 2) || !window.IntersectionObserver;
  }
  function loadScript(src, ok, fail) {
    var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s);
  }
  function show(is3d) {
    use3d = is3d;
    canvas.hidden = !is3d; if (is3d) svg.setAttribute('hidden', ''); else svg.removeAttribute('hidden');
    mode.textContent = is3d ? '2D로 보기' : '3D로 보기';
    mode.setAttribute('aria-pressed', is3d ? 'true' : 'false');
    stage.classList.toggle('is-3d', is3d);
    if (is3d && scene) { scene.resize(); scene.setStep(cur, false); scene.start(); }
    else { if (scene) scene.stop(); draw2d(cur); }
  }
  function loadState(on, txt) {
    busy = on; loading.hidden = !on; stage.classList.toggle('is-loading', on);
    if (txt && loadTxt) loadTxt.textContent = txt;
  }
  function go3d() {
    if (scene) { show(true); return; }
    if (busy) return;
    loadState(true, '3D 그림을 준비하는 중… (1/3) 도구 불러오기');
    var fail = function () { loadState(false); show(false); };
    loadScript('../shared/vendor/three/three.min.js', function () {
      loadState(true, '3D 그림을 준비하는 중… (2/3) 그릴 것 만들기');
      loadScript('scene3d.js', function () {
        setTimeout(function () {
          try {
            scene = window.HowScene3D.create(canvas, { reduced: reduced });
            loadState(true, '3D 그림을 준비하는 중… (3/3) 마무리');
            show(true);
            requestAnimationFrame(function () { requestAnimationFrame(function () { loadState(false); stage.classList.add('is-ready'); }); });
            watchVisible();
          } catch (e) { loadState(false); scene = null; show(false); }
        }, 30);
      }, fail);
    }, fail);
  }
  function watchVisible() {
    new IntersectionObserver(function (es) { if (!use3d || !scene) return; if (es[0].isIntersecting && !document.hidden) scene.start(); else scene.stop(); }, { threshold: 0.05 }).observe(stage);
    document.addEventListener('visibilitychange', function () { if (!scene || !use3d) return; if (document.hidden) scene.stop(); else scene.start(); });
  }
  var rt = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (use3d && scene) scene.resize(); else fitView(); measure(); }, 80);
  });

  /* ---------- 단추 ---------- */
  prev.addEventListener('click', function () { set(cur - 1); });
  next.addEventListener('click', function () { set(cur + 1); });
  Array.prototype.forEach.call(dots, function (d, i) { d.addEventListener('click', function () { set(i); }); });
  mode.addEventListener('click', function () { if (busy) return; if (use3d) show(false); else go3d(); });
  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); set(cur + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); set(cur - 1); }
  });
  /* 아래 글을 스크롤하면 걸음이 따라온다 — 고정된 그림 바로 아래 띠를 지날 때 */
  var io = null;
  function measure() {
    if (!window.IntersectionObserver) return;
    if (io) io.disconnect();
    var top = Math.round(wrap ? wrap.getBoundingClientRect().bottom : 300) + 16, vh = window.innerHeight || 800;
    var bottom = Math.max(0, vh - top - 90);
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { var k = Array.prototype.indexOf.call(items, e.target); if (k >= 0 && k !== cur) set(k); } });
    }, { rootMargin: '-' + top + 'px 0px -' + bottom + 'px 0px' });
    Array.prototype.forEach.call(items, function (li) { io.observe(li); });
  }
  Array.prototype.forEach.call(items, function (li, i) { li.addEventListener('click', function () { if (cur !== i) set(i); }); });

  /* 시작: 약한 기기는 2D, 여유가 있으면 3D (?view=2d / ?view=3d 로 고정 가능) */
  var q = /[?&]view=(2d|3d)/.exec(location.search);
  set(0);
  measure();
  if (q && q[1] === '3d') { svg.setAttribute('hidden', ''); go3d(); }
  else if (q && q[1] === '2d') show(false);
  else if (weak()) show(false);
  else { svg.setAttribute('hidden', ''); go3d(); }
})();
