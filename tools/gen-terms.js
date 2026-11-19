#!/usr/bin/env node
/* tools/gen-terms.js — terms/anim/*.html (AI 용어 여섯 편) 을 만든다.
 * 각 HTML 은 CSS·SVG·JS 가 다 들어 있는 한 장짜리 파일이라 USB 에 넣어도, 오프라인에서도 돈다.
 * 글자만 고치고 싶으면 생성된 HTML 의 자막(CAPS)·그림 글자를 메모장으로 고쳐도 된다.
 * 장면을 새로 짜고 싶을 때만 이 스크립트를 고치고 `node tools/gen-terms.js` 를 돌린다.
 * 움직임은 요소마다 data-k="시간:x,y,배율,투명도" 키프레임으로 적는다(transform·opacity 만 바뀜).
 * 보기 모드: ?autoplay=1 바로 재생 · ?poster=1 대표 한 장(자막 막대 없이, 갤러리 썸네일용) · #t=초 그 시각에 멈춘 장면.
 * 같은 그림체: 요리사 로봇 한 명 · 남색 잉크 선 3 · 크림/복숭아/민트/연보라/하늘/버터 팔레트. */
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
/* 요리사 로봇: 여섯 편 모두 같은 얼굴 */
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
const tag = (txt, fill, color) => { const w = Math.round(txt.length * 19 + 44); return '<g><rect x="' + (-w / 2) + '" y="-19" width="' + w + '" height="38" rx="19" fill="' + (fill || '#FFEEC2') + '"' + LN + '/>' + T(txt, 0, 7, 20, color || '#5B3E00', 800) + '</g>'; };
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
  [60, 270, 480, 690].map(x => '<rect x="' + x + '" y="384" width="190" height="150" rx="14" fill="#DDA466" stroke="#C98F52" stroke-width="3"/><rect x="' + (x + 76) + '" y="396" width="38" height="8" rx="4" fill="#F7D7A8"/>').join('');

/* ---------- 여섯 장면 ---------- */
const S = {};
const chefG = (x, extra) => G(bot(), [[0, x, 366, .92, 0], [.9, x, 344, 1, 1]].concat(extra || []));

S.model = {
  term: '모델', dur: 20, poster: 11,
  caps: [[0.3, '모델은 요리사예요'], [4, '수많은 요리법(글)을 보고 솜씨를 익혔어요'], [10, '하지만 어떤 요리를 할지는 주문이 와야 알아요'], [15, '그래서 AI에게 일을 시키려면 주문서가 필요해요']],
  body: () => {
    let s = chefG(630) + counter + shadow(630, 346, 84);
    s += G(books, [[3, 180, 346, .8, 0], [3.7, 180, 336, 1, 1]]);
    const xs = [[300, 130], [430, 200], [250, 220], [390, 110], [330, 280]];
    xs.forEach((p, i) => { const t = 4.2 + i * 1.1; s += G(card('요리법', 1), [[t, 180, 280, .6, 0], [t + .6, p[0], p[1], 1, 1], [t + 1.2, p[0], p[1], 1, 1], [t + 2.0, 630, 170, .3, .9], [t + 2.4, 630, 170, .2, 0]]); });
    s += G(tag('모델 = 요리사', '#FFEEC2'), [[1.2, 630, 398, .8, 0], [1.9, 630, 394, 1, 1]]);
    s += G(bubble('어떤 요리?', 176, 'r'), [[10.2, 500, 120, .6, 0], [10.9, 500, 110, 1, 1]]);
    s += G(ticket(['주문서']), [[15, 100, 280, .7, 0], [16.1, 310, 290, 1, 1]]);
    s += G(T('→', 0, 0, 44, '#1568D2', 900), [[16.7, 450, 304, .6, 0], [17.3, 450, 304, 1, 1]]);
    return s;
  }
};

