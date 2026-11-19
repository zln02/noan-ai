/* how-ai-answers/how.js — 「AI는 어떻게 답을 만들까」 여섯 걸음 보기
   · 3D(three.js, shared/vendor/three)가 되는 컴퓨터에서는 3D, 약한 기기·동작 줄이기·WebGL 없음이면 2D 그림(SVG)
   · 앞뒤 단추 · 번호 단추 · 키보드 ←/→ · 아래 글을 스크롤해도 걸음이 따라 바뀐다
   · 아주 단순하게 줄인 그림이다. 실제 AI 내부의 모양이 아니다. */
(function () {
  'use strict';
  var STEPS = [
    { t: '입력', f: '주문서', c: '내가 쓴 글이 AI에 들어와요' },
    { t: '토큰으로 쪼개기', f: '재료 손질', c: '글을 작은 조각으로 나눠요' },
    { t: '의미 공간에 놓기', f: '재료 배치', c: '뜻이 비슷한 조각은 가까이 놓여요' },
    { t: '관계 보기 (어텐션)', f: '어울림 판단', c: '어느 조각이 어느 조각과 이어지는지 따져요' },
    { t: '다음 말 하나씩 예측', f: '한 숟갈씩', c: '가장 어울리는 다음 말을 하나 골라요 (숫자는 예시)' },
    { t: '답', f: '완성 요리', c: '이어 붙인 말이 답이 돼요' }
  ];
  var WORDS = ['오늘', '급식', '메뉴', '추천', '해줘'];
  var POS2 = [[150, 150], [520, 250], [640, 300], [330, 330], [210, 380]]; /* 2D 의미 공간 자리 */
  var ATT = [0.08, 0.42, 0.32, 0, 0.18];
  var CANDS = [['비빔밥', 40, '#FFC94D'], ['김밥', 30, '#7FD1A0'], ['국수', 20, '#9CB8F2']];
  var COL = ['#FFD9E3', '#D8F2E2', '#D8F2E2', '#E9E0FF', '#E9E0FF'];

  var stage = document.getElementById('howStage');
  if (!stage) return;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var capEl = document.getElementById('howCap');
  var dots = document.querySelectorAll('.how-dot');
  var prev = document.getElementById('howPrev'), next = document.getElementById('howNext'), mode = document.getElementById('howMode');
  var items = document.querySelectorAll('.flow > li');
  var svg = document.getElementById('how2d'), canvas = document.getElementById('how3d'), loading = document.getElementById('howLoading');
  var cur = 0, scene = null, use3d = false, started = false, userSet = false;

  /* ---------- 2D 그림 ---------- */
  function chip(x, y, i, s, op) {
    s = s || 1;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" opacity="' + (op == null ? 1 : op) + '"><rect x="-62" y="-32" width="124" height="64" rx="16" fill="' + COL[i] + '" stroke="#E3D6C4" stroke-width="3"/><text y="9" text-anchor="middle" font-size="28" font-weight="800" fill="#3A2E24">' + WORDS[i] + '</text></g>';
  }
  function txt(s, x, y, size, fill) { return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + (size || 24) + '" font-weight="800" fill="' + (fill || '#5B4A36') + '">' + s + '</text>'; }
  function scene2d(n) {
    var s = '';
    if (n === 0) {
      s += '<rect x="250" y="190" width="460" height="100" rx="18" fill="#FFFDF7" stroke="#D9C9A8" stroke-width="4"/><circle cx="480" cy="190" r="9" fill="#E26A6A"/>' + txt('오늘 급식 메뉴 추천해줘', 480, 252, 36);
      s += '<path d="M480 300v52" stroke="#1568D2" stroke-width="6" stroke-linecap="round"/><path d="M462 340l18 22 18-22" fill="none" stroke="#1568D2" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' + '<rect x="380" y="372" width="200" height="56" rx="28" fill="#E9F2FF" stroke="#B9D5F8" stroke-width="3"/>' + txt('AI', 480, 410, 28, '#1568D2');
    } else if (n === 1) {
      for (var i = 0; i < 5; i++) s += chip(130 + i * 175, 260, i, 1);
      s += txt('작은 조각(토큰)으로 나눠요', 480, 370, 26, '#7A6A55');
    } else if (n === 2) {
      s += '<ellipse cx="580" cy="280" rx="120" ry="70" fill="#D8F2E2" opacity=".55" stroke="#9AD3B0" stroke-width="3" stroke-dasharray="8 8"/><ellipse cx="270" cy="355" rx="130" ry="72" fill="#E9E0FF" opacity=".55" stroke="#C9B6F8" stroke-width="3" stroke-dasharray="8 8"/>';
      for (var j = 0; j < 5; j++) s += chip(POS2[j][0], POS2[j][1], j, .85);
      s += txt('비슷한 뜻끼리 가까이', 480, 440, 24, '#7A6A55');
    } else if (n === 3) {
      for (var k = 0; k < 5; k++) if (ATT[k] > 0) s += '<line x1="' + POS2[3][0] + '" y1="' + POS2[3][1] + '" x2="' + POS2[k][0] + '" y2="' + POS2[k][1] + '" stroke="#1568D2" stroke-opacity="' + (.3 + ATT[k]) + '" stroke-width="' + (3 + ATT[k] * 26) + '" stroke-linecap="round"/>';
      for (var m = 0; m < 5; m++) s += chip(POS2[m][0], POS2[m][1], m, .85, m === 3 ? 1 : .6);
      s += txt('굵은 선 = 더 많이 보는 조각 (예시)', 480, 440, 24, '#7A6A55');
    } else if (n === 4) {
      for (var a = 0; a < 5; a++) s += chip(150 + a * 160, 90, a, .62);
      CANDS.forEach(function (c, i) {
        var h = c[1] * 3.4, x = 250 + i * 190;
        s += '<rect x="' + (x - 50) + '" y="' + (400 - h) + '" width="100" height="' + h + '" rx="10" fill="' + c[2] + '"/>' + txt(c[0] + ' ' + c[1] + '%', x, 432, 22);
      });
      s += '<path d="M250 170v60" stroke="#1568D2" stroke-width="5" stroke-dasharray="3 9" stroke-linecap="round"/>' + txt('다음 말 후보 (숫자는 예시)', 480, 160, 22, '#7A6A55');
    } else {
      for (var b = 0; b < 5; b++) s += chip(120 + b * 140, 90, b, .62);
      s += '<ellipse cx="480" cy="410" rx="170" ry="34" fill="#fff" stroke="#E3D6C4" stroke-width="4"/><path d="M400 400q8-70 80-70t80 70z" fill="#FFC94D"/>';
      s += '<rect x="290" y="200" width="380" height="76" rx="16" fill="#FFFDF7" stroke="#D9C9A8" stroke-width="4"/>' + txt('비빔밥을 추천해요', 480, 250, 34);
    }
    return s;
  }
  function draw2d(n) {
    svg.innerHTML = '<rect width="960" height="540" fill="#FFF4E2"/><rect y="440" width="960" height="100" fill="#F3DFC1"/><g class="how-g" transform="translate(48 -22) scale(.9)">' + scene2d(n) + '</g>';
  }

  /* ---------- 걸음 바꾸기 ---------- */
  function set(n, fromScroll) {
    n = Math.max(0, Math.min(STEPS.length - 1, n));
    cur = n;
    capEl.innerHTML = '<b>' + (n + 1) + '/6 · ' + STEPS[n].t + '</b><span>비유: ' + STEPS[n].f + ' — ' + STEPS[n].c + '</span>';
    for (var i = 0; i < dots.length; i++) { dots[i].setAttribute('aria-current', i === n ? 'step' : 'false'); }
    prev.disabled = n === 0; next.disabled = n === STEPS.length - 1;
    for (var j = 0; j < items.length; j++) items[j].classList.toggle('is-on', j === n);
    if (use3d && scene) scene.setStep(n); else draw2d(n);
    if (!fromScroll) {
      var li = items[n];
      if (li && stage.getBoundingClientRect().top < 0) li.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }
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
    mode.textContent = is3d ? '2D 그림으로 보기' : '3D로 보기';
    mode.setAttribute('aria-pressed', is3d ? 'true' : 'false');
    stage.classList.toggle('is-3d', is3d);
    if (is3d && scene) { scene.resize(); scene.setStep(cur); scene.start(); }
    else { if (scene) scene.stop(); draw2d(cur); }
  }
  function go3d(auto) {
    if (scene) { show(true); return; }
    loading.hidden = false;
    loadScript('../shared/vendor/three/three.min.js', function () {
      loadScript('scene3d.js', function () {
        try {
          scene = window.HowScene3D.create(canvas);
          loading.hidden = true; show(true);
          if (!started && !reduced) { started = true; scene.intro(); stage.classList.add('is-dolly'); setTimeout(function () { stage.classList.remove('is-dolly'); }, 2200); }
          watchVisible();
        } catch (e) { loading.hidden = true; show(false); }
      }, function () { loading.hidden = true; show(false); });
    }, function () { loading.hidden = true; show(false); });
  }
  function watchVisible() {
    new IntersectionObserver(function (es) { if (!use3d || !scene) return; if (es[0].isIntersecting && !document.hidden) scene.start(); else scene.stop(); }, { threshold: .05 }).observe(stage);
    document.addEventListener('visibilitychange', function () { if (!scene || !use3d) return; if (document.hidden) scene.stop(); else scene.start(); });
    window.addEventListener('resize', function () { if (scene) scene.resize(); });
  }

  /* ---------- 단추 ---------- */
  prev.addEventListener('click', function () { set(cur - 1); });
  next.addEventListener('click', function () { set(cur + 1); });
  Array.prototype.forEach.call(dots, function (d, i) { d.addEventListener('click', function () { set(i); }); });
  mode.addEventListener('click', function () { userSet = true; if (use3d) show(false); else go3d(false); });
  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); set(cur + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); set(cur - 1); }
  });
  /* 아래 글을 스크롤하면 걸음이 따라온다 */
  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { var n = Array.prototype.indexOf.call(items, e.target); if (n >= 0 && n !== cur) set(n, true); } });
    }, { rootMargin: '-45% 0px -45% 0px' });
    Array.prototype.forEach.call(items, function (li) { io.observe(li); });
  }
  Array.prototype.forEach.call(items, function (li, i) { li.addEventListener('click', function () { if (cur !== i) set(i, true); }); });

  /* 시작: 2D 를 먼저 그려 두고, 여유가 있는 기기에서만 3D 로 올린다 */
  var q = /[?&]view=(2d|3d)/.exec(location.search);
  set(0, true);
  if (q && q[1] === '3d') go3d(true);
  else if (q && q[1] === '2d') show(false);
  else if (weak()) show(false);
  else { show(false); go3d(true); }
})();
