#!/usr/bin/env node
/* tools/gen-terms.js — AI 알기 움직이는 그림(terms/anim/*.html)을 만든다.
 * 글(용어·비유·진짜·다른 점·활용·자막)은 data/terms.json 에서 읽는다 → 문장은 JSON 만 고치고 이 스크립트를 다시 돌리면 된다.
 * 그림(장면)은 아래 ART 에 편마다 적는다. 모든 편이 같은 쇼츠 순서다:
 *   0–3초 질문 · 3–8.4초 비유(따뜻한 주방) · 8.4–14.4초 진짜(파란 설계도 판) · 14.4–17.2초 비유와 다른 점 · 17.2–20.2초 활용 · 20.2초~ 한 줄 정리
 * 각 HTML 은 CSS·SVG·JS 가 다 든 한 장짜리라 USB·오프라인에서도 돈다. 외부 요청 0건 · 소리 없음 · 자막 항상 · 눌러야 재생.
 * 움직임은 data-k="시간:x,y,배율,투명도[,가로배율,세로배율]" 키프레임(transform·opacity 만). data-lin 이 있으면 등속(궤도).
 * 움직임 낱말: letterDive(글자가 위에서 내려와 박힘) · explode(겹친 층이 벌어짐) · rackFocus(흐릿→또렷) · orbit(궤도) · underline(손그림 밑줄).
 * 보기 모드: ?autoplay=1 바로 재생 · ?poster=1 대표 한 장(썸네일) · #t=초 그 시각에 멈춘 장면. 동작 줄이기를 켜면 장면마다 멈춘 그림으로 넘긴다.
 * 썸네일 다시 찍기: python tools/shoot-terms.py (?poster=1 을 960×540 으로 찍어 assets/terms/<id>.webp). */
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'terms', 'anim');
fs.mkdirSync(OUT, { recursive: true });

/* ---------- 키프레임 도우미 ---------- */
const kf = (...f) => f.map(a => a[0] + ':' + a.slice(1).join(',')).join(';');
const G = (inner, k, extra) => '<g data-k="' + kf.apply(null, k) + '"' + (extra || '') + '>' + inner + '</g>';
const INK = '#22324D';
const LN = ' stroke="' + INK + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
const P = (d, f) => '<path d="' + d + '" fill="' + f + '"' + LN + '/>';
const R = (x, y, w, h, r, f) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + f + '"' + LN + '/>';
const C = (x, y, r, f) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"' + LN + '/>';
const E = (x, y, rx, ry, f, line) => '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + (line === false ? '' : LN) + '/>';
const T = (txt, x, y, size, fill, w) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + (size || 22) + '" font-weight="' + (w || 800) + '" fill="' + (fill || INK) + '">' + txt + '</text>';
/* 그림자: 조리대 위에 깔리는 부드러운 타원 */
const shadow = (x, y, rx) => '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + Math.round(rx * .13) + '" fill="#8A5A1E" opacity=".2"/>';

/* ---------- 부품 (원점 기준, 위쪽이 -y) ---------- */
/* 요리 로봇: 모든 편이 같은 얼굴 (2회차 연수의 김치볶음밥 로봇과 같은 역할) */
const bot = () => '<g data-bob="1">' +
  R(-64, -94, 20, 52, 10, '#BFD9FA') + R(44, -94, 20, 52, 10, '#BFD9FA') + C(-54, -40, 12, '#FFC9A3') + C(54, -40, 12, '#FFC9A3') +
  R(-48, -104, 96, 124, 30, '#BFD9FA') + R(-32, -94, 64, 112, 18, '#FFFDF7') + R(-18, -36, 36, 26, 9, '#FFE3CC') +
  C(0, -78, 4.5, '#A9DCC0') + C(0, -60, 4.5, '#A9DCC0') +
  R(-13, -114, 26, 16, 6, '#DCE6F4') +
  R(-70, -160, 14, 30, 7, '#FFC9A3') + R(56, -160, 14, 30, 7, '#FFC9A3') +
  R(-56, -190, 112, 82, 32, '#F6FAFF') + '<rect x="-42" y="-178" width="84" height="58" rx="22" fill="' + INK + '"/>' +
  '<ellipse cx="-17" cy="-154" rx="5.5" ry="8" fill="#8DEBB5"/><ellipse cx="17" cy="-154" rx="5.5" ry="8" fill="#8DEBB5"/>' +
  '<path d="M-11 -137q11 10 22 0" fill="none" stroke="#8DEBB5" stroke-width="3.4" stroke-linecap="round"/>' +
  '<circle cx="-30" cy="-140" r="6" fill="#F4857A" opacity=".75"/><circle cx="30" cy="-140" r="6" fill="#F4857A" opacity=".75"/>' +
  /* 요리사 모자: 굵은 선을 먼저 깔고 흰색으로 덮어 안쪽 겹선을 지운다 */
  '<g stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"><circle cx="-24" cy="-220" r="21" fill="#fff"/><circle cx="24" cy="-220" r="21" fill="#fff"/><circle cx="0" cy="-236" r="25" fill="#fff"/></g>' +
  '<circle cx="-24" cy="-220" r="21" fill="#fff"/><circle cx="24" cy="-220" r="21" fill="#fff"/><circle cx="0" cy="-236" r="25" fill="#fff"/>' +
  R(-38, -208, 76, 22, 9, '#fff') +
  '<path d="M0 -261v-12" fill="none"' + LN + '/>' + C(0, -278, 6.5, '#FFE58A') + '</g>';
/* 손님: 로봇과 같은 선 굵기의 동글동글한 사람 */
const person = (c) => '<g data-bob="1">' + R(-42, -96, 84, 118, 34, c || '#CDBDF7') + C(0, -126, 33, '#FFDDC2') +
  P('M-34 -132q1-32 34-32t34 32q-14-14-34-14t-34 14z', '#6B4E3A') +
  '<circle cx="-11" cy="-124" r="3.6" fill="' + INK + '"/><circle cx="11" cy="-124" r="3.6" fill="' + INK + '"/>' +
  '<circle cx="-21" cy="-113" r="5.5" fill="#F4857A" opacity=".6"/><circle cx="21" cy="-113" r="5.5" fill="#F4857A" opacity=".6"/>' +
  '<path d="M-8 -111q8 7 16 0" fill="none"' + LN + '/></g>';
const ticket = (lines, fill) => '<g>' + R(-90, -56, 180, 28 + lines.length * 28, 12, fill || '#FFFDF7') + R(-20, -66, 40, 15, 4, '#FFC9A3') +
  lines.map((l, i) => T(l, 0, -22 + i * 28, 21, INK, 800)).join('') + '</g>';
const card = (title, n) => '<g>' + R(-66, -46, 132, 92, 13, '#FFFDF7') + T(title, 0, -14, 19, '#8A4B14') + '<rect x="-46" y="2" width="92" height="7" rx="3.5" fill="#F2DDB9"/><rect x="-46" y="16" width="66" height="7" rx="3.5" fill="#F2DDB9"/>' + (n ? '<rect x="-46" y="30" width="78" height="7" rx="3.5" fill="#F2DDB9"/>' : '') + '</g>';
const plate = (food) => '<g>' + shadow(0, 20, 74) + E(0, 8, 76, 19, '#fff') + E(0, 3, 54, 11, '#F5EBD8', false) + food + '</g>';
const rice = P('M-44 -2q4-46 44-46t44 46z', '#FFD27A') + C(-15, -28, 6, '#F4857A') + C(13, -20, 5, '#7FD1A0') + C(2, -39, 7, '#fff');
const oddDish = P('M-42 -2q-6-36 20-32t22-12q24 6 20 46z', '#C9CED8') + T('?', 0, -8, 34, '#fff', 900);
const tag = (txt, fill, color) => { const w = Math.round(txt.length * 19 + 44); return '<g class="tg"><rect x="' + (-w / 2) + '" y="-19" width="' + w + '" height="38" rx="19" fill="' + (fill || '#FFEEC2') + '"' + LN + '/>' + T(txt, 0, 7, 20, color || '#5B3E00', 800) + '</g>'; };
/* 말풍선: side 'l'/'r' 꼬리 방향 */
const bubble = (txt, w, side) => { const x = side === 'l' ? -w / 2 + 22 : w / 2 - 22; const d = side === 'l' ? -1 : 1; return '<g>' + R(-w / 2, -30, w, 54, 22, '#fff') + '<path d="M' + (x - d * 10) + ' 22l' + (d * 20) + ' 22l' + (d * 6) + ' -22z" fill="#fff"' + LN + '/><rect x="' + (x - 11) + '" y="20" width="26" height="7" fill="#fff"/>' + T(txt, 0, 5, 21, '#5B3DB8', 800) + '</g>'; };
const magnifier = '<g><circle r="32" fill="rgba(185,213,248,.4)" stroke="' + INK + '" stroke-width="3"/><circle r="26" fill="none" stroke="#1568D2" stroke-width="5"/><path d="M24 24l34 34" stroke="' + INK + '" stroke-width="12" stroke-linecap="round"/><path d="M24 24l34 34" stroke="#F4857A" stroke-width="6" stroke-linecap="round"/></g>';
const spark = '<path d="M0-14l3.4 10.6 10.6 3.4-10.6 3.4-3.4 10.6-3.4-10.6-10.6-3.4 10.6-3.4z" fill="#FFE58A" stroke="#F2B84B" stroke-width="2" stroke-linejoin="round"/>';
const check = '<path d="M-10 0l8 9 16-18" fill="none" stroke="#2E9B5C" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>';
const books = '<g>' + shadow(0, 2, 70) + R(-62, -26, 124, 26, 6, '#FFC9A3') + R(-54, -52, 108, 26, 6, '#A9DCC0') + R(-58, -76, 116, 24, 6, '#BFD9FA') + '<rect x="-40" y="-18" width="44" height="6" rx="3" fill="#fff" opacity=".8"/><rect x="-34" y="-44" width="36" height="6" rx="3" fill="#fff" opacity=".8"/><rect x="-38" y="-67" width="40" height="6" rx="3" fill="#fff" opacity=".8"/></g>';

