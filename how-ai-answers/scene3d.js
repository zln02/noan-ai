/* how-ai-answers/scene3d.js — 「AI는 어떻게 답을 만들까」 3D 장면 (three.js r128, 이 저장소에 들어 있음)
   three.min.js 를 먼저 읽은 뒤에만 불린다. 아주 단순하게 줄인 그림이며 실제 AI 내부 모양이 아니다.
   window.HowScene3D.create(canvas, 단계목록, 끝났을때콜백) → { setStep(i), start(), stop(), dispose(), resize() } */
(function () {
  'use strict';
  var WORDS = ['오늘', '급식', '메뉴', '추천', '해줘'];
  var COLORS = [0xFFB8CC, 0xA9DCC0, 0xA9DCC0, 0xC9B6F8, 0xC9B6F8];
  /* 의미 공간에서의 자리: 급식·메뉴는 가깝고, 추천·해줘도 가깝다 */
  var SPACE = [[-3.2, 1.4, -1.2], [1.4, 0.7, 1.4], [2.6, 0.1, 0.6], [-0.8, -0.9, -0.8], [-1.9, -1.2, 0.4]];
  var ROW = function (i) { return [(i - 2) * 1.9, 0.25, 0]; };
  var ATT = [0.08, 0.42, 0.32, 0, 0.18]; /* '추천'이 각 조각에 두는 주목도(예시) */
  var CANDS = [['비빔밥', 0.4, 0xFFC94D], ['김밥', 0.3, 0x7FD1A0], ['국수', 0.2, 0x9CB8F2]];

  function canvasTex(text, w, h, bg, fg, fs) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d');
    if (bg) { x.fillStyle = bg; x.beginPath(); x.moveTo(24, 0); x.arcTo(w, 0, w, h, 24); x.arcTo(w, h, 0, h, 24); x.arcTo(0, h, 0, 0, 24); x.arcTo(0, 0, w, 0, 24); x.fill(); }
    x.fillStyle = fg || '#3A2E24'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '800 ' + (fs || 56) + 'px "Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
    x.fillText(text, w / 2, h / 2 + 3);
    var t = new THREE.CanvasTexture(c); t.anisotropy = 2; return t;
  }

  function create(canvas, onReady) {
    var T = THREE;
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0xFFF4E2, 1);
    var scene = new T.Scene();
    scene.fog = new T.Fog(0xFFF4E2, 18, 40);
    var cam = new T.PerspectiveCamera(32, 16 / 9, 0.1, 80);
    scene.add(new T.AmbientLight(0xffffff, 0.62));
    var dl = new T.DirectionalLight(0xffffff, 0.45); dl.position.set(4, 8, 6); scene.add(dl);

    var floor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshBasicMaterial({ color: 0xEBD2AA }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -4.6; scene.add(floor);
    /* 멀리 있는 배경 동그라미들 — 돌리 줌에서 배경이 늘어나 보이게 한다 */
    var bg = new T.Group(); scene.add(bg);
    for (var b = 0; b < 14; b++) {
      var m = new T.Mesh(new T.CircleGeometry(0.6 + (b % 3) * 0.35, 20), new T.MeshBasicMaterial({ color: [0xFFE9B5, 0xE0ECFF, 0xFFD9E3][b % 3], transparent: true, opacity: .8 }));
      m.position.set(-14 + b * 2.2, 1 + ((b * 7) % 5) - 1.5, -9 - (b % 4) * 1.5); bg.add(m);
    }

    var objs = [];
    function mk(group, mats) { var o = { g: group, mats: mats, c: { x: 0, y: 0, z: 0, s: 0.001, o: 0 }, t: { x: 0, y: 0, z: 0, s: 0.001, o: 0 } }; group.scale.setScalar(.001); scene.add(group); objs.push(o); return o; }
    function setT(o, p, s, op) { o.t.x = p[0]; o.t.y = p[1]; o.t.z = p[2]; o.t.s = s; o.t.o = op; }

    /* 주문서 */
    var tkMat = new T.MeshBasicMaterial({ map: canvasTex('오늘 급식 메뉴 추천해줘', 768, 160, '#FFFDF7', '#5B4A36', 62), transparent: true });
    var ticketG = new T.Group(); ticketG.add(new T.Mesh(new T.PlaneGeometry(6, 1.25), tkMat));
    var ticket = mk(ticketG, [tkMat]);

    /* 토큰 조각 */
    var toks = WORDS.map(function (w, i) {
      var g = new T.Group();
      var bm = new T.MeshLambertMaterial({ color: COLORS[i], transparent: true });
      g.add(new T.Mesh(new T.BoxGeometry(1.6, 0.85, 0.3), bm));
      var tm = new T.MeshBasicMaterial({ map: canvasTex(w, 256, 128, null, '#3A2E24', 76), transparent: true });
      var tp = new T.Mesh(new T.PlaneGeometry(1.5, 0.75), tm); tp.position.z = 0.16; g.add(tp);
      return mk(g, [bm, tm]);
    });

    /* 관계선 (가는 막대) */
    var links = ATT.map(function (a, i) {
      var lm = new T.MeshBasicMaterial({ color: 0x1568D2, transparent: true });
      var g = new T.Group(); var cyl = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8), lm); cyl.rotation.x = Math.PI / 2; g.add(cyl);
      return { o: mk(g, [lm]), w: a, i: i, cyl: cyl };
    });

    /* 다음 말 후보 막대 */
    var bars = CANDS.map(function (cd, i) {
      var g = new T.Group();
      var bm = new T.MeshLambertMaterial({ color: cd[2], transparent: true });
      var bar = new T.Mesh(new T.BoxGeometry(1.2, 1, 0.9), bm); bar.position.y = 0.5; g.add(bar);
      var tm = new T.MeshBasicMaterial({ map: canvasTex(cd[0] + ' ' + Math.round(cd[1] * 100) + '%', 384, 112, null, '#3A2E24', 62), transparent: true });
      var tp = new T.Mesh(new T.PlaneGeometry(2.2, 0.64), tm); tp.position.set(0, 0, 0.7); g.add(tp);
      return { o: mk(g, [bm, tm]), bar: bar, tp: tp, v: cd[1], h: cd[1] * 4.5 };
    });

    /* 접시와 답 */
    var plG = new T.Group();
    var pm = new T.MeshLambertMaterial({ color: 0xffffff, transparent: true });
    var pl = new T.Mesh(new T.CylinderGeometry(2.1, 2.3, 0.18, 32), pm); plG.add(pl);
    var fm = new T.MeshLambertMaterial({ color: 0xFFC94D, transparent: true });
    var food = new T.Mesh(new T.SphereGeometry(1.1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), fm); food.position.y = 0.1; plG.add(food);
    var plate = mk(plG, [pm, fm]);
    var ansM = new T.MeshBasicMaterial({ map: canvasTex('비빔밥을 추천해요', 768, 160, '#FFFDF7', '#5B4A36', 66), transparent: true });
    var ansG = new T.Group(); ansG.add(new T.Mesh(new T.PlaneGeometry(5.4, 1.12), ansM));
    var ans = mk(ansG, [ansM]);


    /* 의미 공간 설명: 비슷한 뜻끼리 묶인 둥근 자리와 이름표 */
    function disc(col, r, lbl, pos, lp) {
      var g = new T.Group();
      var dm = new T.MeshBasicMaterial({ color: col, transparent: true });
      var d = new T.Mesh(new T.CircleGeometry(r, 40), dm); g.add(d);
      var tm = new T.MeshBasicMaterial({ map: canvasTex(lbl, 512, 112, null, '#6B5A45', 58), transparent: true });
      var tp = new T.Mesh(new T.PlaneGeometry(3.6, .8), tm); tp.position.set(0, -r - .5, .05); g.add(tp);
      var o = mk(g, [dm, tm]); o.max = 0.5; o.pos = pos; return o;
    }
    var discA = disc(0xA9DCC0, 2.0, '음식 이야기', [2.0, 0.4, 0.2]);
    var discB = disc(0xC9B6F8, 1.7, '부탁하는 말', [-1.35, -1.05, -0.9]);
    var hintM = new T.MeshBasicMaterial({ map: canvasTex('뜻이 비슷하면 가까이 놓여요', 896, 120, '#FFFDF7', '#5B4A36', 58), transparent: true });
    var hintG = new T.Group(); hintG.add(new T.Mesh(new T.PlaneGeometry(7, .94), hintM));
    var hint = mk(hintG, [hintM]);

    var step = 0, camT = { x: 0, y: .6, z: 9.5 }, camC = { x: 0, y: .6, z: 9.5 }, look = { x: 0, y: 0, z: 0 };
    var running = false, raf = 0, last = 0, clock = 0, dolly = -1, picked = 0;

    function setStep(n) {
      step = n; picked = 0;
      objs.forEach(function (o) { o.t.o = 0; o.t.s = 0.001; });
      var shadow = [0, 0, 0];
      if (n === 0) {
        setT(ticket, [0, 0.4, 0], 1, 1);
        camT = { x: 0, y: .6, z: 9.5 };
      } else if (n === 1) {
        toks.forEach(function (o, i) { setT(o, ROW(i), 1, 1); });
        camT = { x: 0, y: .9, z: 12 };
      } else if (n === 2) {
        toks.forEach(function (o, i) { setT(o, SPACE[i], 1.15, 1); });
        setT(discA, discA.pos, 1, .45); setT(discB, discB.pos, 1, .45); setT(hint, [0, -3.6, 1], 1, 1);
        camT = { x: 0.3, y: -0.3, z: 12 };
      } else if (n === 3) {
        toks.forEach(function (o, i) { setT(o, SPACE[i], .8, i === 3 ? 1 : .55); });
        links.forEach(function (l) { if (l.w > 0) setT(l.o, SPACE[3], 1, .35 + l.w); });
        camT = { x: -3.8, y: 2, z: 8.8 };
      } else if (n === 4) {
        toks.forEach(function (o, i) { setT(o, [(i - 2) * 1.35 - 3.6, 2.5, 0], .62, 1); });
        bars.forEach(function (b, i) { setT(b.o, [(i - 1) * 2.6 + 1.6, -1.9, 0], 1, 1); });
        camT = { x: 0, y: 1, z: 12.8 };
      } else {
        toks.forEach(function (o, i) { setT(o, [(i - 2) * 1.5 - 1.1, 2.6, 0], .66, 1); });
        setT(plate, [0, -1.6, 0.4], .9, 1);
        setT(ans, [0, 1.15, 0.5], 1, 1);
        camT = { x: 0, y: 1, z: 12.2 };
      }
    }

    function place() {
      /* 관계선 끝점 갱신 */
      links.forEach(function (l) {
        var a = SPACE[3], b = SPACE[l.i];
        var dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        var g = l.o.g; g.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
        g.lookAt(b[0], b[1], b[2]);
        var th = 0.02 + l.w * 0.12; l.cyl.scale.set(th, len, th);
        l.o.c.x = g.position.x; l.o.c.y = g.position.y; l.o.c.z = g.position.z; l.o.t.x = g.position.x; l.o.t.y = g.position.y; l.o.t.z = g.position.z;
      });
    }

    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      var dt = Math.min(.05, (now - last) / 1000); last = now; clock += dt;
      var k = 1 - Math.exp(-dt * 5.5);
      objs.forEach(function (o) {
        var isLink = false;
        links.forEach(function (l) { if (l.o === o) isLink = true; });
        o.c.s += (o.t.s - o.c.s) * k; o.c.o += (o.t.o - o.c.o) * k;
        if (!isLink) { o.c.x += (o.t.x - o.c.x) * k; o.c.y += (o.t.y - o.c.y) * k; o.c.z += (o.t.z - o.c.z) * k; o.g.position.set(o.c.x, o.c.y, o.c.z); }
        var sc = Math.max(.001, o.c.s);
        if (isLink) { o.g.scale.setScalar(1); } else { o.g.scale.setScalar(sc); }
        o.g.visible = o.c.o > .02 && sc > .01;
        for (var i = 0; i < o.mats.length; i++) o.mats[i].opacity = Math.min(1, o.c.o);
      });
      /* 단계마다 조금씩 살아 있게 */
      toks.forEach(function (o, i) { if (step === 2) o.g.position.y += Math.sin(clock * 1.4 + i) * .08; o.g.rotation.y = step === 2 ? Math.sin(clock * .8 + i) * .25 : o.g.rotation.y * .9; });
      bars.forEach(function (b, i) {
        var h = step === 4 ? b.h : .01; b.cur = (b.cur || .01) + (h - (b.cur || .01)) * k;
        b.bar.scale.y = Math.max(.01, b.cur); b.bar.position.y = b.cur / 2; b.tp.position.y = b.cur + .5;
        var hot = step === 4 && i === 0 && clock % 3 > 1.5; b.o.g.rotation.z = hot ? Math.sin(clock * 9) * .03 : 0;
      });
      plate.g.rotation.y = clock * .4;
      if (dolly >= 0) { /* 돌리 줌: 카메라가 뒤로 물러나는 만큼 시야각을 좁혀 주인공 크기는 그대로, 배경만 늘어난다 */
        dolly += dt; var p = Math.min(1, dolly / 1.8), e = p * p * (3 - 2 * p), d = 5 + 4.5 * e, h = 2 * 9.5 * Math.tan(16 * Math.PI / 180);
        cam.fov = 2 * Math.atan(h / (2 * d)) * 180 / Math.PI; cam.position.set(0, .6, d); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
        if (p >= 1) { dolly = -1; camC = { x: 0, y: .6, z: 9.5 }; cam.fov = 32; cam.updateProjectionMatrix(); if (onReady) onReady(); }
      } else {
        camC.x += (camT.x - camC.x) * k * .6; camC.y += (camT.y - camC.y) * k * .6; camC.z += (camT.z - camC.z) * k * .6;
        cam.position.set(camC.x + Math.sin(clock * .25) * .35, camC.y, camC.z); cam.lookAt(0, step === 4 ? 0 : 0.2, 0);
      }
      renderer.render(scene, cam);
    }

    function resize() {
      var w = canvas.clientWidth || 640, h = Math.round(w * 9 / 16);
      renderer.setSize(w, h, false); cam.aspect = 16 / 9; cam.updateProjectionMatrix();
    }
    place(); setStep(0); resize();
    return {
      setStep: setStep, resize: resize,
      intro: function () { dolly = 0; },
      start: function () { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
      stop: function () { running = false; cancelAnimationFrame(raf); },
      dispose: function () { running = false; cancelAnimationFrame(raf); renderer.dispose(); }
    };
  }
  window.HowScene3D = { create: create };
})();