S.prompt = {
  term: '프롬프트', dur: 20, poster: 16.8,
  caps: [[0.3, '손님이 주문서를 내요'], [3.8, '“맛있는 거”라고만 쓰면…'], [6.5, '요리사도 뭘 만들지 몰라 엉뚱한 음식이 나와요'], [10, '이번엔 구체적으로 적어 볼게요'], [15, '원하는 음식에 훨씬 가까워요'], [18, '프롬프트 = 주문서. 구체적일수록 좋아요']],
  body: () => {
    let s = G(person(), [[0, 130, 350, .92, 0], [.8, 130, 344, 1, 1]]) + chefG(820) + counter + shadow(130, 346, 62) + shadow(820, 346, 84);
    s += G(ticket(['맛있는 거', '주세요']), [[1, 160, 150, .8, 0], [1.6, 160, 150, 1, 1], [3.4, 400, 190, 1, 1], [4.2, 650, 205, .85, 1], [8.8, 650, 205, .85, 1], [9.4, 660, 235, .3, 0]]);
    s += G(bubble('어떤 거…?', 170, 'r'), [[5.2, 670, 112, .6, 0], [5.8, 670, 112, 1, 1], [9, 670, 112, 1, 1], [9.5, 670, 112, .8, 0]]);
    s += G(plate(oddDish), [[6.5, 480, 360, .7, 0], [7.4, 480, 340, 1, 1], [9.6, 480, 340, 1, 1], [10.1, 480, 340, .8, 0]]);
    s += G(ticket(['김치볶음밥', '계란 추가', '안 맵게']), [[10, 160, 150, .8, 0], [10.6, 160, 150, 1, 1], [12, 400, 170, 1, 1], [12.8, 650, 205, .85, 1], [14.5, 650, 205, .85, 1], [15, 660, 235, .3, 0]]);
    s += G(plate(rice), [[14.8, 480, 360, .7, 0], [15.6, 480, 340, 1.1, 1]]);
    s += G(spark, [[15.8, 560, 260, .3, 0], [16.4, 560, 250, 1.5, 1], [17.4, 560, 240, 1, 0]]) + G(spark, [[16.2, 400, 270, .3, 0], [16.8, 400, 262, 1.2, 1], [17.8, 400, 252, 1, 0]]);
    s += G(tag('프롬프트 = 주문서', '#FFEEC2'), [[18, 480, 398, .8, 0], [18.7, 480, 394, 1, 1]]);
    return s;
  }
};

const rider = (title, sub, icon) => '<g>' + R(-95, -72, 190, 160, 22, '#fff') + '<circle cy="-20" r="46" fill="#FFF4E2"/>' + icon + T(title, 0, 56, 23, INK) + T(sub, 0, 80, 17, '#5A4A36', 700) + '</g>';
S.harness = {
  term: '하네스', dur: 25, poster: 24.4,
  caps: [[0.3, '주문이 들어오면'], [3, '레시피를 꺼내고'], [6.5, '손질한 재료를 준비하고'], [10, '알맞은 도구를 놓고'], [13, '마지막에 시식으로 확인해요'], [16.5, '이 한 벌이 “하네스”예요'], [18.5, '옷·선글라스·오토바이·내비로도 비유해요'], [22.5, 'AI가 일하는 방식을 정해 주는 틀이에요']],
  body: () => {
    let s = chefG(480, [[18.2, 480, 344, 1, 1], [18.9, 480, 366, .92, 0]]) + counter + G(shadow(480, 346, 84), [[0, 0, 0, 1, 1], [18.2, 0, 0, 1, 1], [18.9, 0, 0, 1, 0]]);
    s += G(ticket(['주문서']), [[.3, 100, 130, .8, 0], [1.4, 330, 150, .95, 1], [16, 330, 150, .95, 1], [16.6, 330, 150, .8, 0]]);
    const set = [[3, 150, '레시피', card('레시피', 1)],
      [6.5, 310, '손질한 재료', E(0, -14, 44, 15, '#fff') + C(-14, -28, 10, '#F4857A') + R(4, -40, 24, 12, 6, '#FFB866') + E(-2, -18, 16, 7, '#7FD1A0')],
      [10, 650, '도구', R(-34, -34, 48, 13, 5, '#C5CEDB') + R(12, -38, 30, 22, 7, '#C98F52') + P('M-36 -6l66-5-6 15z', '#AEB9C9')],
      [13, 810, '시식', C(0, -20, 24, '#fff') + '<path d="M-11 -20l8 9 16-18" fill="none" stroke="#2E9B5C" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>']];
    set.forEach(p => { s += G('<g transform="translate(0,-8)">' + p[3] + '</g>' + (p[2] === '레시피' ? '' : T(p[2], 0, 40, 18, INK)), [[p[0], p[1], 280, .7, 0], [p[0] + .6, p[1], 322, 1, 1], [16, p[1], 322, 1, 1], [16.8, p[1], 322, .9, 0]]); });
    s += G(tag('하네스 = 주방 한 벌', '#FFEEC2'), [[16.6, 480, 398, .8, 0], [17.3, 480, 394, 1, 1]]);
    /* 비유 모음 */
    const icons = [
      [18.8, 120, '옷', '역할을 입혀요', '<path d="M-34 -42l-22 14 10 20 14-8v40h64v-40l14 8 10-20-22-14q-8 14-34 14t-34-14z" fill="#8FB6EA"' + LN + '/>'],
      [20.4, 350, '선글라스', '볼 것만 보게', '<rect x="-46" y="-32" width="40" height="28" rx="13" fill="' + INK + '"/><rect x="6" y="-32" width="40" height="28" rx="13" fill="' + INK + '"/><path d="M-8 -24h16" stroke="' + INK + '" stroke-width="5"/>'],
      [22, 580, '오토바이', '빨리 멀리 가게', '<circle cx="-34" cy="-6" r="16" fill="none" stroke="' + INK + '" stroke-width="6"/><circle cx="36" cy="-6" r="16" fill="none" stroke="' + INK + '" stroke-width="6"/><path d="M-34 -6l22-28h26l22 28M-12 -34l-4-14h-14" fill="none" stroke="#F4857A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'],
      [23.4, 810, '내비', '길을 알려줘요', '<path d="M0 8q-28-26-28-42a28 28 0 0156 0q0 16-28 42z" fill="#F4857A"' + LN + '/><circle cy="-34" r="10" fill="#fff"/>']
    ];
    icons.forEach(i => { s += G(rider(i[2], i[3], '<g transform="translate(0,-14)">' + i[4] + '</g>'), [[i[0], i[1], 215, .6, 0], [i[0] + .8, i[1], 190, 1, 1]]); });
    return s;
  }
};