/* 배경: 따뜻한 벽 + 조리대(바닥면). 조리대 윗면 y=336, 자막 막대는 아래 20% (y>432) 를 덮는다 */
const lamp = (x) => '<g transform="translate(' + x + ' 0)"><path d="M0 0v40" stroke="' + INK + '" stroke-width="3"/><path d="M-26 74q0-34 26-34t26 34z" fill="#FFC9A3"' + LN + '/><ellipse cx="0" cy="78" rx="12" ry="5" fill="#FFE58A"/></g>';
const wall = '<rect x="-40" y="-60" width="1040" height="640" fill="#FFF4E2"/><circle cx="480" cy="190" r="330" fill="#FFFAF0"/><rect y="262" width="960" height="76" fill="#FCE9CB"/><path d="M0 262h960" stroke="#F2D6AC" stroke-width="3"/>' +
  '<circle cx="64" cy="64" r="34" fill="#FFE9B5" opacity=".8"/><circle cx="880" cy="190" r="22" fill="#FFD9E4" opacity=".7"/>' + lamp(86) + lamp(874);
const counter = '<rect y="336" width="960" height="204" fill="#E7B27A"/><rect y="336" width="960" height="20" fill="#F7D7A8"/><path d="M0 356h960" stroke="' + INK + '" stroke-width="3" opacity=".45"/>' +
  [60, 270, 480, 690].map(x => '<g class="dr"><rect x="' + x + '" y="384" width="190" height="150" rx="14" fill="#DDA466" stroke="#C98F52" stroke-width="3"/><rect x="' + (x + 76) + '" y="396" width="38" height="8" rx="4" fill="#F7D7A8"/></g>').join('');


/* ================= 쇼츠 도우미 ================= */
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'terms.json'), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const W = (s, size) => { let w = 0; for (const ch of String(s)) { const c = ch.charCodeAt(0); w += (c >= 0xAC00 && c <= 0xD7A3) || (c >= 0x3131 && c <= 0x318E) ? size * .96 : ch === ' ' ? size * .3 : /[A-Z0-9%]/.test(ch) ? size * .62 : /[a-z]/.test(ch) ? size * .54 : size * .45; } return w; };
const TX = (txt, x, y, size, fill, w, anchor) => '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" font-size="' + size + '" font-weight="' + (w || 800) + '" fill="' + (fill || INK) + '">' + esc(txt) + '</text>';
const TONE = { bi: ['#FFE3CC', '#8A4B14'], real: ['#DCEBFF', '#0B4FA8'], gap: ['#FFF1B8', '#6B4E00'], use: ['#D6F3E2', '#17623A'], sum: ['#16233A', '#FFFFFF'],
  peach: ['#FFE3CC', '#8A4B14'], sky: ['#DCEBFF', '#0B4FA8'], mint: ['#D6F3E2', '#17623A'], lilac: ['#EDE6FF', '#5B3DB8'], butter: ['#FFF1B8', '#6B4E00'], rose: ['#FFE0E6', '#A3243B'], white: ['#FFFFFF', INK], navy: ['#16233A', '#FFFFFF'] };
/* 알약 모양 글자표 (원점 가운데) */
const chipW = (txt, size) => Math.round(W(txt, size || 22) + (size || 22) * 1.4);
const chip = (txt, tone, size) => { size = size || 22; const t = TONE[tone || 'white']; const w = chipW(txt, size), h = Math.round(size * 1.9);
  return '<g><rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="' + (h / 2) + '" fill="' + t[0] + '"' + LN + '/>' + TX(txt, 0, Math.round(size * .36), size, t[1], 800) + '</g>'; };
