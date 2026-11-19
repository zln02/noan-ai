/* how-ai-answers/scene3d.js — 「AI는 어떻게 답을 만들까」 3D 장면 (three.js r128, 이 저장소에 들어 있음)
   three.min.js 를 먼저 읽은 뒤에만 불린다. 아주 단순하게 줄인 그림이며 실제 AI 내부 모양이 아니다.
   window.HowScene3D.create(canvas, { reduced }) → { setStep(i), start(), stop(), dispose(), resize() }
   · 조명: 반구광 + 따뜻한 키 라이트(부드러운 그림자) + 차가운 림 라이트
   · 카메라: 단계마다 부드럽게 이동(동작 줄이기면 바로 컷), 화면 비율에 맞춰 거리를 자동으로 맞춘다 */
(function () {
  'use strict';
  var WORDS = ['오늘', '급식', '메뉴', '추천', '해줘'];
  var BODY = [0xFFC9D9, 0xBFE8CF, 0xBFE8CF, 0xDCD0FC, 0xDCD0FC];
  var INK = '#2A2118';
  var FL = -2.4; /* 바닥 높이 */
  var ATT = [0.08, 0.42, 0.32, 0, 0.18]; /* '추천'이 각 조각에 두는 주목도(예시) */
  var CANDS = [['비빔밥', 40, 0xFFC94D], ['김밥', 30, 0x8FD9AE], ['국수', 20, 0xA9C4F7]];
  var FONT = '"Pretendard","Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
  var PX = 112; /* 글자판 해상도: 세계 길이 1 당 픽셀 */
  var HOVER = FL + 1.15;

  /* 의미 공간 자리(x, z): 급식·메뉴는 가깝고, 추천·해줘도 가깝다 */
  var SP = [[-3.6, -2.4], [1.8, -0.9], [3.3, 0.5], [-1.4, 0.5], [-3.0, 1.9]];
  var DISC_FOOD = [2.6, -0.2], DISC_ASK = [-2.2, 1.2];

  function rr(x, w, h, r) { x.beginPath(); x.moveTo(r, 0); x.arcTo(w, 0, w, h, r); x.arcTo(w, h, 0, h, r); x.arcTo(0, h, 0, 0, r); x.arcTo(0, 0, w, 0, r); x.closePath(); }

  /* 둥근 알약 모양 글자판 → { tex, aspect } */
  function pillTex(THREE, text, worldH, o) {
    o = o || {};
    var H = Math.round(worldH * PX), fs = Math.round(H * (o.fs || 0.52));
    var m = document.createElement('canvas').getContext('2d');
    m.font = '800 ' + fs + 'px ' + FONT;
    var padX = o.bg ? Math.round(H * 0.5) : Math.round(H * 0.12);
    var W = Math.round(m.measureText(text).width + padX * 2);
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d');
    if (o.bg) {
      if (o.shadow) { x.shadowColor = 'rgba(80,50,10,.22)'; x.shadowBlur = H * 0.1; x.shadowOffsetY = H * 0.04; }
      x.fillStyle = o.bg; rr(x, W, H - H * 0.08, (H - H * 0.08) / 2); x.fill();
      x.shadowColor = 'transparent';
      if (o.border) { x.lineWidth = Math.max(2, H * 0.04); x.strokeStyle = o.border; x.stroke(); }
    }
    x.fillStyle = o.fg || INK; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '800 ' + fs + 'px ' + FONT;
    x.fillText(text, W / 2, H / 2 - (o.bg ? H * 0.02 : 0) + H * 0.03);
    var t = new THREE.CanvasTexture(c);
    t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.anisotropy = 4;
    return { tex: t, aspect: W / H };
  }
  function glowTex(THREE, rgb, hard) {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(' + rgb + ',1)'); g.addColorStop(hard, 'rgba(' + rgb + ',.85)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    var t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; return t;
  }

  function create(canvas, opts) {
    var T = THREE, reduced = !!(opts && opts.reduced);
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(30, 16 / 9, 0.1, 80);

    /* ---- 조명: 하늘빛/바닥빛 반구광 + 따뜻한 키 + 연한 림 ---- */
    scene.add(new T.HemisphereLight(0xFFFFFF, 0xF3D9B4, 0.95));
    var key = new T.DirectionalLight(0xFFE7C2, 0.5); key.position.set(-4, 9, 7);
    key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0006;
    var sc = key.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 30;
    scene.add(key);
    var rimL = new T.DirectionalLight(0xCFE3FF, 0.28); rimL.position.set(6, 3, -6); scene.add(rimL);

    /* ---- 바닥: 그림자만 받는 투명판 + 부드러운 무대 빛 ---- */
    var floor = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({ opacity: 0.2, color: 0x8A5A20 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = FL; floor.receiveShadow = true; scene.add(floor);
    var stageGlow = new T.Mesh(new T.PlaneGeometry(26, 26), new T.MeshBasicMaterial({ map: glowTex(T, '255,255,255', 0.35), transparent: true, opacity: 0.75, depthWrite: false }));
    stageGlow.rotation.x = -Math.PI / 2; stageGlow.position.set(0, FL - 0.01, 0); scene.add(stageGlow);

    /* 멀리 떠 있는 부드러운 동그라미(보케) */
    var boke = [], bc = [0xFFE2A8, 0xD9E8FF, 0xFFD3DF, 0xD6F0E0, 0xE6DDFF];
    for (var b = 0; b < 12; b++) {
      var bm = new T.Mesh(new T.CircleGeometry(0.7 + (b % 4) * 0.4, 28), new T.MeshBasicMaterial({ color: bc[b % 5], transparent: true, opacity: 0.5, depthWrite: false }));
      bm.position.set(-14 + b * 2.5, -0.5 + ((b * 5) % 7) * 0.7, -9 - (b % 3) * 2); bm.userData.ph = b * 1.7; scene.add(bm); boke.push(bm);
    }

    /* ---- 도형 만들기 ---- */
    var gcache = {};
    function rbox(w, h, d, r) {
      var k = [w, h, d, r].join('_'); if (gcache[k]) return gcache[k];
      var bv = Math.min(0.07, d * 0.3), sw = w - 2 * bv, sh = h - 2 * bv, rad = Math.max(0.02, Math.min(r - bv, sw / 2, sh / 2));
      var s = new T.Shape(), x0 = -sw / 2, y0 = -sh / 2;
      s.moveTo(x0 + rad, y0); s.lineTo(x0 + sw - rad, y0); s.quadraticCurveTo(x0 + sw, y0, x0 + sw, y0 + rad);
      s.lineTo(x0 + sw, y0 + sh - rad); s.quadraticCurveTo(x0 + sw, y0 + sh, x0 + sw - rad, y0 + sh);
      s.lineTo(x0 + rad, y0 + sh); s.quadraticCurveTo(x0, y0 + sh, x0, y0 + sh - rad);
      s.lineTo(x0, y0 + rad); s.quadraticCurveTo(x0, y0, x0 + rad, y0);
      var g = new T.ExtrudeGeometry(s, { depth: Math.max(0.02, d - 2 * bv), bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 2, curveSegments: 5 });
      g.center(); gcache[k] = g; return g;
    }
    function lam(color) { return new T.MeshLambertMaterial({ color: color, transparent: true }); }

    var items = [];
    function mk(g, o) {
      var it = { g: g, mats: [], c: { x: 0, y: 0, z: 0, s: 0.001, o: 0 }, t: { x: 0, y: 0, z: 0, s: 1, o: 0 }, ph: Math.random() * 6, amp: 0.05, spin: 0 };
      for (var k in (o || {})) it[k] = o[k];
      g.traverse(function (n) {
        if (n.material) { it.mats.push({ m: n.material, a: n.userData.alpha == null ? 1 : n.userData.alpha }); n.material.transparent = true; }
      });
      g.scale.setScalar(0.001); g.visible = false; scene.add(g); items.push(it); return it;
    }
    function body(w, h, d, r, color) {
      var m = new T.Mesh(rbox(w, h, d, r), lam(color)); m.castShadow = true; return m;
    }
    function label(parent, text, worldH, o, x, y, z) {
      var p = pillTex(T, text, worldH, o);
      var m = new T.Mesh(new T.PlaneGeometry(worldH * p.aspect, worldH), new T.MeshBasicMaterial({ map: p.tex, transparent: true, depthWrite: false }));
      m.position.set(x || 0, y || 0, z || 0); m.renderOrder = 5; parent.add(m); return m;
    }
    function pillItem(text, worldH, o) { var g = new T.Group(); label(g, text, worldH, o, 0, 0, 0); return mk(g, { amp: 0.04 }); }

    /* 1. 주문서 + 화살표 + AI 주방 */
    var tkG = new T.Group();
    tkG.add(body(6.6, 1.55, 0.16, 0.22, 0xFFFDF7));
    var strip = body(6.6, 0.26, 0.2, 0.12, 0xFFD58A); strip.position.y = 0.64; tkG.add(strip);
    label(tkG, '오늘 급식 메뉴 추천해줘', 0.78, { fg: '#3A2E24', fs: 0.58 }, 0, -0.1, 0.14);
    var ticket = mk(tkG, { amp: 0.06 });
    var tagTicket = pillItem('주문서 · 내가 쓴 글', 0.62, { bg: '#FFE9A8', fg: '#6B4A00', shadow: 1 });
    var arG = new T.Group();
    var shaft = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 0.8, 14), lam(0x1568D2)); shaft.position.y = 0.3; shaft.castShadow = true; arG.add(shaft);
    var head = new T.Mesh(new T.ConeGeometry(0.36, 0.5, 16), lam(0x1568D2)); head.rotation.z = Math.PI; head.position.y = -0.3; head.castShadow = true; arG.add(head);
    var arrow = mk(arG, { amp: 0.1 });
    var aiG = new T.Group();
    aiG.add(body(3.4, 1.15, 0.9, 0.34, 0xDCEBFF));
    label(aiG, 'AI 주방', 0.6, { fg: '#0B4FA8', fs: 0.6 }, 0, 0, 0.5);
    var aiBox = mk(aiG, { amp: 0.03 });

    /* 2. 토큰 + 도마 */
    var boardG = new T.Group();
    var bd = body(11.8, 0.34, 3.0, 0.3, 0xE9C58F); bd.castShadow = false; bd.receiveShadow = true; boardG.add(bd);
    var board = mk(boardG, { amp: 0 });
    var toks = WORDS.map(function (w, i) {
      var g = new T.Group(); g.add(body(1.9, 1.05, 0.38, 0.3, BODY[i]));
      label(g, w, 0.62, { fg: INK, fs: 0.62 }, 0, 0, 0.22);
      return mk(g, { amp: 0.05, tok: true });
    });
    var askTok = (function () { /* 다음 말 자리: 물음표 */
      var g = new T.Group(); g.add(body(1.9, 1.05, 0.38, 0.3, 0xFFF1BD));
      label(g, '?', 0.7, { fg: '#8A5A00', fs: 0.78 }, 0, 0, 0.22); return mk(g, { amp: 0.06 });
    })();
    var tagTok = pillItem('작은 조각 = 토큰', 0.62, { bg: '#E9F7EF', fg: '#17623A', border: '#C9EBD6', shadow: 1 });

    /* 3. 의미 공간: 바닥에 깔린 묶음 */
    function cluster(col, rgb, r, text, tc) {
      var g = new T.Group();
      var dm = new T.Mesh(new T.CircleGeometry(r, 48), new T.MeshBasicMaterial({ map: glowTex(T, rgb, 0.86), transparent: true, depthWrite: false })); dm.rotation.x = -Math.PI / 2; dm.userData.alpha = 0.9; g.add(dm);
      var ring = new T.Mesh(new T.RingGeometry(r * 0.93, r * 0.97, 64), new T.MeshBasicMaterial({ color: col, transparent: true, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; ring.userData.alpha = 0.9; g.add(ring);
      label(g, text, 0.6, { bg: '#FFFFFF', fg: tc, shadow: 1 }, 0, 0.45, r + 0.45);
      return mk(g, { amp: 0 });
    }
    var cFood = cluster(0x7CCB9C, '178,226,200', 2.5, '음식 이야기', '#17623A');
    var cAsk = cluster(0xA68CF0, '208,194,250', 2.3, '부탁하는 말', '#5B3DB8');
    var haloG = new T.Group();
    var hm = new T.Mesh(new T.CircleGeometry(1.5, 40), new T.MeshBasicMaterial({ map: glowTex(T, '21,104,210', 0.3), transparent: true, depthWrite: false })); hm.rotation.x = -Math.PI / 2; hm.userData.alpha = 0.6; haloG.add(hm);
    var halo = mk(haloG, { amp: 0 });

    /* 4. 관계선 + 퍼센트 */
    var links = ATT.map(function (a, i) {
      var g = new T.Group();
      var cyl = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 10), lam(0x1568D2)); cyl.rotation.x = Math.PI / 2; cyl.userData.alpha = 0.9; cyl.castShadow = true; g.add(cyl);
      var pg = a > 0 ? new T.Group() : null, pit = null;
      if (pg) { label(pg, Math.round(a * 100) + '%', 0.66, { bg: '#1568D2', fg: '#FFFFFF', shadow: 1 }, 0, 0, 0); pit = mk(pg, { amp: 0.03 }); }
      return { w: a, i: i, cyl: cyl, pit: pit, it: mk(g, { amp: 0, link: true }) };
    });
    var tagAtt = pillItem('굵을수록 더 많이 봐요 (예시)', 0.6, { bg: '#EAF3FF', fg: '#0B4FA8', border: '#CFE2FB', shadow: 1 });

    /* 5. 다음 말 후보 막대 */
    var bars = CANDS.map(function (cd, i) {
      var g = new T.Group();
      var bar = body(1.9, 1, 1.4, 0.3, cd[2]); g.add(bar);
      var tp = label(g, cd[0] + ' ' + cd[1] + '%', 0.62, { bg: '#FFFFFF', fg: INK, border: i === 0 ? '#FFC94D' : null, shadow: 1 }, 0, 0, 0.55);
      return { it: mk(g, { amp: 0 }), bar: bar, tp: tp, h: cd[1] / 100 * 7.5, cur: 0.01 };
    });

    /* 6. 접시 + 비빔밥 */
    var plG = new T.Group();
    var plate = new T.Mesh(new T.CylinderGeometry(2.3, 2.0, 0.16, 40), lam(0xFFFFFF)); plate.castShadow = true; plG.add(plate);
    var rimM = new T.Mesh(new T.TorusGeometry(2.15, 0.05, 8, 48), lam(0xE9DCC6)); rimM.rotation.x = Math.PI / 2; rimM.position.y = 0.09; plG.add(rimM);
    var rice = new T.Mesh(new T.SphereGeometry(1.55, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), lam(0xFFF4DA)); rice.scale.y = 0.42; rice.position.y = 0.08; rice.castShadow = true; plG.add(rice);
    [0xF28C38, 0x6DBE7B, 0xF2E2A6, 0x9A6B4A, 0xC98AE0, 0xB5524A].forEach(function (col, i) {
      var a = i / 6 * Math.PI * 2, s = new T.Mesh(new T.SphereGeometry(0.5, 16, 10), lam(col));
      s.scale.set(1, 0.34, 0.8); s.position.set(Math.cos(a) * 0.95, 0.5, Math.sin(a) * 0.95); s.rotation.y = -a; s.castShadow = true; plG.add(s);
    });
    var eggW = new T.Mesh(new T.SphereGeometry(0.5, 18, 10), lam(0xFFFFFF)); eggW.scale.set(1, 0.3, 1); eggW.position.y = 0.66; eggW.castShadow = true; plG.add(eggW);
    var yolk = new T.Mesh(new T.SphereGeometry(0.26, 16, 10), lam(0xFFB52E)); yolk.scale.y = 0.8; yolk.position.y = 0.76; plG.add(yolk);
    var dish = mk(plG, { amp: 0, spin: 0.22 });
    var ansG = new T.Group();
    ansG.add(body(6.4, 1.4, 0.18, 0.3, 0xFFFDF7));
    label(ansG, '비빔밥을 추천해요', 0.78, { fg: '#3A2E24', fs: 0.58 }, 0, 0, 0.16);
    var ans = mk(ansG, { amp: 0.05 });
    var tagAns = pillItem('완성 요리 = 답', 0.6, { bg: '#FFE9D6', fg: '#A04A0E', border: '#F8DCC2', shadow: 1 });
    var steam = [];
    for (var sI = 0; sI < 3; sI++) {
      var sm = new T.Mesh(new T.SphereGeometry(0.2 + sI * 0.04, 12, 8), new T.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0, depthWrite: false }));
      sm.userData.i = sI; scene.add(sm); steam.push(sm);
    }

    /* ---- 카메라 자세: 바라보는 곳, 올려다보는 각, 가로 반폭·세로 반높이(세계 길이) ---- */
    var step = 0, clock = 0, running = false, raf = 0, last = 0, aspect = 16 / 9;
    var VIEWS = [
      { lx: 0, ly: -0.1, lz: 0, el: 12, az: 0, hw: 4.2, hh: 3.3 },
      { lx: 0, ly: -0.5, lz: 0, el: 20, az: 0, hw: 6.0, hh: 3.3 },
      { lx: 0, ly: -1.4, lz: 0.4, el: 36, az: 0, hw: 5.5, hh: 3.6 },
      { lx: -0.2, ly: -1.4, lz: 0.4, el: 36, az: 0, hw: 5.5, hh: 3.6 },
      { lx: 0, ly: -0.1, lz: 0, el: 13, az: 0, hw: 5.2, hh: 3.7 },
      { lx: 0, ly: -0.1, lz: 0.3, el: 22, az: 0, hw: 4.5, hh: 3.9 }
    ];
    function copyV(v) { return { lx: v.lx, ly: v.ly, lz: v.lz, el: v.el, az: v.az, hw: v.hw, hh: v.hh }; }
    var vT = VIEWS[0], vC = copyV(VIEWS[0]);
    if (!reduced) { vC.el += 12; vC.hw *= 1.2; vC.hh *= 1.2; vC.az = 0.22; } /* 처음 한 번 부드럽게 다가오는 시작 */

    function T3(it, p, s, o) { it.t.x = p[0]; it.t.y = p[1]; it.t.z = p[2]; it.t.s = s; it.t.o = o; }
    function row(y, scale, gap, x0, withQ) {
      for (var i = 0; i < 5; i++) T3(toks[i], [x0 + i * gap, y, 0], scale, 1);
      if (withQ) T3(askTok, [x0 + 5 * gap, y, 0], scale, 1);
    }
    function linkEnds(i) { return { a: [SP[3][0], HOVER, SP[3][1]], b: [SP[i][0], HOVER, SP[i][1]] }; }

    function setStep(n, instant) {
      step = n;
      items.forEach(function (it) { it.t.o = 0; if (!it.link) it.t.s = 0.6; });
      vT = VIEWS[n];
      if (n === 0) {
        T3(ticket, [0, 1.3, 0], 1, 1); T3(tagTicket, [-2.1, 2.55, 0.3], 1, 1);
        T3(arrow, [0, -0.35, 0], 1, 1); T3(aiBox, [0, -1.72, 0], 1, 1);
      } else if (n === 1) {
        T3(board, [0, FL + 0.17, 0], 1, 1);
        row(FL + 0.34 + 0.55, 1, 2.2, -4.4, false);
        T3(tagTok, [0, 0.5, 0.2], 1, 1);
        toks.forEach(function (o) { if (o.c.o < 0.05) { o.c.x = 0; o.c.y = 1.0; o.c.z = 0.3; } });
      } else if (n === 2) {
        T3(cFood, [DISC_FOOD[0], FL + 0.01, DISC_FOOD[1]], 1, 1); T3(cAsk, [DISC_ASK[0], FL + 0.02, DISC_ASK[1]], 1, 1);
        toks.forEach(function (o, i) { T3(o, [SP[i][0], HOVER + (i % 2) * 0.25, SP[i][1]], 1, 1); });
      } else if (n === 3) {
        T3(cFood, [DISC_FOOD[0], FL + 0.01, DISC_FOOD[1]], 1, 0.4); T3(cAsk, [DISC_ASK[0], FL + 0.02, DISC_ASK[1]], 1, 0.4);
        toks.forEach(function (o, i) { T3(o, [SP[i][0], HOVER, SP[i][1]], 0.84, i === 3 ? 1 : 0.72); });
        T3(halo, [SP[3][0], FL + 0.03, SP[3][1]], 1, 1);
        links.forEach(function (l) {
          if (l.w <= 0) return;
          T3(l.it, [0, 0, 0], 1, 0.4 + l.w);
          var e = linkEnds(l.i); var tt = [0.58, 0.45, 0.72, 0, 0.55][l.i]; T3(l.pit, [e.a[0] + (e.b[0] - e.a[0]) * tt, HOVER + 1.3, e.a[2] + (e.b[2] - e.a[2]) * tt], 1, 1);
        });
        T3(tagAtt, [0, 2.3, -0.5], 1, 1);
      } else if (n === 4) {
        row(1.95, 0.84, 1.62, -4.05, true);
        bars.forEach(function (b, i) { T3(b.it, [(i - 1) * 3.2, FL, 0.2], 1, 1); });
      } else {
        row(2.75, 0.74, 1.52, -3.04, false);
        T3(dish, [0, FL + 0.1, 0.5], 1, 1); T3(ans, [0, 0.55, 0.4], 1, 1); T3(tagAns, [-2.0, 1.6, 0.7], 1, 1);
      }
      if (instant || reduced) { items.forEach(snapItem); }
      if (reduced) { vC = copyV(vT); renderOnce(); }
    }
    function snapItem(it) { it.c.x = it.t.x; it.c.y = it.t.y; it.c.z = it.t.z; it.c.s = it.t.s; it.c.o = it.t.o; applyItem(it, 0); }

    /* ---- 갱신 ---- */
    function linkPlace() {
      links.forEach(function (l) {
        var e = linkEnds(l.i), a = e.a, b = e.b;
        var dx = b[0] - a[0], dz = b[2] - a[2], len = Math.sqrt(dx * dx + dz * dz);
        var g = l.it.g; g.position.set((a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2);
        if (len > 0.01) g.lookAt(b[0], b[1], b[2]);
        l.cyl.scale.set(0.035 + l.w * 0.2, Math.max(0.01, len - 0.9), 0.035 + l.w * 0.2);
      });
    }
    function applyItem(it, dt) {
      var g = it.g, vis = it.c.o > 0.02 && it.c.s > 0.02;
      g.visible = vis; if (!vis) return;
      if (!it.link) {
        var fy = reduced ? 0 : Math.sin(clock * 1.15 + it.ph) * it.amp;
        g.position.set(it.c.x, it.c.y + fy, it.c.z);
        if (!reduced) { if (it.spin) g.rotation.y += it.spin * dt; else if (it.tok && (step === 2 || step === 3)) g.rotation.y = Math.sin(clock * 0.7 + it.ph) * 0.12; else g.rotation.y *= 0.9; }
      }
      g.scale.setScalar(Math.max(0.001, it.c.s));
      var op = Math.min(1, it.c.o);
      for (var i = 0; i < it.mats.length; i++) it.mats[i].m.opacity = op * it.mats[i].a;
    }
    function updateCam() {
      var tanH = Math.tan(cam.fov * Math.PI / 360);
      var d = Math.max(vC.hh / tanH, vC.hw / (aspect * tanH));
      var el = vC.el * Math.PI / 180, az = vC.az + (reduced ? 0 : Math.sin(clock * 0.22) * 0.03);
      cam.position.set(vC.lx + Math.sin(az) * Math.cos(el) * d, vC.ly + Math.sin(el) * d, vC.lz + Math.cos(az) * Math.cos(el) * d);
      cam.lookAt(vC.lx, vC.ly, vC.lz);
    }
    function tick(dt) {
      var k = 1 - Math.exp(-dt * 5.2), kc = 1 - Math.exp(-dt * 3.0), i;
      for (i = 0; i < items.length; i++) {
        var it = items[i];
        it.c.s += (it.t.s - it.c.s) * k; it.c.o += (it.t.o - it.c.o) * k;
        if (!it.link) { it.c.x += (it.t.x - it.c.x) * k; it.c.y += (it.t.y - it.c.y) * k; it.c.z += (it.t.z - it.c.z) * k; }
        applyItem(it, dt);
      }
      bars.forEach(function (b) {
        var h = step === 4 ? b.h : 0.01; b.cur += (h - b.cur) * (1 - Math.exp(-dt * 4));
        var c = Math.max(0.01, b.cur); b.bar.scale.y = c; b.bar.position.y = c / 2; b.tp.position.y = c + 0.6;
      });
      for (var kk in vC) vC[kk] += (vT[kk] - vC[kk]) * kc;
      steam.forEach(function (s) {
        var ph = (clock * 0.35 + s.userData.i * 0.33) % 1;
        s.position.set((s.userData.i - 1) * 0.6 + Math.sin(clock + s.userData.i) * 0.1, FL + 1.2 + ph * 1.5, 0.5);
        s.material.opacity = step === 5 ? 0.35 * Math.sin(ph * Math.PI) : 0;
      });
      boke.forEach(function (m) { m.position.y += Math.sin(clock * 0.4 + m.userData.ph) * 0.0025; });
    }
    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
      tick(dt); updateCam(); renderer.render(scene, cam);
    }
    function renderOnce() {
      /* 동작 줄이기: 막대 높이도 바로 맞춘다 */
      bars.forEach(function (b) { b.cur = step === 4 ? b.h : 0.01; });
      tick(0.0001); items.forEach(snapItem); bars.forEach(function (b) { b.bar.scale.y = b.cur; b.bar.position.y = b.cur / 2; b.tp.position.y = b.cur + 0.6; });
      vC = copyV(vT); updateCam(); renderer.render(scene, cam);
    }
    function resize() {
      var w = canvas.clientWidth || 640, h = canvas.clientHeight || Math.round(w * 9 / 16);
      renderer.setSize(w, h, false); aspect = w / h; cam.aspect = aspect; cam.updateProjectionMatrix();
      if (!running && reduced) renderOnce();
    }
    linkPlace(); setStep(0, false); resize();
    if (reduced) renderOnce();
    return {
      setStep: setStep, resize: resize,
      start: function () { if (running) return; if (reduced) { renderOnce(); return; } running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
      stop: function () { running = false; cancelAnimationFrame(raf); },
      dispose: function () { running = false; cancelAnimationFrame(raf); renderer.dispose(); }
    };
  }
  window.HowScene3D = { create: create };
})();