S.skill = {
  term: '스킬', dur: 18, poster: 11,
  caps: [[0.3, '자주 하는 요리는 레시피 카드로 정리해 둬요'], [4, '주문이 오면 카드를 꺼내서'], [7, '1, 2, 3 순서대로 따라 해요'], [11, '다음 손님에게도 같은 순서로'], [14.5, '그래서 결과가 비슷해요']],
  body: () => {
    let s = chefG(760) + counter + shadow(760, 346, 84);
    s += G('<g>' + shadow(0, 8, 78) + R(-72, -34, 144, 70, 10, '#C98F52') + R(-60, -58, 120, 32, 6, '#FFFDF7') + T('레시피 카드함', 0, 16, 17, '#fff') + '</g>', [[0, 130, 352, .8, 0], [.7, 130, 342, 1, 1]]);
    s += G(ticket(['김치볶음밥']), [[1.2, 420, 30, .8, 0], [2, 420, 98, .9, 1], [10.4, 420, 98, .9, 1], [10.9, 420, 98, .9, 0], [11, 420, 30, .8, 0], [11.4, 420, 98, .9, 1], [14.6, 420, 98, .9, 1], [15.1, 420, 98, .9, 0]]);
    const big = '<g>' + R(-136, -88, 272, 176, 14, '#FFFDF7') + T('김치볶음밥 레시피', 0, -54, 21, '#8A4B14') +
      ['1. 재료를 썬다', '2. 볶는다', '3. 계란을 올린다'].map((t, i) => '<text x="-108" y="' + (-14 + i * 36) + '" font-size="20" font-weight="800" fill="' + INK + '">' + t + '</text>').join('') + '</g>';
    s += G(big, [[4, 160, 290, .4, 0], [5.2, 420, 210, 1, 1], [14.6, 420, 210, 1, 1], [15.2, 420, 210, 1, 0]]);
    [[7, 0], [8.3, 1], [9.6, 2]].forEach(p => { s += G(check, [[p[0], 520, 190 + p[1] * 36, .3, 0], [p[0] + .5, 520, 190 + p[1] * 36, 1, 1], [14.6, 520, 190 + p[1] * 36, 1, 1], [15.1, 520, 190 + p[1] * 36, 1, 0]]); });
    s += G(plate(rice), [[10, 600, 380, .6, 0], [10.9, 600, 340, 1, 1], [11.2, 600, 340, 1, 1], [11.9, 600, 340, 1, 0]]);
    s += G(plate(rice), [[13.8, 600, 380, .6, 0], [14.6, 600, 340, 1, 1]]);
    s += G(tag('스킬 = 레시피 카드', '#FFEEC2'), [[15.2, 480, 398, .8, 0], [15.9, 480, 394, 1, 1]]);
    return s;
  }
};