/* 나타나기: 살짝 아래에서 커지며 */
const pop = (inner, t, x, y, s) => G(inner, [[t, x, y + 14, (s || 1) * .82, 0], [t + .45, x, y, s || 1, 1]]);
const arrow = (x, y, t, len, color) => G('<path d="M0 0h' + (len || 46) + 'm-12 -10l12 10-12 10" fill="none" stroke="' + (color || '#1568D2') + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>', [[t, x - 10, y, 1, 0], [t + .4, x, y, 1, 1]]);
/* 장면 통째로 나타났다 사라지기 */
const scene = (t0, t1, inner) => { const k = []; if (t0 <= 0) k.push([0, 0, 0, 1, 1]); else { k.push([t0 - .001, 0, 0, 1, 0]); k.push([t0 + .35, 0, 0, 1, 1]); } if (t1 != null) { k.push([t1 - .3, 0, 0, 1, 1]); k.push([t1, 0, 0, 1, 0]); } return G(inner, k); };
/* letter dive: 글자가 하나씩 위에서 떨어져 제자리에 박힌다 */
const letterDive = (txt, cx, cy, size, t0, fill, wt) => { const chars = [...String(txt)]; const ws = chars.map(c => W(c, size)); const tot = ws.reduce((a, b) => a + b, 0); let x = cx - tot / 2, s = '';
  chars.forEach((c, i) => { const mid = x + ws[i] / 2; x += ws[i]; if (c === ' ') return; s += G(TX(c, 0, 0, size, fill, wt || 900), [[t0 + i * .055, Math.round(mid), cy - 70, 1.6, 0], [t0 + i * .055 + .5, Math.round(mid), cy, 1, 1]]); }); return s; };
/* sketch underline: 손으로 그은 밑줄이 왼쪽부터 그어진다 (가로 배율만) */
const underline = (x0, y, w, t0, color) => G('<path d="M0 0q' + (w / 4) + ' -7 ' + (w / 2) + ' 0t' + (w / 2) + ' 0" fill="none" stroke="' + (color || '#FFC94D') + '" stroke-width="7" stroke-linecap="round"/>', [[t0, Math.round(x0), Math.round(y), 1, 1, .001, 1], [t0 + .6, Math.round(x0), Math.round(y), 1, 1, 1, 1]]);
/* rack focus: 흐릿한 것이 또렷해진다 (흐림 필터는 고정, 투명도만 바뀜) */
const rackFocus = (inner, x, y, t0) => G('<g filter="url(#bl)">' + inner + '</g>', [[t0, x, y, 1.06, 0], [t0 + .15, x, y, 1.06, 1], [t0 + .9, x, y, 1, 0]]) + G(inner, [[t0 + .15, x, y, 1.03, 0], [t0 + .9, x, y, 1, 1]]);
/* orbit: 타원 궤도를 등속으로 돈다. 끝나면 end 자리로 */
const orbit = (inner, cx, cy, rx, ry, t0, t1, ph, turns, end) => { const n = Math.round(20 * (turns || 1)), k = [];
  for (let i = 0; i <= n; i++) { const a = (ph + i / n * 360 * (turns || 1)) * Math.PI / 180; k.push([+(t0 + (t1 - t0) * i / n).toFixed(3), Math.round(cx + rx * Math.cos(a)), Math.round(cy + ry * Math.sin(a)), 1, i === 0 ? 0 : 1]); }
  if (end) end.forEach(e => k.push(e)); return G(inner, k, ' data-lin="1"'); };
/* explode: 겹쳐 있던 층이 위아래로 벌어진다 */
const explode = (layers, cx, cy0, ys, t0) => layers.map((l, i) => G(l, [[t0 - .6, cx, cy0 + i * 5, .9, 0], [t0 - .2, cx, cy0 + i * 5, 1, 1], [t0, cx, cy0 + i * 5, 1, 1], [t0 + .8 + i * .08, cx, ys[i], 1, 1]])).join('');
const label = (txt, tone) => { const w = chipW(txt, 22); return G(chip(txt, tone, 22), [[0, 40 + w / 2, 40, 1, 1]]); };
const panel = '<rect x="24" y="70" width="912" height="350" rx="26" fill="#F3F8FF" stroke="#B9D5F8" stroke-width="3"/><rect x="24" y="70" width="912" height="350" rx="26" fill="url(#dots)"/>';
const box = (w, h, fill, txt, size, ink) => R(-w / 2, -h / 2, w, h, 16, fill) + (txt ? TX(txt, 0, Math.round((size || 24) * .36), size || 24, ink || INK, 800) : '');
const dots = (cols, rows, gap, fill) => { let s = ''; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += '<circle cx="' + ((c - (cols - 1) / 2) * gap) + '" cy="' + ((r - (rows - 1) / 2) * gap) + '" r="' + (gap * .28) + '" fill="' + (typeof fill === 'function' ? fill(r, c) : fill) + '"/>'; return s; };
const doc = (ttl) => R(-34, -42, 68, 84, 8, '#fff') + '<path d="M-20 -22h40M-20 -8h40M-20 6h28M-20 20h34" stroke="#9FB4D4" stroke-width="4" stroke-linecap="round"/>' + (ttl ? TX(ttl, 0, 66, 16, INK, 800) : '');
const lockIco = '<rect x="-14" y="-4" width="28" height="22" rx="5" fill="#FFE58A"' + LN + '/><path d="M-8 -4v-6a8 8 0 0116 0v6" fill="none"' + LN + '/>';
const okBadge = (r) => C(0, 0, r || 24, '#D6F3E2') + '<path d="M-10 0l7 8 14-16" fill="none" stroke="#2E9B5C" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>';
const B0 = 3, C0 = 8.4, D0 = 14.4, E0 = 17.2, F0 = 20.2;
const chefB = () => G(shadow(0, 2, 76) + bot(), [[B0, 820, 366, .82, 0], [B0 + .6, 820, 344, .9, 1]]);
const tagAt = (txt, x, t) => G(tag(txt, '#FFEEC2'), [[t, x, 398, .8, 0], [t + .6, x, 394, 1, 1]], ' data-tag="1"');

/* ================= 편마다 그림 (B=비유, C=진짜) ================= */
const ART = {};
ART.model = {
  B: () => { let s = chefB() + G(books, [[B0 + .2, 170, 346, .8, 0], [B0 + .7, 170, 336, 1, 1]]);
    for (let i = 0; i < 5; i++) { const t = B0 + .6 + i * .55; s += G(card('요리법', 1), [[t, 170, 280, .5, 0], [t + .4, 250 + i * 70, 150 + (i % 2) * 50, .75, 1], [t + 1.2, 820, 180, .2, 0]]); }
    return s + G(bubble('손맛 익힘!', 170, 'r'), [[B0 + 3.6, 640, 130, .6, 0], [B0 + 4, 640, 116, 1, 1]]) + tagAt('많이 맛보고 익힌 손맛', 400, B0 + 3.9); },
  C: () => { let s = pop(chip('오늘 급식은', 'peach', 24), C0 + .3, 160, 245) + arrow(282, 245, C0 + .7);
    const cols = ['#BFD9FA', '#A9C9F5', '#93B9EF', '#7EA9E8'];
    s += explode(cols.map(c => box(220, 40, c) + dots(9, 1, 22, '#fff')), 480, 245, [158, 214, 270, 326], C0 + 1.6);
    s += pop(chip('숫자(매개변수) 수십억 개 이상', 'sky', 18), C0 + 2.5, 480, 386) + arrow(615, 245, C0 + 3);
    [['맛있다 62%', 'mint'], ['좋다 21%', 'white'], ['이다 9%', 'white']].forEach((c, i) => { s += pop(chip(c[0], c[1], 24), C0 + 3.2 + i * .25, 800, 172 + i * 70); });
    s += G('<rect x="-100" y="-28" width="200" height="56" rx="28" fill="none" stroke="#2E9B5C" stroke-width="5"/>', [[C0 + 4.4, 800, 172, 1.25, 0], [C0 + 4.9, 800, 172, 1, 1]]);
    return s + pop(TX('다음 조각 확률 (숫자는 예시)', 0, 0, 17, '#0B4FA8', 800), C0 + 4.6, 800, 392); }
};
ART.token = {
  B: () => { let s = chefB(); const face = C(0, 0, 38, '#2F3B33') + '<circle r="29" fill="#fff"/><circle cx="-9" cy="-7" r="7" fill="#F4857A"/><circle cx="9" cy="-5" r="6" fill="#7FD1A0"/><circle cx="0" cy="10" r="7" fill="#FFD27A"/>';
    for (let i = 0; i < 5; i++) { const x0 = 250 + i * 76, x1 = 200 + i * 104;
      s += G(R(-38, -36, 76, 72, 4, '#2F3B33') + '<rect x="-36" y="-8" width="72" height="6" fill="#7FD1A0"/>', [[B0 + .3, x0, 262, .9, 0], [B0 + .7, x0, 262, 1, 1], [B0 + 2.4, x0, 262, 1, 1], [B0 + 2.9, x1, 262, .9, 0]]);
      s += G(face, [[B0 + 2.5, x0, 262, .7, 0], [B0 + 3.1, x1, 262, 1, 1]]); }
    s += G('<path d="M-6 -70h12v40h-12z" fill="#8A6A4A"' + LN + '/><path d="M-10 -30h20l-4 96h-12z" fill="#DCE3EC"' + LN + '/>', [[B0 + 1.1, 190, 230, 1, 0], [B0 + 1.3, 190, 230, 1, 1], [B0 + 2.4, 610, 230, 1, 1], [B0 + 2.6, 640, 230, 1, 0]]);
    return s + tagAt('토큰 = 김밥 썰기', 420, B0 + 3.6); },
  C: () => { let s = letterDive('급식이 맛있다', 480, 168, 58, C0 + .3);
    const parts = [['급식', 'peach', '#4821'], ['이', 'mint', '#13'], ['맛있', 'lilac', '#9077'], ['다', 'butter', '#52']];
    const ws = parts.map(p => chipW(p[0], 30)), gap = 34, tot = ws.reduce((a, b) => a + b, 0) + gap * 3; let x = 480 - tot / 2;
    parts.forEach((p, i) => { const cx = Math.round(x + ws[i] / 2); x += ws[i] + gap;
      s += G(chip(p[0], p[1], 30), [[C0 + 1.9 + i * .2, cx, 180, .7, 0], [C0 + 2.5 + i * .2, cx, 268, 1, 1]]);
      s += pop(TX(p[2], 0, 0, 24, '#1568D2', 900), C0 + 3.3 + i * .2, cx, 330); });
    return s + pop(chip('번호는 예시 · 자르는 법은 AI마다 달라요', 'sky', 17), C0 + 4.4, 480, 388); }
};
ART.context = {
  B: () => { let s = chefB() + pop('<rect x="-245" y="-55" width="490" height="110" rx="18" fill="rgba(255,255,255,.55)" stroke="#8A5A1E" stroke-width="4" stroke-dasharray="12 9"/>' + TX('조리대', 0, -70, 22, '#8A4B14'), B0 + .2, 370, 255);
    const food = [C(0, 0, 28, '#F4857A'), R(-26, -18, 52, 36, 10, '#FFB866'), E(0, 0, 30, 20, '#7FD1A0'), C(0, 0, 26, '#FFE58A'), R(-24, -24, 48, 48, 12, '#CDBDF7'), C(0, 0, 28, '#BFD9FA')];
    const slot = k => 178 + k * 96;
    food.forEach((f, k) => { const tk = k < 5 ? B0 + .6 + k * .5 : B0 + 3.3; const into = k < 5 ? slot(k) : slot(4); const kk = [[tk, 700, 255, .6, 0], [tk + .4, into, 255, 1, 1]];
      if (k < 5) { kk.push([B0 + 3.3, slot(k), 255, 1, 1], [B0 + 3.7, slot(k) - 96, 255, 1, 1]); if (k === 0) kk.push([B0 + 4.2, slot(0) - 96, 390, .8, 0]); }
      s += G(f, kk); });
    return s + tagAt('맥락 창 = 조리대 크기', 420, B0 + 4.3); },
  C: () => { let s = G('<rect x="-200" y="-62" width="400" height="124" rx="20" fill="rgba(255,255,255,.7)" stroke="#1568D2" stroke-width="6"/>', [[C0 + .2, 500, 240, .9, 0], [C0 + .6, 500, 240, 1, 1]]) + pop(chip('맥락 창 = 한 번에 읽는 양', 'sky', 22), C0 + .5, 500, 140);
    const words = ['회의록', '정리', '해줘', '참석자', '5명', '안건', '두 개', '표로', '부탁해'];
    words.forEach((w, i) => { const k = [[C0 + .6, 352 + i * 96, 240, .8, 0]]; for (let st = 0; st <= 5; st++) { const x = 352 + (i - st) * 96; const op = x > 300 && x < 700 ? 1 : (x > 60 && x < 900 ? .22 : 0); const t = C0 + 1 + st * .65; k.push([t, x, 240, 1, op]); if (st < 5) k.push([t + .3, x, 240, 1, op]); } s += G(box(84, 46, '#FFFDF7', w, 19), k); });
    return s + pop(TX('← 창 밖은 안 보여요', 0, 0, 22, '#B3261E', 900), C0 + 3.6, 190, 340) + pop(chip('질문 + 대화 + 파일 = 모두 이 안에', 'mint', 18), C0 + 2.4, 640, 360); }
};
ART.temperature = {
  B: () => { let s = chefB() + G(shadow(0, 104, 90) + '<circle r="95" fill="rgba(220,235,255,.7)"' + LN + '/>' + R(-40, -118, 80, 28, 8, '#DCE6F4') +
      [[-40, -30], [0, -50], [40, -24], [-55, 20], [-12, 10], [30, 26], [60, 60], [-30, 60], [10, 62], [-60, -6], [55, -60], [-10, -80]].map((p, i) => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="15" fill="' + (i < 7 ? '#FFC94D' : i < 10 ? '#7FD1A0' : '#93B9EF') + '"' + LN + '/>').join(''), [[B0 + .2, 270, 240, .85, 0], [B0 + .7, 270, 230, 1, 1]]);
    [['비빔밥 표 7장', 'butter'], ['김밥 표 3장', 'mint'], ['국수 표 2장', 'sky']].forEach((c, i) => { s += pop(chip(c[0], c[1], 20), B0 + .9 + i * .35, 500, 160 + i * 56); });
    s += G('<circle r="17" fill="#FFC94D"' + LN + '/>', [[B0 + 2.6, 270, 120, .8, 0], [B0 + 3, 270, 100, 1, 1], [B0 + 3.6, 660, 250, 1.4, 1]]);
    return s + G(bubble('이번엔 비빔밥!', 186, 'r'), [[B0 + 3.6, 650, 124, .6, 0], [B0 + 4, 650, 110, 1, 1]]) + tagAt('온도 = 메뉴 뽑기', 300, B0 + 4); },
  C: () => { let s = pop(TX('다음 조각 후보와 확률', 0, 0, 22, '#0B4FA8', 900), C0 + .2, 420, 112);
    const names = ['비빔밥', '김밥', '국수'], P0 = [.6, .25, .15], LO = [.9, .07, .03], HI = [.4, .33, .27], cols = ['#FFC94D', '#7FD1A0', '#93B9EF'];
    names.forEach((n, i) => { const x = 290 + i * 130;
      s += G('<rect x="-42" y="-220" width="84" height="220" rx="10" fill="' + cols[i] + '"' + LN + '/>', [[C0 + .4, x, 370, 1, 1, 1, .001], [C0 + 1.1, x, 370, 1, 1, 1, P0[i]], [C0 + 2.6, x, 370, 1, 1, 1, P0[i]], [C0 + 3.1, x, 370, 1, 1, 1, LO[i]], [C0 + 4.1, x, 370, 1, 1, 1, LO[i]], [C0 + 4.6, x, 370, 1, 1, 1, HI[i]]]);
      s += pop(TX(n, 0, 0, 22, INK, 900), C0 + .4, x, 400);
      [[P0, C0 + 1.1, C0 + 2.6], [LO, C0 + 3.1, C0 + 4.1], [HI, C0 + 4.6, 99]].forEach(st => { const y = Math.round(370 - 220 * st[0][i] - 12); s += G(TX(Math.round(st[0][i] * 100) + '%', 0, 0, 22, INK, 900), [[st[1], x, y, 1, 0], [st[1] + .3, x, y, 1, 1], [st[2], x, y, 1, 1], [st[2] + .2, x, y, 1, 0]]); }); });
    [['보통', '후보마다 확률을 매겨요', 'white', C0 + .8, C0 + 2.6], ['온도 낮음', '1등에 몰려요', 'sky', C0 + 3.1, C0 + 4.1], ['온도 높음', '골고루 뽑혀요', 'peach', C0 + 4.6, 99]].forEach(c => {
      s += G(chip(c[0], c[2], 28) + TX(c[1], 0, 58, 22, INK, 800), [[c[3], 760, 210, .85, 0], [c[3] + .35, 760, 210, 1, 1], [c[4], 760, 210, 1, 1], [c[4] + .2, 760, 210, .9, 0]]); });
    return s; }
};
ART.training = {
  B: () => { let s = chefB() + pop(shadow(0, 4, 110) + P('M-100 0v-110l100-60 100 60v110z', '#FFFDF7') + R(-26, -60, 52, 60, 6, '#FFC9A3') + '<path d="M0 -170v-40" stroke="' + INK + '" stroke-width="3"/>' + P('M0 -210l34 10-34 10z', '#F4857A') + TX('요리 학교', 0, -92, 24, '#8A4B14', 900), B0 + .2, 200, 340);
    s += arrow(380, 250, B0 + 1.2, 70) + pop(TX('졸업', 0, 0, 20, '#1568D2', 900), B0 + 1.3, 415, 222);
    s += pop(ticket(['주문']), B0 + 1.8, 570, 270) + pop(C(0, 0, 34, '#fff') + '<g transform="translate(0 -4)">' + lockIco + '</g>' + TX('실력 그대로', 0, 60, 20, INK, 900), B0 + 2.8, 680, 100);
    return s + tagAt('학습 = 학교, 사용 = 식당', 400, B0 + 3.8); },
  C: () => { let s = pop(chip('학습 training', 'sky', 22), C0 + .2, 140, 160) + pop('<g transform="translate(-14 -8)">' + doc() + '</g><g transform="translate(14 8)">' + doc() + '</g>', C0 + .4, 300, 160) + arrow(372, 160, C0 + .8);
    s += pop(box(170, 84, '#EEF4FF'), C0 + .6, 520, 160);
    for (let k = 0; k < 5; k++) { const t = C0 + .9 + k * .45; s += G(dots(6, 2, 24, (r, c) => ((r + c + k) % 3 === 0 ? '#F4857A' : (r + c + k) % 3 === 1 ? '#7FD1A0' : '#93B9EF')), [[t, 520, 160, 1, 0], [t + .1, 520, 160, 1, 1], [t + .4, 520, 160, 1, 1], [t + .5, 520, 160, 1, k === 4 ? 1 : 0]]); }
    s += pop(chip('숫자를 고쳐요', 'mint', 22), C0 + 1.4, 730, 160);
    s += pop(chip('사용 inference', 'peach', 22), C0 + 2.8, 140, 290) + pop(chip('질문', 'white', 22), C0 + 3, 300, 290) + arrow(372, 290, C0 + 3.2);
    s += pop(box(170, 84, '#EEF4FF') + dots(6, 2, 24, '#93B9EF') + '<g transform="translate(70 -38)">' + lockIco + '</g>', C0 + 3.2, 520, 290) + arrow(622, 290, C0 + 3.6) + pop(chip('답', 'mint', 22), C0 + 3.8, 730, 290);
    s += pop(TX('숫자는 그대로', 0, 0, 18, '#0B4FA8', 900), C0 + 3.6, 520, 352);
    return s + pop(chip('미세조정 = 추가 연수 · 프롬프트 = 오늘 주문서', 'butter', 18), C0 + 4.4, 480, 394); }
};
ART.hallucination = {
  B: () => { let s = chefB() + pop(R(-104, -78, 208, 156, 12, '#3B5A48') + TX('메뉴판', 0, -40, 21, '#fff', 900) + TX('김치볶음밥', 0, -6, 19, '#E8F3EA') + TX('된장찌개', 0, 22, 19, '#E8F3EA') + TX('비빔밥', 0, 50, 19, '#E8F3EA'), B0 + .2, 190, 180);
    s += pop(plate(P('M-44 -2q4-46 44-46t44 46z', '#F2C94C') + C(-14, -30, 7, '#fff') + C(14, -24, 6, '#fff')), B0 + .8, 500, 330);
    s += pop(tag('금성산 황금 전복죽', '#FFE58A'), B0 + 1.2, 500, 252) + G(spark, [[B0 + 1.6, 600, 210, .3, 0], [B0 + 2, 600, 200, 1.4, 1]]) + G(bubble('정말 맛있어요!', 190, 'r'), [[B0 + 1.8, 650, 124, .6, 0], [B0 + 2.2, 650, 110, 1, 1]]);
    s += G('<g transform="rotate(-8)">' + R(-90, -24, 180, 48, 10, '#FFF0EE') + TX('메뉴판에 없음', 0, 9, 24, '#B3261E', 900) + '</g>', [[B0 + 3, 190, 300, 1.7, 0], [B0 + 3.4, 190, 300, 1, 1]]);
    return s + tagAt('환각 = 없는 메뉴', 360, B0 + 3.9); },
  C: () => { let s = pop(chip('예시중 개교 연도는?', 'peach', 24), C0 + .2, 480, 118);
    [['1951년', .34], ['1948년', .31], ['1962년', .29]].forEach((r, i) => { const y = 190 + i * 52;
      s += pop(TX(r[0], 0, 8, 22, INK, 900), C0 + .8 + i * .2, 250, y);
      s += G('<rect x="0" y="-16" width="300" height="32" rx="10" fill="' + (i ? '#C9D6EA' : '#93B9EF') + '"' + LN + '/>', [[C0 + .9 + i * .2, 320, y, 1, 1, .001, 1], [C0 + 1.6 + i * .2, 320, y, 1, 1, r[1] / .34, 1]]);
      s += pop(TX(Math.round(r[1] * 100) + '%', 0, 8, 22, INK, 900), C0 + 1.7 + i * .2, Math.round(360 + 300 * r[1] / .34), y); });
    s += pop(TX('비슷비슷해요', 0, 0, 22, '#B3261E', 900), C0 + 2.4, 790, 240);
    s += pop(chip('예시중은 1951년에 개교했어요!', 'mint', 24), C0 + 3.2, 480, 352) + G(spark, [[C0 + 3.5, 700, 330, .3, 0], [C0 + 3.9, 700, 322, 1.3, 1]]);
    return s + pop(TX('근거가 없어도 확률은 나와요 · 숫자는 예시', 0, 0, 18, '#0B4FA8', 900), C0 + 4.4, 480, 404); }
};
ART.prompt = {
  B: () => { let s = chefB() + G(shadow(0, 2, 60) + person(), [[B0, 130, 350, .9, 0], [B0 + .5, 130, 344, 1, 1]]);
    s += G(ticket(['맛있는 거', '주세요']), [[B0 + .3, 170, 160, .8, 0], [B0 + .7, 170, 160, 1, 1], [B0 + 1.3, 470, 150, .9, 1], [B0 + 2.2, 470, 150, .9, 1], [B0 + 2.5, 470, 150, .8, 0]]);
    s += G(plate(oddDish), [[B0 + 1.4, 470, 350, .8, 0], [B0 + 1.8, 470, 330, 1, 1], [B0 + 2.5, 470, 330, 1, 1], [B0 + 2.8, 470, 330, .9, 0]]);
    s += G(ticket(['김치볶음밥', '계란 추가', '안 맵게']), [[B0 + 2.6, 170, 150, .8, 0], [B0 + 3, 170, 150, 1, 1], [B0 + 3.5, 470, 140, .9, 1]]);
    s += G(plate(rice), [[B0 + 3.6, 470, 350, .8, 0], [B0 + 4, 470, 330, 1.1, 1]]) + G(spark, [[B0 + 4.1, 560, 270, .3, 0], [B0 + 4.5, 560, 262, 1.4, 1]]);
    return s + tagAt('프롬프트 = 주문서', 470, B0 + 4.4); },
  C: () => { const L = [['서비스 지시 (시스템 프롬프트)', '#EDE6FF'], ['이전 대화', '#FFF1B8'], ['붙인 자료', '#D6F3E2'], ['내 질문', '#FFE3CC']];
    let s = explode(L.map(l => box(430, 50, l[1], l[0], 22)), 400, 250, [128, 192, 256, 320], C0 + 1.4);
    s += G('<path d="M0 -112q22 0 22 22v68l14 22-14 22v68q0 22-22 22" fill="none" stroke="#1568D2" stroke-width="5" stroke-linecap="round"/>', [[C0 + 2.8, 640, 224, 1, 0], [C0 + 3.2, 640, 224, 1, 1]]);
    return s + pop(TX('모두 = 프롬프트', 0, 0, 24, '#0B4FA8', 900), C0 + 3.2, 780, 200) + arrow(700, 250, C0 + 3.6, 40) + pop(chip('AI', 'navy', 24), C0 + 3.8, 810, 252); }
};
ART.order = {
  B: () => { const rows = [['누', '누가 먹나요', '#FFE3CC'], ['어', '어떤 요리', '#DCEBFF'], ['느', '어떤 맛·모양', '#EDE6FF'], ['재', '무슨 재료', '#D6F3E2']];
    let s = chefB() + pop(R(-220, -142, 440, 284, 16, '#FFFDF7') + R(-30, -152, 60, 18, 5, '#FFC9A3'), B0 + .2, 410, 210);
    rows.forEach((r, i) => { const y = 210 - 96 + i * 62, t = B0 + .7 + i * .7;
      s += pop('<circle cx="-170" r="24" fill="' + r[2] + '"' + LN + '/>' + TX(r[0], -170, 9, 26, INK, 900) + TX(r[1], -130, 9, 26, INK, 800, 'start') + '<rect x="-136" y="18" width="290" height="3" rx="1.5" fill="#F2DDB9"/>', t, 410, y);
      s += G(check, [[t + .4, 590, y, .3, 0], [t + .7, 590, y, 1, 1]]); });
    return s + tagAt('좋은 주문서 = 네 칸', 410, B0 + 3.9); },
  C: () => { const K = [['누', '대상', 'peach'], ['어', '할 일', 'sky'], ['느', '형식·말투', 'lilac'], ['재', '자료·조건', 'mint']];
    let s = ''; K.forEach((k, i) => { const x = 170 + i * 207; s += pop(R(-92, -44, 184, 88, 18, TONE[k[2]][0]) + TX(k[0], -54, 14, 40, TONE[k[2]][1], 900) + TX(k[1], 22, 10, 22, INK, 900), C0 + .3 + i * .3, x, 148); });
    [['[중1 학부모]에게', 'peach', 285, 262], ['[체험학습 안내]를', 'sky', 665, 262], ['[공손하게 5줄로],', 'lilac', 285, 332], ['[첨부 일정표] 기준', 'mint', 665, 332]].forEach((c, i) => { s += pop(chip(c[0], c[1], 26), C0 + 2 + i * .45, c[2], c[3]); });
    return s + underline(150, 374, 660, C0 + 4.3, '#FFC94D'); }
};
ART.rag = {
  B: () => { let s = chefB() + pop(R(-200, -12, 400, 24, 8, '#C98F52'), B0 + .1, 400, 330);
    s += pop(P('M0 -6q-60-18-120-4v-96q60-14 120 4z', '#fff') + P('M0 -6q60-18 120-4v-96q-60-14-120 4z', '#fff') + '<path d="M-100 -80h76M-100 -60h70M20 -80h76M20 -60h60" stroke="#9FB4D4" stroke-width="5" stroke-linecap="round"/>', B0 + .4, 470, 318);
    s += pop(R(-70, -90, 140, 180, 10, '#FFFDF7') + TX('시험지', 0, -56, 22, '#8A4B14', 900) + TX('Q. 회신 기한?', 0, -16, 18, INK, 800) + '<path d="M-48 20h96M-48 44h70" stroke="#E4C9A0" stroke-width="5" stroke-linecap="round"/>', B0 + .3, 170, 220);
    s += G(magnifier, [[B0 + 1.4, 400, 250, .7, 0], [B0 + 1.8, 400, 250, 1, 1], [B0 + 3.2, 540, 250, 1, 1]]);
    return s + tagAt('자료 붙이기 = 오픈북 시험', 420, B0 + 3.8); },
  C: () => { let s = pop(chip('체험학습 회신 기한은?', 'peach', 22), C0 + .2, 210, 120);
    s += pop('<g transform="translate(-30 -10)">' + doc() + '</g>' + doc() + '<g transform="translate(30 10)">' + doc('안내문 3개') + '</g>', C0 + .5, 210, 262);
    s += G(magnifier, [[C0 + 1, 150, 240, .7, 0], [C0 + 1.3, 150, 240, .8, 1], [C0 + 2.2, 260, 250, .8, 1], [C0 + 2.5, 260, 250, .8, 0]]);
    s += pop('<rect x="-180" y="-110" width="360" height="220" rx="20" fill="rgba(255,255,255,.75)" stroke="#1568D2" stroke-width="5"/>' + TX('맥락 창', -120, -80, 20, '#0B4FA8', 900), C0 + .6, 650, 230);
    s += pop(chip('질문', 'peach', 20), C0 + 2.2, 650, 160);
    s += G(chip('3쪽: 회신은 5월 2일까지', 'butter', 20), [[C0 + 2.4, 240, 262, .7, 0], [C0 + 2.6, 240, 262, .9, 1], [C0 + 3.3, 650, 222, 1, 1]]);
    s += pop(chip('5월 2일까지예요 (근거 3쪽)', 'mint', 22), C0 + 4.1, 650, 290);
    return s + pop(TX('날짜는 예시', 0, 0, 17, '#0B4FA8', 800), C0 + 4.5, 650, 392); }
};
ART.multimodal = {
  B: () => { let s = chefB() + G(shadow(0, 2, 60) + person('#FFC9A3'), [[B0, 140, 350, .9, 0], [B0 + .5, 140, 344, 1, 1]]);
    s += pop(R(-70, -54, 140, 108, 10, '#fff') + '<rect x="-58" y="-42" width="116" height="70" rx="6" fill="#FFF4E2"/><g transform="translate(0 12) scale(.55)">' + rice + '</g>' + TX('사진', 0, 46, 16, INK, 800), B0 + .4, 290, 220);
    s += G(bubble('이거 만들어 주세요!', 230, 'l'), [[B0 + 1.2, 300, 118, .6, 0], [B0 + 1.6, 300, 104, 1, 1]]) + G('<path d="M0 -14q10 14 0 28M12 -24q18 24 0 48" fill="none" stroke="#1568D2" stroke-width="4" stroke-linecap="round"/>', [[B0 + 1.5, 430, 104, .6, 0], [B0 + 1.9, 430, 104, 1, 1]]);
    s += G(bubble('알겠어요!', 150, 'r'), [[B0 + 2.5, 680, 124, .6, 0], [B0 + 2.9, 680, 110, 1, 1]]) + pop(plate(rice), B0 + 3, 540, 330);
    return s + tagAt('사진·말로도 부탁할 수 있어요', 400, B0 + 3.8); },
  C: () => { let s = pop(box(190, 100, '#16233A', 'AI', 30, '#fff'), C0 + .2, 480, 240);
    const ic = [R(-30, -24, 60, 48, 8, '#FFE3CC') + '<circle cx="-8" cy="-6" r="7" fill="#F4857A"/><path d="M-24 18l16-16 12 10 10-8 14 14z" fill="#7FD1A0"/>', R(-12, -28, 24, 40, 12, '#DCEBFF') + '<path d="M-20 4q0 20 20 20t20-20M0 24v10" fill="none"' + LN + '/>', R(-28, -28, 56, 56, 12, '#EDE6FF') + TX('가', 0, 12, 32, '#5B3DB8', 900)];
    const lab = ['사진', '소리', '글'];
    ic.forEach((g, i) => { s += orbit(g + TX(lab[i], 0, 52, 17, INK, 900), 480, 240, 300, 125, C0 + .3, C0 + 3.2, i * 120 - 90, 1, [[C0 + 3.8, 480, 240, .3, 0]]); });
    s += G(dots(8, 3, 16, (r) => ['#FFC9A3', '#93B9EF', '#BFAFF2'][r]), [[C0 + 3.7, 480, 300, .6, 0], [C0 + 4.1, 480, 322, 1, 1]]);
    return s + pop(chip('모두 숫자 조각으로 바꿔 함께 처리', 'sky', 20), C0 + 4.2, 480, 392); }
};
ART.tool = {
  B: () => { let s = chefB() + pop(P('M-60 10h120l-20-46h-80z', '#B7C3D4') + C(0, -48, 22, '#fff') + '<path d="M0 -48l10-10" stroke="#F4857A" stroke-width="5" stroke-linecap="round"/>' + E(0, -84, 40, 12, '#FFD27A'), B0 + .2, 270, 330);
    s += pop(chip('200 g', 'white', 24), B0 + 1.2, 270, 200);
    s += pop(C(0, 0, 44, '#fff') + '<path d="M0 0v-30M0 0l18 10" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>' + R(-8, -60, 16, 12, 4, '#F4857A') + TX('3:00', 0, 74, 22, INK, 900), B0 + 1.8, 500, 270);
    s += G(bubble('눈대중 말고 정확히!', 236, 'r'), [[B0 + 2.6, 640, 124, .6, 0], [B0 + 3, 640, 110, 1, 1]]);
    return s + tagAt('도구 = 저울과 타이머', 380, B0 + 3.8); },
  C: () => { let s = pop(box(170, 100, '#16233A', 'AI', 30, '#fff'), C0 + .2, 190, 220) + pop(TX('요청은 AI', 0, 0, 20, '#0B4FA8', 900), C0 + .5, 190, 300);
    s += pop(box(210, 100, '#FFF1B8', '계산기 프로그램', 22), C0 + .3, 770, 220) + pop(TX('실행은 프로그램', 0, 0, 20, '#6B4E00', 900), C0 + .6, 770, 300);
    s += G(chip('계산기(37×12)', 'sky', 22), [[C0 + .8, 190, 140, .7, 0], [C0 + 1.1, 190, 140, 1, 1], [C0 + 2.1, 770, 140, 1, 1], [C0 + 2.4, 770, 190, .6, 0]]);
    s += G('<rect x="-105" y="-50" width="210" height="100" rx="16" fill="none" stroke="#F2B84B" stroke-width="8"/>', [[C0 + 2.3, 770, 220, 1, 0], [C0 + 2.5, 770, 220, 1.1, 1], [C0 + 2.9, 770, 220, 1.2, 0]]);
    s += G(chip('결과 444', 'mint', 22), [[C0 + 2.8, 770, 140, .7, 0], [C0 + 3.1, 770, 140, 1, 1], [C0 + 3.9, 190, 140, 1, 1], [C0 + 4.2, 190, 180, .6, 0]]);
    return s + pop(chip('37×12 = 444예요', 'white', 26), C0 + 4.3, 480, 370); }
};
ART.agent = {
  B: () => { const st = [['장보기', -90, R(-20, -12, 40, 26, 6, '#FFC9A3')], ['손질', 0, '<path d="M-18 8l30-24 6 6-30 24z" fill="#DCE3EC"' + LN + '/>'], ['요리', 90, E(0, 0, 22, 10, '#B7C3D4')], ['맛보기', 180, E(0, 4, 8, 6, '#FFE58A') + '<path d="M0 -2v-18" stroke="' + INK + '" stroke-width="4"/>']];
    let s = chefB() + pop('<circle r="112" fill="none" stroke="#C98F52" stroke-width="4" stroke-dasharray="10 10"/>', B0 + .2, 380, 205);
    st.forEach((x, i) => { const a = x[1] * Math.PI / 180; s += pop(C(0, 0, 32, '#FFFDF7') + x[2] + TX(x[0], 0, 54, 19, INK, 900), B0 + .4 + i * .3, Math.round(380 + 112 * Math.cos(a)), Math.round(205 + 112 * Math.sin(a))); });
    s += orbit(C(0, 0, 14, '#BFD9FA') + '<circle cx="-4" cy="-2" r="2.4" fill="' + INK + '"/><circle cx="4" cy="-2" r="2.4" fill="' + INK + '"/>', 380, 205, 112, 112, B0 + 1.6, B0 + 4.6, -90, 1);
    return s + tagAt('에이전트 = 혼자 끝까지', 600, B0 + 4); },
  C: () => { const N = [['계획', -90], ['도구 사용', 0], ['결과 확인', 90], ['다음 행동', 180]];
    let s = pop('<circle r="122" fill="none" stroke="#93B9EF" stroke-width="5" stroke-dasharray="14 10"/>', C0 + .2, 380, 245);
    N.forEach((n, i) => { const a = n[1] * Math.PI / 180; s += pop(chip(n[0], ['peach', 'sky', 'mint', 'lilac'][i], 22), C0 + .4 + i * .25, Math.round(380 + 122 * Math.cos(a)), Math.round(245 + 122 * Math.sin(a))); });
    s += orbit('<circle r="11" fill="#1568D2" stroke="#fff" stroke-width="3"/>', 380, 245, 122, 122, C0 + 1.4, C0 + 4.4, -90, 2);
    s += arrow(580, 245, C0 + 4.2, 60) + pop(R(-90, -56, 180, 112, 18, '#FFF1B8') + '<g transform="translate(0 12) scale(.32)">' + person('#A9DCC0') + '</g>' + TX('사람 확인', 0, 46, 22, INK, 900), C0 + 4.3, 770, 240);
    return s + pop(TX('보내기·제출 전 멈춤', 0, 0, 20, '#6B4E00', 900), C0 + 4.6, 770, 330); }
};
ART.skill = {
  B: () => { let s = chefB() + pop(shadow(0, 8, 78) + R(-72, -34, 144, 70, 10, '#C98F52') + R(-60, -58, 120, 32, 6, '#FFFDF7') + TX('레시피 카드함', 0, 16, 17, '#fff'), B0 + .2, 150, 342);
    s += G(R(-140, -90, 280, 180, 14, '#FFFDF7') + TX('김치볶음밥 레시피', 0, -54, 21, '#8A4B14') + ['1. 재료를 썬다', '2. 볶는다', '3. 계란을 올린다'].map((t, i) => TX(t, -110, -14 + i * 36, 20, INK, 800, 'start')).join(''), [[B0 + .9, 150, 300, .3, 0], [B0 + 1.6, 450, 200, 1, 1]]);
    [0, 1, 2].forEach(i => { s += G(check, [[B0 + 2 + i * .55, 560, 180 + i * 36, .3, 0], [B0 + 2.4 + i * .55, 560, 180 + i * 36, 1, 1]]); });
    return s + tagAt('스킬 = 레시피 카드', 450, B0 + 3.9); },
  C: () => { const sk = (t) => R(-100, -32, 200, 64, 12, '#FFFDF7') + R(-100, -44, 60, 16, 6, '#FFE3CC') + TX(t, 0, 4, 22, INK, 900) + TX('SKILL', 0, 24, 13, '#8A4B14', 900);
    let s = pop(sk('가정통신문'), C0 + .2, 190, 150) + pop(sk('문항 만들기'), C0 + .5, 190, 320);
    s += pop('<rect x="-200" y="-125" width="400" height="250" rx="20" fill="rgba(255,255,255,.75)" stroke="#1568D2" stroke-width="5"/>' + TX('맥락 창', -140, -96, 20, '#0B4FA8', 900), C0 + .3, 650, 240);
    s += G(sk('회의록'), [[C0 + .35, 190, 235, .85, 0], [C0 + .8, 190, 235, 1, 1], [C0 + 1.8, 190, 235, 1, 1], [C0 + 2.8, 650, 200, 1.25, 1]]);
    s += pop(chip('순서 · 규칙 · 예시', 'mint', 20), C0 + 3, 650, 290);
    return s + pop(TX('필요한 것만 꺼내 읽어요', 0, 0, 20, '#0B4FA8', 900), C0 + 3.6, 650, 394); }
};
ART.harness = {
  B: () => { const set = [[150, 300, '레시피', card('', 1)], [330, 320, '손질한 재료', E(0, -14, 44, 15, '#fff') + C(-14, -28, 10, '#F4857A') + R(4, -40, 24, 12, 6, '#FFB866')], [520, 320, '도구', R(-34, -34, 48, 13, 5, '#C5CEDB') + R(12, -38, 30, 22, 7, '#C98F52')], [650, 200, '확인', okBadge(24)]];
    let s = chefB(); set.forEach((p, i) => { s += pop(p[3] + TX(p[2], 0, 44, 18, INK, 900), B0 + .3 + i * .55, p[0], p[1]); });
    s += G('<rect x="-420" y="-150" width="840" height="300" rx="30" fill="none" stroke="#F2B84B" stroke-width="5" stroke-dasharray="16 12"/>' + TX('도구와 레시피 한 벌', 40, -162, 22, '#8A4B14', 900), [[B0 + 2.8, 500, 250, 1.06, 0], [B0 + 3.3, 500, 250, 1, 1]]);
    return s + tagAt('하네스 = 도구와 레시피', 480, B0 + 3.9); },
  C: () => { const L = [['확인 규칙', '#FFE0E6'], ['스킬', '#D6F3E2'], ['도구', '#FFF1B8'], ['지시 (시스템 프롬프트)', '#EDE6FF']];
    let s = explode(L.map((l, i) => box(500 - i * 30, 46, l[1], l[0], 22)), 500, 250, [338, 282, 226, 170], C0 + 1.2);
    s += G(box(200, 52, '#16233A', 'AI', 26, '#fff'), [[C0 + 1.6, 500, 250, .8, 0], [C0 + 2.4, 500, 110, 1, 1]]);
    s += G('<path d="M22 -120q-22 0-22 22v196q0 22 22 22" fill="none" stroke="#1568D2" stroke-width="5" stroke-linecap="round"/>' + TX('하네스', -56, 8, 26, '#0B4FA8', 900), [[C0 + 3, 205, 266, 1, 0], [C0 + 3.4, 205, 266, 1, 1]]);
    return s + pop(chip('같은 AI + 다른 하네스 = 다른 답', 'butter', 18), C0 + 4.2, 500, 402); }
};
ART.privacy = {
  B: () => { let s = chefB() + pop(shadow(0, 4, 90) + P('M-80 0v-120h160v120z', '#DCE6F4') + P('M-96 -120l96-50 96 50z', '#93B9EF') + '<path d="M-50 -90h24M-10 -90h24M30 -90h24M-50 -50h24M30 -50h24" stroke="#fff" stroke-width="12"/>' + R(-18, -40, 36, 40, 4, '#FFFDF7') + TX('본사(서버)', 0, 30, 20, INK, 900), B0 + .2, 160, 330);
    s += G('<path d="M0 0h380" stroke="#C98F52" stroke-width="4" stroke-dasharray="12 10"/>', [[B0 + .5, 260, 220, 1, 0], [B0 + .8, 260, 220, 1, 1]]);
    s += G(ticket(['김○○', '010-○○○○']), [[B0 + .8, 680, 220, .8, 0], [B0 + 1.2, 680, 220, .9, 1], [B0 + 2.4, 240, 200, .8, 1]]);
    s += pop(chip('되돌리기 어려워요', 'rose', 22), B0 + 2.6, 240, 110);
    s += pop(ticket(['ㄱ학생']) + '<g transform="translate(76 -44)">' + okBadge(16) + '</g>', B0 + 3.3, 640, 210);
    return s + tagAt('개인정보 = 본사로 가는 주문서', 440, B0 + 3.9); },
  C: () => { let s = pop(chip('내 입력 (글·파일)', 'peach', 22), C0 + .2, 160, 190);
    s += pop([0, 1, 2].map(i => R(-70, -66 + i * 44, 140, 38, 10, '#DCEBFF') + '<circle cx="-46" cy="' + (-47 + i * 44) + '" r="5" fill="#2E9B5C"/>').join('') + TX('서비스 회사 서버', 0, 98, 20, INK, 900), C0 + .5, 470, 200);
    s += G(chip('입력', 'peach', 18), [[C0 + 1, 280, 190, .8, 0], [C0 + 1.2, 280, 190, 1, 1], [C0 + 1.9, 400, 190, 1, 1], [C0 + 2.1, 430, 190, .7, 0]]);
    s += arrow(570, 150, C0 + 2.3, 50) + pop(chip('저장', 'sky', 22), C0 + 2.5, 720, 150) + arrow(570, 250, C0 + 2.6, 50) + pop(chip('학습에 쓰일 수도 (설정 확인)', 'butter', 20), C0 + 2.8, 780, 250);
    s += pop(R(-40, -30, 80, 60, 8, '#fff') + '<path d="M-30 20l20-22 14 12 10-8 16 18z" fill="#7FD1A0"/>' + C(24, -18, 13, '#FFE58A') + TX('©', 24, -12, 18, INK, 900), C0 + 3.8, 230, 362);
    return s + pop(TX('남의 글·그림은 출처 밝히기', 0, 0, 22, INK, 900), C0 + 4, 470, 370); }
};
ART.students = {
  B: () => { let s = chefB() + pop(R(-160, -76, 320, 152, 14, '#3B5A48') + TX('실습 규칙', 0, -40, 22, '#fff', 900), B0 + .2, 330, 160);
    ['① 개인정보 넣지 않기', '② 답은 직접 확인', '③ AI 쓴 곳 표시'].forEach((r, i) => { s += pop(TX(r, 0, 0, 20, '#E8F3EA', 800), B0 + .7 + i * .5, 330, 154 + i * 30); });
    s += G(shadow(0, 2, 60) + person('#A9DCC0'), [[B0 + .3, 590, 350, .9, 0], [B0 + .8, 590, 344, 1, 1]]);
    s += pop(okBadge(26) + TX('확인!', 0, -38, 20, '#17623A', 900), B0 + 2.8, 670, 190);
    return s + tagAt('규칙 먼저, 확인은 직접', 330, B0 + 3.9); },
  C: () => { const items = ['이용 연령 확인 (서비스마다 다름)', '보호자 동의서 (학생 개인정보)', '학교가 승인한 도구', 'AI 쓴 부분 표시', '답 검증 습관'];
    let s = pop(R(-330, -152, 660, 304, 20, '#fff'), C0 + .2, 480, 245);
    items.forEach((it, i) => { const y = 135 + i * 55, t = C0 + .6 + i * .75; s += pop(R(-14, -14, 28, 28, 7, '#F3F8FF') + TX(it, 30, 8, 24, INK, 800, 'start'), t, 220, y); s += G(check, [[t + .4, 220, y, .3, 0], [t + .7, 220, y, 1, 1]]); });
    return s; }
};
/* 아이모두 짧은 소개 (13초: 비유 → 진짜 → 한 줄 정리) */
ART.iamodu = {
  B: () => { let s = pop(R(-56, -36, 112, 72, 10, '#FFFDF7') + R(-44, -22, 30, 36, 6, '#BFD9FA') + '<path d="M-4 -10h40M-4 4h30" stroke="#C9B48A" stroke-width="5" stroke-linecap="round"/>' + TX('출입증', 0, 60, 18, INK, 900), .3, 150, 250);
    s += pop(shadow(0, 4, 150) + P('M-140 0v-150h280v150z', '#FFFDF7') + P('M-160 -150l160-60 160 60z', '#FFC9A3') + TX('ai.jne.kr', 0, -165, 22, '#8A4B14', 900), .2, 520, 340);
    s += G(R(-40, -90, 80, 90, 6, '#C98F52'), [[.2, 520, 340, 1, 0], [.65, 520, 340, 1, 1], [1.8, 520, 340, 1, 1, 1, 1], [2.3, 482, 340, 1, 1, .08, 1]]);
    s += G(R(-56, -36, 112, 72, 10, '#FFFDF7'), [[1, 150, 250, 1, 0], [1.1, 150, 250, 1, .6], [1.8, 480, 290, .5, 0]]);
    [['도서관', 'sky', 300, 150], ['과학실', 'mint', 740, 150], ['미술실', 'peach', 290, 366], ['음악실', 'lilac', 750, 366]].forEach((r, i) => { s += G(chip(r[0], r[1], 22), [[2.4 + i * .2, 520, 280, .5, 0], [2.9 + i * .2, r[2], r[3] - 40, 1, 1]]); });
    return s + G(tag('아이모두 = 출입증 하나로 여는 건물', '#FFEEC2'), [[3.4, 520, 398, .8, 0], [3.9, 520, 394, 1, 1]], ' data-tag="1"'); },
  C: (c0) => { let s = '';
    [['ai.jne.kr', 'white', 180], ['교원(교직원) 로그인', 'sky', 470], ['도구모음', 'mint', 780]].forEach((p, i) => { s += pop(chip(p[0], p[1], 24), c0 + .3 + i * .5, p[2], 150); });
    s += arrow(262, 150, c0 + .6, 36) + arrow(650, 150, c0 + 1.1, 36);
    [['JNE GPT', 'lilac'], ['NotebookLM', 'peach'], ['미리캔버스', 'rose'], ['퀴즈앤', 'butter']].forEach((t, i) => { s += G(chip(t[0], t[1], 22), [[c0 + 2 + i * .3, 780, 150, .4, 0], [c0 + 2.5 + i * .3, 210 + i * 180, 262, 1, 1]]); });
    return s + pop(chip('처음 한 번: 간편인증 + 공동인증서 둘 다', 'butter', 20), c0 + 3.8, 480, 360); }
};

/* ================= 큰 글씨 카드 (다른 점 · 활용 · 한 줄 정리) ================= */
function bigCard(kind, lines, size) {
  const t = TONE[kind], max = Math.max.apply(null, lines.map(l => W(l, 1)));
  const sz = Math.min(size || 58, Math.floor(700 / max)); const w = Math.max(560, Math.min(860, Math.round(max * sz + 140))), h = 76 + lines.length * Math.round(sz * 1.3);
  const fill = kind === 'sum' ? '#16233A' : '#FFFDF7';
  return { sz, w, h, top: -h / 2 + 52, svg: (inner) => '<rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="30" fill="' + fill + '" stroke="' + (kind === 'sum' ? '#16233A' : INK) + '" stroke-width="3"/>' +
    '<rect x="' + (-w / 2 + 30) + '" y="' + (-h / 2) + '" width="' + (w - 60) + '" height="12" rx="6" fill="' + t[0] + '"/>' + (inner || '') };
}
const cardLines = (lines, c, fill) => lines.map((l, i) => TX(l, 0, Math.round(c.top + i * c.sz * 1.3 + c.sz * .36), c.sz, fill, 900)).join('');
const CY = 214;
function finale(d, t0) {
  const fc = bigCard('sum', d.summary, 60), l2 = d.summary[1], y1 = Math.round(CY + fc.top + fc.sz * .36), y2 = Math.round(CY + fc.top + fc.sz * 1.3 + fc.sz * .36), uw = Math.min(fc.w - 100, W(l2, fc.sz));
  return scene(t0, null, G(fc.svg(), [[t0, 480, CY + 16, .9, 0], [t0 + .45, 480, CY, 1, 1]]) + G(TX(d.summary[0], 0, 0, fc.sz, '#BFD9FA', 900), [[t0 + .3, 480, y1 + 10, 1, 0], [t0 + .7, 480, y1, 1, 1]]) +
    letterDive(l2, 480, y2, fc.sz, t0 + .6, '#FFFFFF') + underline(480 - uw / 2, y2 + fc.sz * .3, uw, t0 + 1.6, '#FFC94D') + label('한 줄 정리', 'sum'));
}
function shorts(d) {
  const art = ART[d.id], caps = d.captions; let s = '';
  const ts = Math.min(104, Math.floor(800 / W(d.term, 1))), tw = W(d.term, ts);
  s += scene(0, B0, G(chip('AI 알기', 'sky', 20), [[0, 480, 96, 1, 1]]) + letterDive(d.term, 480, 222, ts, .15) + G(TX(d.en, 0, 0, 30, '#1568D2', 800), [[.9, 480, 292, 1, 0], [1.3, 480, 282, 1, 1]]) +
    underline(480 - tw / 2, 244, tw, 1.1, '#FFC94D') + G(shadow(0, 2, 50) + '<g transform="scale(.62)">' + bot() + '</g>', [[.4, 870, 380, .9, 0], [.9, 870, 352, 1, 1]]));
  s += scene(B0, C0, art.B() + label(d.scene_label || '비유 · ' + d.analogy, 'bi'));
  s += scene(C0, D0, panel + art.C(C0) + label(d.real_label || '진짜 · ' + d.term + ' ' + d.en.split(' · ')[0], 'real'));
  const dc = bigCard('gap', d.card_gap); s += scene(D0, E0, rackFocus(dc.svg(cardLines(d.card_gap, dc, INK)), 480, CY, D0 + .1) + label(d.gap_label || '비유와 다른 점', 'gap'));
  const ec = bigCard('use', d.card_use), last = d.card_use[d.card_use.length - 1], uw = Math.min(ec.w - 120, W(last, ec.sz));
  s += scene(E0, F0, G(ec.svg(cardLines(d.card_use, ec, '#17623A')), [[E0, 480, CY + 16, .86, 0], [E0 + .5, 480, CY, 1, 1]]) +
    underline(480 - uw / 2, CY + ec.top + (d.card_use.length - 1) * ec.sz * 1.3 + ec.sz * .66, uw, E0 + .9, '#7FD1A0') + label('이렇게 써요', 'use'));
  s += finale(d, F0);
  return { body: s, caps: [[.2, caps[0]], [B0 + .1, caps[1]], [C0 + .1, caps[2]], [C0 + 3, caps[3]], [D0 + .1, caps[4]], [E0 + .1, caps[5]], [F0 + .1, caps[6]]], dur: 23, poster: B0 + 4.7 };
}
function mini(d) {
  const art = ART[d.id], c0 = 4.6, f0 = 10, caps = d.captions; let s = '';
  s += scene(0, c0, art.B() + label(d.scene_label || '비유 · ' + d.analogy, 'bi'));
  s += scene(c0, f0, panel + art.C(c0) + label(d.real_label || '진짜 · ' + d.term + ' ' + d.en, 'real'));
  s += finale(d, f0);
  return { body: s, caps: [[.2, caps[0]], [2.4, caps[1]], [c0 + .1, caps[2]], [c0 + 3.7, caps[3]], [f0 + .1, caps[4]]], dur: 13, poster: 4.2 };
}

/* ================= HTML 틀 (한 장짜리) ================= */
const CSS = 'html,body{margin:0;height:100%;overflow:hidden;background:#16233A;font-family:system-ui,-apple-system,"Segoe UI","Malgun Gothic","Apple SD Gothic Neo",sans-serif;word-break:keep-all;color-scheme:light}' +
  '#st{position:absolute;inset:0;background:#FFF4E2;cursor:pointer}svg{position:absolute;inset:0;width:100%;height:100%;display:block}' +
  '#bar{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:10px;padding:8px 12px 8px 8px;min-height:20%;background:#16233A;color:#fff;box-sizing:border-box;border-top:1px solid rgba(255,255,255,.14)}' +
  '#pp{flex:none;width:44px;height:44px;border-radius:50%;border:0;background:#fff;color:#1568D2;display:grid;place-items:center;cursor:pointer;padding:0;transition:transform .2s cubic-bezier(.22,1,.36,1)}#pp:hover{transform:scale(1.06)}#pp svg{position:static;width:22px;height:22px}' +
  '#pp:focus-visible{outline:3px solid #FFE58A;outline-offset:2px}#cap{flex:1;font-size:clamp(14px,2.8vw,22px);line-height:1.35;font-weight:700;letter-spacing:-.01em}' +
  '#cap.n{animation:cf .4s cubic-bezier(.22,1,.36,1)}@keyframes cf{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}' +
  '#pg{position:absolute;left:0;right:0;top:0;height:14px;cursor:pointer}#pg:before{content:"";position:absolute;left:0;right:0;top:0;height:4px;background:rgba(255,255,255,.24)}' +
  '#pg i{position:absolute;left:0;top:0;width:100%;height:4px;background:#FFE58A;transform-origin:left;transform:scaleX(0)}' +
  '#big{position:absolute;left:50%;top:66%;width:72px;height:72px;margin:-36px 0 0 -36px;border-radius:50%;background:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(22,35,58,.28);display:grid;place-items:center;color:#1568D2;pointer-events:none;transition:opacity .25s,transform .3s cubic-bezier(.22,1,.36,1)}#big svg{position:static;width:32px;height:32px}#big.off{opacity:0;transform:scale(.8)}' +
  '.poster #bar,.poster #big{display:none}.poster #st{cursor:default}' +
  /* 썸네일(?poster=1): 조리대 서랍은 숨기고, 「용어 = 비유」 꼬리표를 크게 띄워 그림과 용어가 함께 크게 읽히게 한다 */
  '.poster .dr{display:none}' +
  '@media (prefers-reduced-motion:reduce){#cap.n{animation:none}#pp,#big{transition:none}}' +
  '@media (min-width:700px){#cap{font-size:22px}}';
const ENGINE = '(function(){var DUR=__DUR__,CAPS=__CAPS__,POSTER=__POSTER__,THUMB="__THUMB__",TAGAT="__TAGAT__";var R=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;' +
  'var els=[].slice.call(document.querySelectorAll("[data-k]")).map(function(e){return{e:e,k:e.getAttribute("data-k").split(";").map(function(s){var p=s.split(":"),v=p[1].split(",").map(Number);return{t:+p[0],x:v[0],y:v[1],s:v[2],o:v[3],a:v.length>4?v[4]:1,b:v.length>5?v[5]:1}}),l:e.hasAttribute("data-lin")}});' +
  'var bobs=[].slice.call(document.querySelectorAll("[data-bob]"));' +
  'function ez(p){return 1-Math.pow(1-p,3)}function at(k,t,l){if(t<=k[0].t)return k[0];var n=k.length-1;if(t>=k[n].t)return k[n];for(var i=0;i<n;i++){if(t<k[i+1].t){var a=k[i],b=k[i+1],p=(t-a.t)/(b.t-a.t);if(!l)p=ez(p);return{x:a.x+(b.x-a.x)*p,y:a.y+(b.y-a.y)*p,s:a.s+(b.s-a.s)*p,o:a.o+(b.o-a.o)*p,a:a.a+(b.a-a.a)*p,b:a.b+(b.b-a.b)*p}}}return k[n]}' +
  'var cap=document.getElementById("cap"),pg=document.getElementById("pg").firstChild,pp=document.getElementById("pp"),big=document.getElementById("big");var t=0,playing=false,last=0,ci=-1,idle=false;' +
  'var IP=\'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>\',IA=\'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>\',IR=\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"/></svg>\';' +
  'function draw(){els.forEach(function(o){var v=at(o.k,t,o.l);o.e.setAttribute("transform","translate("+v.x.toFixed(1)+" "+v.y.toFixed(1)+") scale("+(v.s*v.a).toFixed(3)+" "+(v.s*v.b).toFixed(3)+")");o.e.setAttribute("opacity",v.o.toFixed(3))});' +
  'bobs.forEach(function(e,i){var y=(R||!playing)?0:Math.sin(t*2.6+i)*2.2;e.setAttribute("transform","translate(0 "+y.toFixed(2)+")")});' +
  'var c=0;for(var i=0;i<CAPS.length;i++)if(t>=CAPS[i][0])c=i;if(c!==ci){ci=c;cap.textContent=CAPS[c][1];if(!R){cap.className="";void cap.offsetWidth;cap.className="n"}}pg.style.transform="scaleX("+(t/DUR)+")"}' +
  'function ui(){var ended=t>=DUR;pp.innerHTML=playing?IA:(ended?IR:IP);pp.setAttribute("aria-label",playing?"일시정지":(ended?"처음부터 다시 보기":"재생"));big.className=playing?"off":"";big.innerHTML=ended?IR:IP}' +
  'function tick(n){if(!playing)return;t=Math.min(DUR,t+(n-last)/1000);last=n;draw();if(t>=DUR){playing=false;ui();return}requestAnimationFrame(tick)}' +
  'function step(){idle=false;var nx=null;for(var i=0;i<CAPS.length;i++)if(CAPS[i][0]>t+.01){nx=CAPS[i][0];break}if(nx===null){t=0;draw();ui();return}t=Math.min(DUR,nx+1.4);draw();ui()}' +
  'function play(){if(R){step();return}if(idle){t=0;idle=false}if(t>=DUR)t=0;playing=true;last=performance.now();ui();requestAnimationFrame(tick)}function pause(){playing=false;ui()}' +
  'function tog(){playing?pause():play()}pp.onclick=function(e){e.stopPropagation();tog()};document.getElementById("st").onclick=function(){if(!/poster=1/.test(location.search))tog()};' +
  'document.getElementById("pg").onclick=function(e){e.stopPropagation();idle=false;var r=this.getBoundingClientRect();t=Math.max(0,Math.min(DUR,(e.clientX-r.left)/r.width*DUR));draw();ui()};' +
  'document.addEventListener("keydown",function(e){if(e.key===" "&&e.target===document.body){e.preventDefault();tog()}});' +
  'var mh=/[#&]t=([0-9.]+)/.exec(location.hash),po=/poster=1/.test(location.search),au=/autoplay=1/.test(location.search);' +
  'if(po){document.documentElement.className="poster";document.querySelector("svg").setAttribute("viewBox",THUMB)}' +
  'if(mh){t=Math.min(DUR,parseFloat(mh[1]))}else if(po||R||!au){t=POSTER;idle=!po&&!R}' +
  'window.addEventListener("hashchange",function(){var m=/[#&]t=([0-9.]+)/.exec(location.hash);if(m){playing=false;idle=false;t=Math.min(DUR,parseFloat(m[1]));draw();ui();big.className="off"}});' +
  'draw();ui();if(po&&TAGAT){var tg=document.querySelector("[data-tag]"),a=TAGAT.split(" ");if(tg){tg.setAttribute("transform","translate("+a[0]+" "+a[1]+") scale("+a[2]+")");tg.setAttribute("opacity","1")}}if(au&&!po&&!mh)play();})();';


const DEFS = '<defs><filter id="bl" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="7"/></filter><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.7" fill="#C9DCF5"/></pattern></defs>';
function page(d, sc) {
  return '<!DOCTYPE html>\n<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(d.term) + ' — AI 알기 움직이는 그림</title><style>' + CSS + '</style></head><body>\n' +
    '<!-- 자동 생성: tools/gen-terms.js (글은 data/terms.json) · 외부 요청 0건 · 소리 없음 · 자막 항상 켜짐 · 자동재생 없음 (?poster=1 대표 한 장 · #t=초 멈춘 장면) -->\n' +
    '<div id="st"><svg viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(d.term) + ' 설명 그림: 비유, 진짜 작동, 다른 점, 활용 순서. 아래 자막으로 같은 내용을 읽을 수 있어요.">' + DEFS + wall + counter + sc.body + '</svg><div id="big" aria-hidden="true"></div></div>\n' +
    '<div id="bar"><button id="pp" type="button" aria-label="재생"></button><div id="cap" role="status" aria-live="off">' + esc(sc.caps[0][1]) + '</div><div id="pg" aria-hidden="true"><i></i></div></div>\n' +
    '<script>' + ENGINE.replace('__DUR__', sc.dur).replace('__CAPS__', JSON.stringify(sc.caps)).replace('__POSTER__', sc.poster).replace('__THUMB__', '0 0 960 540').replace('__TAGAT__', '480 404 1.45') + '</script></body></html>\n';
}
const bad = [];
DATA.items.concat(DATA.extras || []).forEach(d => {
  if (!ART[d.id]) { bad.push(d.id + ': 그림(ART) 없음'); return; }
  d.captions.forEach(c => { if (c.split(/\s+/).length > 12) bad.push(d.id + ': 자막 12낱말 넘음 — ' + c); });
  const sc = d.duration_sec <= 15 ? mini(d) : shorts(d);
  fs.writeFileSync(path.join(OUT, d.id + '.html'), page(d, sc));
  console.log('생성  terms/anim/' + d.id + '.html  (' + sc.dur + '초)');
});
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