S.tool = {
  term: '도구', dur: 18, poster: 16,
  caps: [[0.3, '요리사는 말(글)로만 일하지 않아요'], [3.5, '정확히 재야 할 땐 저울(계산)'], [7, '새 재료가 필요하면 냉장고를 열어 봐요(검색)'], [10.5, '서류 묶음은 직접 펼쳐 읽어요(파일 읽기)'], [14, '알맞은 도구를 불러 쓰는 게 AI의 도구예요']],
  body: () => {
    let s = chefG(700) + counter + shadow(700, 346, 84);
    const tools = [
      [3.2, 150, '저울', '계산', P('M-46 8h92l-15-36h-62z', '#B7C3D4') + C(0, -36, 17, '#fff') + '<path d="M0 -36l8-8" stroke="#F4857A" stroke-width="4.5" stroke-linecap="round"/>', '정확한 무게!', 180],
      [6.8, 330, '냉장고', '검색', R(-30, -66, 60, 80, 9, '#DCE8F7') + '<path d="M-30 -24h60" stroke="' + INK + '" stroke-width="3"/><rect x="17" y="-52" width="6" height="18" rx="3" fill="' + INK + '"/>', '새 재료 찾았다!', 220],
      [10.3, 520, '서류철', '파일 읽기', R(-40, -54, 80, 64, 8, '#F6D58A') + '<path d="M-28 -36h56M-28 -22h56M-28 -8h36" stroke="#B88A1E" stroke-width="4" stroke-linecap="round"/>', '내용 확인!', 160]
    ];
    tools.forEach(t => {
      s += G('<g transform="translate(0,-10)">' + t[4] + '</g>' + T(t[2] + ' (' + t[3] + ')', 0, 34, 18, INK), [[t[0] - 2.4, t[1], 300, .7, 0], [t[0] - 1.7, t[1], 326, 1, 1], [t[0], t[1], 326, 1.18, 1], [t[0] + 2.8, t[1], 326, 1, 1]]);
      s += G(bubble(t[5], t[6], 'l'), [[t[0] + .6, t[1], 222, .6, 0], [t[0] + 1.3, t[1], 214, 1, 1], [t[0] + 3, t[1], 214, 1, 0]]);
    });
    s += G(tag('도구 = 주방 기구', '#FFEEC2'), [[14.2, 480, 398, .8, 0], [14.9, 480, 394, 1, 1]]);
    return s;
  }
};

S.hallucination = {
  term: '환각', dur: 22, poster: 7,
  caps: [[0.3, 'AI는 자신 있게 말해요'], [4, '하지만 없는 메뉴를 지어낼 때가 있어요(환각)'], [8.5, '그럴듯해서 속기 쉬워요'], [11.5, '그래서 돋보기로 진짜 메뉴판과 대조해요'], [16, '맞지 않으면 “확인 필요”'], [19, '중요한 내용은 공식 자료로 꼭 확인하세요']],
  body: () => {
    let s = G(person(), [[0, 120, 350, .92, 0], [.8, 120, 344, 1, 1]]) + chefG(800) + counter + shadow(120, 346, 62) + shadow(800, 346, 84);
    /* 진짜 메뉴판 */
    s += G('<g>' + R(-104, -78, 208, 156, 12, '#3B5A48') + '<rect x="-92" y="-66" width="184" height="132" rx="6" fill="none" stroke="#8FB59D" stroke-width="2" stroke-dasharray="6 6"/>' + T('진짜 메뉴판', 0, -38, 20, '#fff') + T('김치볶음밥', 0, -6, 19, '#E8F3EA', 800) + T('된장찌개', 0, 22, 19, '#E8F3EA', 800) + T('비빔밥', 0, 50, 19, '#E8F3EA', 800) + '</g>', [[10, 480, 160, .8, 0], [10.8, 480, 150, 1, 1]]);
    /* 가짜 메뉴 */
    const fake = plate(P('M-44 -2q4-46 44-46t44 46z', '#F2C94C') + C(-14, -30, 7, '#fff') + C(14, -24, 6, '#fff'));
    s += G(fake, [[1.5, 480, 366, .7, 0], [2.4, 480, 340, 1, 1], [15.6, 480, 340, 1, 1], [16.4, 480, 340, .9, 0]]);
    s += G(tag('금성산 황금 전복죽', '#FFE58A', '#5B3E00'), [[3, 480, 262, .8, 0], [3.7, 480, 258, 1, 1], [15.6, 480, 258, 1, 1], [16.2, 480, 258, .9, 0]]);
    s += G(bubble('정말 맛있어요!', 190, 'r'), [[2.8, 600, 140, .6, 0], [3.4, 600, 130, 1, 1], [8.2, 600, 130, 1, 1], [8.8, 600, 130, .8, 0]]);
    s += G(bubble('와, 먹어 볼래요', 200, 'l'), [[5.5, 300, 130, .6, 0], [6.1, 300, 122, 1, 1], [8.2, 300, 122, 1, 1], [8.8, 300, 122, .8, 0]]);
    s += G(magnifier, [[11.5, 640, 250, .6, 0], [12.4, 520, 285, 1, 1], [13.6, 470, 258, 1, 1], [14.6, 470, 150, 1, 1], [15.4, 470, 150, 1, 1], [16.2, 470, 150, .9, 0]]);
    s += G('<g transform="rotate(-8)">' + R(-86, -28, 172, 56, 12, '#FFF0EE').replace(LN, ' stroke="#C0392B" stroke-width="6" stroke-linejoin="round"') + T('확인 필요', 0, 11, 31, '#B3261E', 900) + '</g>', [[15.8, 480, 272, 1.8, 0], [16.4, 480, 272, 1, 1], [19, 480, 272, 1, 1], [19.5, 480, 272, 1, 0]]);
    s += G(plate(rice), [[17, 480, 366, .7, 0], [17.8, 480, 340, 1, 1]]);
    s += G('<circle r="23" fill="#2E9B5C"' + LN + '/><path d="M-10 0l7 8 14-16" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>', [[18.2, 570, 290, .4, 0], [18.8, 570, 290, 1, 1]]);
    s += G(tag('환각 = 그럴듯한 가짜 메뉴', '#FFEEC2'), [[19, 480, 398, .8, 0], [19.7, 480, 394, 1, 1]]);
    return s;
  }
};

/* ---------- HTML 틀 (한 장짜리) ---------- */
const CSS = 'html,body{margin:0;height:100%;overflow:hidden;background:#16233A;font-family:system-ui,-apple-system,"Segoe UI","Malgun Gothic","Apple SD Gothic Neo",sans-serif;word-break:keep-all;color-scheme:light}' +
  '#st{position:absolute;inset:0;background:#FFF4E2;cursor:pointer}svg{position:absolute;inset:0;width:100%;height:100%;display:block}' +
  '#bar{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:10px;padding:8px 12px 8px 8px;min-height:20%;background:#16233A;color:#fff;box-sizing:border-box;border-top:1px solid rgba(255,255,255,.14)}' +
  '#pp{flex:none;width:44px;height:44px;border-radius:50%;border:0;background:#fff;color:#1568D2;display:grid;place-items:center;cursor:pointer;padding:0;transition:transform .2s cubic-bezier(.22,1,.36,1)}#pp:hover{transform:scale(1.06)}#pp svg{position:static;width:22px;height:22px}' +
  '#pp:focus-visible{outline:3px solid #FFE58A;outline-offset:2px}#cap{flex:1;font-size:clamp(14px,2.8vw,22px);line-height:1.35;font-weight:700;letter-spacing:-.01em}' +
  '#cap.n{animation:cf .4s cubic-bezier(.22,1,.36,1)}@keyframes cf{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}' +
  '#pg{position:absolute;left:0;right:0;top:0;height:14px;cursor:pointer}#pg:before{content:"";position:absolute;left:0;right:0;top:0;height:4px;background:rgba(255,255,255,.24)}' +
  '#pg i{position:absolute;left:0;top:0;width:100%;height:4px;background:#FFE58A;transform-origin:left;transform:scaleX(0)}' +
  '#big{position:absolute;left:50%;top:40%;width:72px;height:72px;margin:-36px 0 0 -36px;border-radius:50%;background:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(22,35,58,.28);display:grid;place-items:center;color:#1568D2;pointer-events:none;transition:opacity .25s,transform .3s cubic-bezier(.22,1,.36,1)}#big svg{position:static;width:32px;height:32px}#big.off{opacity:0;transform:scale(.8)}' +
  '.poster #bar,.poster #big{display:none}.poster #st{cursor:default}' +
  '@media (prefers-reduced-motion:reduce){#cap.n{animation:none}#pp,#big{transition:none}}' +
  '@media (min-width:700px){#cap{font-size:22px}}';
const ENGINE = '(function(){var DUR=__DUR__,CAPS=__CAPS__,POSTER=__POSTER__;var R=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;' +
  'var els=[].slice.call(document.querySelectorAll("[data-k]")).map(function(e){return{e:e,k:e.getAttribute("data-k").split(";").map(function(s){var p=s.split(":"),v=p[1].split(",").map(Number);return{t:+p[0],x:v[0],y:v[1],s:v[2],o:v[3]}})}});' +
  'var bobs=[].slice.call(document.querySelectorAll("[data-bob]"));' +
  'function ez(p){return 1-Math.pow(1-p,3)}function at(k,t){if(t<=k[0].t)return k[0];var n=k.length-1;if(t>=k[n].t)return k[n];for(var i=0;i<n;i++){if(t<k[i+1].t){var a=k[i],b=k[i+1],p=ez((t-a.t)/(b.t-a.t));return{x:a.x+(b.x-a.x)*p,y:a.y+(b.y-a.y)*p,s:a.s+(b.s-a.s)*p,o:a.o+(b.o-a.o)*p}}}return k[n]}' +
  'var cap=document.getElementById("cap"),pg=document.getElementById("pg").firstChild,pp=document.getElementById("pp"),big=document.getElementById("big");var t=0,playing=false,last=0,ci=-1,idle=false;' +
  'var IP=\'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>\',IA=\'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>\',IR=\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"/></svg>\';' +
  'function draw(){els.forEach(function(o){var v=at(o.k,t);o.e.setAttribute("transform","translate("+v.x.toFixed(1)+" "+v.y.toFixed(1)+") scale("+v.s.toFixed(3)+")");o.e.setAttribute("opacity",v.o.toFixed(3))});' +
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
  'if(po){document.documentElement.className="poster";document.querySelector("svg").setAttribute("viewBox","20 -22 920 517.5")}' +
  'if(mh){t=Math.min(DUR,parseFloat(mh[1]))}else if(po||R||!au){t=POSTER;idle=!po&&!R}' +
  'window.addEventListener("hashchange",function(){var m=/[#&]t=([0-9.]+)/.exec(location.hash);if(m){playing=false;idle=false;t=Math.min(DUR,parseFloat(m[1]));draw();ui();big.className="off"}});' +
  'draw();ui();if(au&&!po&&!mh)play();})();';

function page(id, sc) {
  const caps = JSON.stringify(sc.caps);
  return '<!DOCTYPE html>\n<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + sc.term + ' — AI 용어, 그림으로 보기</title><style>' + CSS + '</style></head><body>\n' +
    '<!-- 자동 생성: tools/gen-terms.js · 외부 요청 0건 · 소리 없음 · 자막 항상 켜짐 · 자동재생 없음 (?poster=1 대표 한 장 · #t=초 멈춘 장면) -->\n' +
    '<div id="st"><svg viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + sc.term + ' 설명 그림. 아래 자막으로 같은 내용을 읽을 수 있어요.">' + wall + sc.body() + '</svg><div id="big" aria-hidden="true"></div></div>\n' +
    '<div id="bar"><button id="pp" type="button" aria-label="재생"></button><div id="cap" role="status" aria-live="off">' + sc.caps[0][1] + '</div><div id="pg" aria-hidden="true"><i></i></div></div>\n' +
    '<script>' + ENGINE.replace('__DUR__', sc.dur).replace('__CAPS__', caps).replace('__POSTER__', sc.poster) + '</script></body></html>\n';
}

Object.keys(S).forEach(id => {
  fs.writeFileSync(path.join(OUT, id + '.html'), page(id, S[id]));
  console.log('생성  terms/anim/' + id + '.html');
});
