#!/usr/bin/env node
/* tools/gen-terms.js — terms/anim/*.html (AI 용어 여섯 편) 을 만든다.
 * 각 HTML 은 CSS·SVG·JS 가 다 들어 있는 한 장짜리 파일이라 USB 에 넣어도, 오프라인에서도 돈다.
 * 글자만 고치고 싶으면 생성된 HTML 의 자막(CAPS)·그림 글자를 메모장으로 고쳐도 된다.
 * 장면을 새로 짜고 싶을 때만 이 스크립트를 고치고 `node tools/gen-terms.js` 를 돌린다.
 * 움직임은 요소마다 data-k="시간:x,y,배율,투명도,회전" 키프레임으로 적는다(transform·opacity 만 바뀜). */
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'terms', 'anim');
fs.mkdirSync(OUT, { recursive: true });

/* ---------- 키프레임 도우미 ---------- */
const kf = (...f) => f.map(a => a[0] + ':' + a.slice(1).join(',')).join(';');
const G = (inner, k, extra) => '<g data-k="' + kf.apply(null, k) + '"' + (extra || '') + '>' + inner + '</g>';
/* 나타났다 사라지기: 시작, 끝 시각, 위치, 크기 */
const show = (t0, t1, x, y, s) => { s = s || 1; const a = [[t0, x, y + 24, s * .7, 0], [t0 + .6, x, y, s, 1]]; if (t1) a.push([t1, x, y, s, 1], [t1 + .5, x, y, s * .9, 0]); return a; };
const T = (txt, x, y, size, fill, w) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + (size || 22) + '" font-weight="' + (w || 800) + '" fill="' + (fill || '#5B4A36') + '">' + txt + '</text>';

/* ---------- 납작한 그림 부품 (원점 기준) ---------- */
const chef = (o) => {
  o = o || {};
  return '<g>' +
    '<path d="M-52 0V-84q0-34 52-34t52 34V0z" fill="#fff" stroke="#E3D6C4" stroke-width="3"/>' +
    '<rect x="-30" y="-74" width="60" height="74" rx="10" fill="#F6B3C8"/><path d="M-12 -118l12 22 12-22" fill="none" stroke="#E3D6C4" stroke-width="3"/>' +
    '<circle cy="-152" r="34" fill="#F6D3B3"/>' +
    '<path d="M-36 -172q-24-34 6-44q8-26 26-10q16-16 28 6q30 2 18 48z" fill="#fff" stroke="#E3D6C4" stroke-width="3"/><rect x="-37" y="-176" width="74" height="12" rx="5" fill="#fff" stroke="#E3D6C4" stroke-width="3"/>' +
    (o.shades ? '<rect x="-27" y="-160" width="24" height="14" rx="6" fill="#16233A"/><rect x="3" y="-160" width="24" height="14" rx="6" fill="#16233A"/><path d="M-3 -153h6" stroke="#16233A" stroke-width="3"/>' :
      '<circle cx="-12" cy="-152" r="3.6" fill="#3A2E24"/><circle cx="12" cy="-152" r="3.6" fill="#3A2E24"/>') +
    '<circle cx="-22" cy="-138" r="5" fill="#F6B3C8" opacity=".8"/><circle cx="22" cy="-138" r="5" fill="#F6B3C8" opacity=".8"/>' +
    '<path d="M-9 -136q9 8 18 0" fill="none" stroke="#3A2E24" stroke-width="3" stroke-linecap="round"/></g>';
};
const person = (c) => '<g><path d="M-36 0V-60q0-26 36-26t36 26V0z" fill="' + (c || '#7FA7DD') + '"/><circle cy="-112" r="28" fill="#F2C9A5"/><path d="M-28 -122q4-24 28-22t28 22q-14-10-28-8t-28 8z" fill="#5B4A36"/><circle cx="-10" cy="-110" r="3.2" fill="#3A2E24"/><circle cx="10" cy="-110" r="3.2" fill="#3A2E24"/><path d="M-8 -98q8 7 16 0" fill="none" stroke="#3A2E24" stroke-width="3" stroke-linecap="round"/></g>';
const ticket = (lines, fill) => '<g><rect x="-86" y="-54" width="172" height="' + (28 + lines.length * 26) + '" rx="10" fill="' + (fill || '#FFFDF7') + '" stroke="#D9C9A8" stroke-width="3"/><circle cx="0" cy="-54" r="7" fill="#E26A6A"/>' +
  lines.map((l, i) => T(l, 0, -22 + i * 26, 19, '#5B4A36', 700)).join('') + '</g>';
const card = (title, n) => '<g><rect x="-62" y="-42" width="124" height="84" rx="9" fill="#FFFDF7" stroke="#D9C9A8" stroke-width="3"/>' + T(title, 0, -14, 17, '#8A5A1E') + '<rect x="-44" y="0" width="88" height="6" rx="3" fill="#E5D8BF"/><rect x="-44" y="14" width="64" height="6" rx="3" fill="#E5D8BF"/>' + (n ? '<rect x="-44" y="28" width="76" height="6" rx="3" fill="#E5D8BF"/>' : '') + '</g>';
const plate = (food) => '<g><ellipse cy="6" rx="72" ry="16" fill="#fff" stroke="#E3D6C4" stroke-width="3"/><ellipse cy="-2" rx="52" ry="11" fill="#F7EEDD"/>' + food + '</g>';
const rice = '<path d="M-42 -4q4-44 42-44t42 44z" fill="#FFD27A"/><circle cx="-14" cy="-28" r="6" fill="#E26A6A"/><circle cx="12" cy="-20" r="5" fill="#6BBE8A"/><circle cx="2" cy="-38" r="6" fill="#fff" stroke="#F2B84B" stroke-width="3"/>';
const oddDish = '<path d="M-40 -4q-6-34 20-30t20-10q24 6 18 40z" fill="#B9BEC7"/>' + T('?', 0, -10, 34, '#fff');
const tag = (txt, fill, color) => '<g><rect x="-' + (txt.length * 11 + 14) + '" y="-18" width="' + (txt.length * 22 + 28) + '" height="34" rx="17" fill="' + (fill || '#FFEEC2') + '"/>' + T(txt, 0, 6, 19, color || '#6B4E00') + '</g>';
const bubble = (txt, w) => '<g><rect x="' + (-(w || 150) / 2) + '" y="-30" width="' + (w || 150) + '" height="52" rx="20" fill="#fff" stroke="#C9B6F8" stroke-width="3"/><path d="M-10 22l-6 16 22-16z" fill="#fff" stroke="#C9B6F8" stroke-width="3"/>' + T(txt, 0, 4, 20, '#6D3ED6') + '</g>';
const magnifier = '<g><circle r="30" fill="rgba(185,213,248,.35)" stroke="#1568D2" stroke-width="7"/><path d="M22 22l34 34" stroke="#1568D2" stroke-width="11" stroke-linecap="round"/></g>';
const spark = '<path d="M0-12l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#FFE58A"/>';

/* 배경: 벽 + 조리대. 조리대는 요리사 위에 덮는다 */
const wall = '<rect width="960" height="540" fill="#FFF4E2"/><rect y="0" width="960" height="330" fill="#FFF4E2"/><rect y="330" width="960" height="210" fill="#F3DFC1"/><circle cx="80" cy="70" r="26" fill="#FFE9B5" opacity=".7"/><rect x="760" y="50" width="130" height="86" rx="12" fill="#E6F1FF" stroke="#C3D6EE" stroke-width="3"/><path d="M825 50v86M760 93h130" stroke="#C3D6EE" stroke-width="3"/>';
const counter = '<rect x="0" y="342" width="960" height="26" fill="#E9C58F"/><rect x="0" y="368" width="960" height="72" fill="#D9A96A"/><path d="M0 368h960" stroke="#C68F4E" stroke-width="3"/>';

/* ---------- 여섯 장면 ---------- */
const S = {};

S.model = {
  term: '모델', dur: 20,
  caps: [[0.3, '모델은 요리사예요'], [4, '수많은 요리법(글)을 보고 솜씨를 익혔어요'], [10, '하지만 어떤 요리를 할지는 주문이 와야 알아요'], [15, '그래서 AI에게 일을 시키려면 주문서가 필요해요']],
  body: () => {
    let s = G(chef(), [[0, 480, 392, .6, 0], [.9, 480, 342, 1, 1]]);
    s += counter;
    s += G(tag('모델 = 요리사', '#FFEEC2'), [[1.2, 480, 408, .8, 0], [1.8, 480, 408, 1, 1]]);
    const xs = [[110, 200], [840, 170], [90, 300], [860, 290], [180, 120]];
    xs.forEach((p, i) => { const t = 4 + i * 1.1; s += G(card('요리법', 1), [[t, p[0], p[1], .8, 0], [t + .4, p[0], p[1], 1, 1], [t + 1.5, 480, 190, .35, .9], [t + 1.9, 480, 190, .2, 0]]); });
    s += G(bubble('어떤 요리?', 170), [[10, 650, 150, .6, 0], [10.6, 650, 150, 1, 1]]);
    s += G(ticket(['주문서']), [[15, 860, 300, .7, 0], [16, 720, 300, 1, 1]]);
    s += G(T('→', 0, 0, 40, '#1568D2'), [[16.5, 620, 306, .6, 0], [17, 620, 306, 1, 1]]);
    return s;
  }
};

S.prompt = {
  term: '프롬프트', dur: 20,
  caps: [[0.3, '손님이 주문서를 내요'], [3.8, '“맛있는 거”라고만 쓰면…'], [6.5, '요리사도 뭘 만들지 몰라 엉뚱한 음식이 나와요'], [10, '이번엔 구체적으로 적어 볼게요'], [15, '원하는 음식에 훨씬 가까워요'], [18, '프롬프트 = 주문서. 구체적일수록 좋아요']],
  body: () => {
    let s = G(person(), [[0, 130, 342, 1, 1]]) + G(chef(), [[0, 830, 342, 1, 1]]) + counter;
    s += G(ticket(['맛있는 거', '주세요']), [[1, 150, 250, .8, 0], [1.4, 150, 250, 1, 1], [3.4, 480, 200, 1, 1], [4, 690, 200, .85, 1], [8.8, 690, 200, .85, 1], [9.4, 700, 230, .3, 0]]);
    s += G(bubble('어떤 거…?', 150), [[5.2, 730, 150, .6, 0], [5.8, 730, 150, 1, 1], [9, 730, 150, 1, 1], [9.5, 730, 150, .8, 0]]);
    s += G(plate(oddDish), [[6.5, 480, 340 + 20, .7, 0], [7.4, 480, 340, 1, 1], [9.6, 480, 340, 1, 1], [10.1, 480, 340, .8, 0]]);
    s += G(ticket(['김치볶음밥', '계란 추가', '안 맵게']), [[10, 150, 250, .8, 0], [10.5, 150, 250, 1, 1], [12, 480, 190, 1, 1], [12.8, 690, 195, .85, 1], [14.5, 690, 195, .85, 1], [15, 700, 225, .3, 0]]);
    s += G(plate(rice), [[14.8, 480, 360, .7, 0], [15.6, 480, 340, 1.1, 1]]);
    s += G(spark, [[15.8, 540, 270, .3, 0], [16.2, 540, 270, 1.4, 1], [17.2, 540, 260, 1, 0]]) + G(spark, [[16.2, 420, 280, .3, 0], [16.6, 420, 280, 1.1, 1], [17.6, 420, 270, 1, 0]]);
    s += G(tag('프롬프트 = 주문서', '#FFEEC2'), [[18, 480, 410, .8, 0], [18.6, 480, 410, 1, 1]]);
    return s;
  }
};

const rider = (title, sub, icon) => '<g><rect x="-98" y="-70" width="196" height="150" rx="18" fill="#fff" stroke="#E3D6C4" stroke-width="3"/>' + icon + T(title, 0, 52, 22, '#5B4A36') + T(sub, 0, 74, 15, '#7A6A55', 700) + '</g>';
S.harness = {
  term: '하네스', dur: 25,
  caps: [[0.3, '주문이 들어오면'], [3, '레시피를 꺼내고'], [6.5, '손질한 재료를 준비하고'], [10, '알맞은 도구를 놓고'], [13, '마지막에 시식으로 확인해요'], [16.5, '이 한 벌이 “하네스”예요'], [18.5, '옷·선글라스·오토바이·내비로도 비유해요'], [22.5, 'AI가 일하는 방식을 정해 주는 틀이에요']],
  body: () => {
    let s = G(chef(), [[0, 480, 342, 1, 1]]) + counter;
    s += G(ticket(['주문서']), [[.3, 480, 20, .8, 0], [1, 480, 100, .8, 1], [16, 480, 100, .8, 1], [16.6, 480, 100, .8, 0]]);
    const set = [[3, 300, '레시피', card('레시피', 1)], [6.5, 410, '손질한 재료', '<ellipse cy="-14" rx="40" ry="14" fill="#fff" stroke="#E3D6C4" stroke-width="3"/><circle cx="-14" cy="-26" r="9" fill="#E26A6A"/><rect x="2" y="-36" width="22" height="10" rx="5" fill="#F29A3A"/><ellipse cx="-4" cy="-18" rx="14" ry="6" fill="#6BBE8A"/>'], [10, 550, '도구', '<rect x="-30" y="-30" width="44" height="12" rx="4" fill="#B9C2CF"/><rect x="14" y="-34" width="26" height="20" rx="6" fill="#8A5A1E"/><path d="M-34 -4l62-4-6 14z" fill="#9AA7B8"/>'], [13, 660, '시식', '<circle cy="-18" r="20" fill="#fff" stroke="#E3D6C4" stroke-width="3"/><path d="M-10 -18l7 8 14-16" fill="none" stroke="#2E9B5C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>']];
    set.forEach(p => { s += G('<g transform="translate(0,-8)">' + p[3] + '</g>' + (p[2] === '레시피' ? '' : T(p[2], 0, 28, 17, '#5B4A36')), [[p[0], p[1], 250, .7, 0], [p[0] + .5, p[1], 338, 1, 1], [16, p[1], 338, 1, 1], [16.8, p[1], 338, .9, 0]]); });
    s += G(tag('하네스 = 주방 한 벌', '#FFEEC2'), [[16.6, 480, 410, .8, 0], [17.2, 480, 410, 1, 1]]);
    /* 비유 모음 */
    const icons = [
      [18.8, 190, '옷', '역할을 입혀요', '<path d="M-34 -40l-22 14 10 20 14-8v40h64v-40l14 8 10-20-22-14q-8 14-34 14t-34-14z" fill="#7FA7DD"/>'],
      [20.4, 400, '선글라스', '볼 것만 보게', '<rect x="-46" y="-30" width="40" height="26" rx="12" fill="#16233A"/><rect x="6" y="-30" width="40" height="26" rx="12" fill="#16233A"/><path d="M-8 -22h16" stroke="#16233A" stroke-width="5"/>'],
      [22, 610, '오토바이', '빨리 멀리 가게', '<circle cx="-34" cy="-6" r="16" fill="none" stroke="#5B4A36" stroke-width="6"/><circle cx="36" cy="-6" r="16" fill="none" stroke="#5B4A36" stroke-width="6"/><path d="M-34 -6l22-28h26l22 28M-12 -34l-4-14h-14" fill="none" stroke="#E26A6A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'],
      [23.4, 820, '내비', '길을 알려줘요', '<path d="M0 6q-28-26-28-42a28 28 0 0156 0q0 16-28 42z" fill="#E26A6A"/><circle cy="-36" r="10" fill="#fff"/>']
    ];
    icons.forEach(i => { s += G(rider(i[2], i[3], '<g transform="translate(0,-14)">' + i[4] + '</g>'), [[i[0], i[1], 175, .6, 0], [i[0] + .6, i[1], 165, .92, 1]]); });
    return s;
  }
};

S.skill = {
  term: '스킬', dur: 18,
  caps: [[0.3, '자주 하는 요리는 레시피 카드로 정리해 둬요'], [4, '주문이 오면 카드를 꺼내서'], [7, '1, 2, 3 순서대로 따라 해요'], [11, '다음 손님에게도 같은 순서로'], [14.5, '그래서 결과가 비슷해요']],
  body: () => {
    let s = G(chef(), [[0, 620, 342, 1, 1]]) + counter;
    s += G('<rect x="-70" y="-30" width="140" height="64" rx="8" fill="#C68F4E"/><rect x="-60" y="-52" width="120" height="30" rx="5" fill="#FFFDF7" stroke="#D9C9A8" stroke-width="3"/>' + T('레시피 카드함', 0, 20, 16, '#fff'), [[0, 130, 340, .8, 0], [.6, 130, 340, 1, 1]]);
    s += G(ticket(['김치볶음밥']), [[1.2, 330, 40, .8, 0], [2, 330, 110, .9, 1], [10.4, 330, 110, .9, 1], [10.9, 330, 110, .9, 0], [11, 330, 40, .8, 0], [11.4, 330, 110, .9, 1], [14.6, 330, 110, .9, 1], [15.1, 330, 110, .9, 0]]);
    const big = '<g><rect x="-132" y="-84" width="264" height="168" rx="12" fill="#FFFDF7" stroke="#D9C9A8" stroke-width="3"/>' + T('김치볶음밥 레시피', 0, -52, 20, '#8A5A1E') +
      ['1. 재료를 썬다', '2. 볶는다', '3. 계란을 올린다'].map((t, i) => '<text x="-104" y="' + (-14 + i * 34) + '" font-size="19" font-weight="700" fill="#5B4A36">' + t + '</text>').join('') + '</g>';
    s += G(big, [[4, 130, 290, .4, 0], [5, 400, 250, 1, 1], [14.6, 400, 250, 1, 1], [15.2, 400, 250, 1, 0]]);
    [[7, 0], [8.3, 1], [9.6, 2]].forEach(p => { s += G('<path d="M-10 0l8 9 16-18" fill="none" stroke="#2E9B5C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>', [[p[0], 512, 236 + p[1] * 34, .3, 0], [p[0] + .4, 512, 236 + p[1] * 34, 1, 1], [14.6, 512, 236 + p[1] * 34, 1, 1], [15.1, 512, 236 + p[1] * 34, 1, 0]]); });
    s += G(plate(rice), [[10, 420, 380, .6, 0], [10.9, 420, 336, 1, 1], [11.2, 420, 336, 1, 1], [11.9, 420, 336, 1, 0]]);
    s += G(plate(rice), [[13.8, 420, 380, .6, 0], [14.6, 420, 336, 1, 1]]);
    s += G(tag('스킬 = 레시피 카드', '#FFEEC2'), [[15.2, 480, 410, .8, 0], [15.8, 480, 410, 1, 1]]);
    return s;
  }
};

S.tool = {
  term: '도구', dur: 18,
  caps: [[0.3, '요리사는 말(글)로만 일하지 않아요'], [3.5, '정확히 재야 할 땐 저울(계산)'], [7, '새 재료가 필요하면 냉장고를 열어 봐요(검색)'], [10.5, '서류 묶음은 직접 펼쳐 읽어요(파일 읽기)'], [14, '알맞은 도구를 불러 쓰는 게 AI의 도구예요']],
  body: () => {
    let s = G(chef(), [[0, 480, 342, 1, 1]]) + counter;
    const tools = [
      [3.2, 210, '저울', '계산', '<path d="M-44 6h88l-14-34h-60z" fill="#9AA7B8"/><circle cy="-34" r="16" fill="#fff" stroke="#5B4A36" stroke-width="4"/><path d="M0 -34l8-8" stroke="#E26A6A" stroke-width="4" stroke-linecap="round"/>', '정확한 무게!'],
      [6.8, 350, '냉장고', '검색', '<rect x="-30" y="-64" width="60" height="76" rx="8" fill="#DCE8F7" stroke="#9AB4D6" stroke-width="4"/><path d="M-30 -22h60" stroke="#9AB4D6" stroke-width="4"/><rect x="18" y="-50" width="5" height="18" rx="2" fill="#9AB4D6"/>', '새 재료 찾았다!'],
      [10.3, 750, '서류철', '파일 읽기', '<rect x="-40" y="-52" width="80" height="62" rx="7" fill="#F6D58A" stroke="#D9B04A" stroke-width="4"/><path d="M-28 -34h56M-28 -20h56M-28 -6h36" stroke="#B88A1E" stroke-width="4" stroke-linecap="round"/>', '내용 확인!']
    ];
    tools.forEach(t => {
      s += G('<g transform="translate(0,-10)">' + t[4] + '</g>' + T(t[2] + ' (' + t[3] + ')', 0, 28, 16, '#5B4A36'), [[t[0] - 2.4, t[1], 300, .7, 0], [t[0] - 1.8, t[1], 330, 1, 1], [t[0], t[1], 330, 1.18, 1], [t[0] + 2.8, t[1], 330, 1, 1]]);
      s += G(bubble(t[5], 190), [[t[0] + .6, t[1], 232, .6, 0], [t[0] + 1.2, t[1], 232, 1, 1], [t[0] + 3, t[1], 232, 1, 0]]);
    });
    s += G(tag('도구 = 주방 기구', '#FFEEC2'), [[14.2, 480, 410, .8, 0], [14.8, 480, 410, 1, 1]]);
    return s;
  }
};

S.hallucination = {
  term: '환각', dur: 22,
  caps: [[0.3, 'AI는 자신 있게 말해요'], [4, '하지만 없는 메뉴를 지어낼 때가 있어요(환각)'], [8.5, '그럴듯해서 속기 쉬워요'], [11.5, '그래서 돋보기로 진짜 메뉴판과 대조해요'], [16, '맞지 않으면 “확인 필요”'], [19, '중요한 내용은 공식 자료로 꼭 확인하세요']],
  body: () => {
    let s = G(person(), [[0, 130, 342, 1, 1]]) + G(chef(), [[0, 600, 342, 1, 1]]) + counter;
    /* 진짜 메뉴판 */
    s += G('<rect x="-100" y="-74" width="200" height="150" rx="10" fill="#2F4A3A"/><rect x="-100" y="-74" width="200" height="150" rx="10" fill="none" stroke="#C68F4E" stroke-width="6"/>' + T('진짜 메뉴판', 0, -42, 18, '#fff') + T('김치볶음밥', 0, -10, 17, '#E8F3EA', 700) + T('된장찌개', 0, 18, 17, '#E8F3EA', 700) + T('비빔밥', 0, 46, 17, '#E8F3EA', 700), [[10, 360, 160, .8, 0], [10.8, 360, 160, 1, 1]]);
    /* 가짜 메뉴 */
    const fake = '<g>' + plate('<path d="M-44 -4q4-44 44-44t44 44z" fill="#F2C94C"/><circle cx="-14" cy="-30" r="7" fill="#fff" opacity=".9"/><circle cx="14" cy="-24" r="6" fill="#fff" opacity=".9"/>') + '</g>';
    s += G(fake, [[1.5, 400, 370, .7, 0], [2.4, 400, 340, 1, 1], [15.6, 400, 340, 1, 1], [16.4, 400, 340, .9, 0]]);
    s += G(tag('금성산 황금 전복죽', '#FFE58A', '#6B4E00'), [[3, 400, 262, .8, 0], [3.6, 400, 262, 1, 1], [15.6, 400, 262, 1, 1], [16.2, 400, 262, 0.9, 0]]);
    s += G(bubble('정말 맛있어요!', 190), [[2.8, 600, 120, .6, 0], [3.4, 600, 120, 1, 1], [8.2, 600, 120, 1, 1], [8.8, 600, 120, .8, 0]]);
    s += G(bubble('와, 먹어 볼래요', 190), [[5.5, 160, 150, .6, 0], [6.1, 160, 150, 1, 1], [8.2, 160, 150, 1, 1], [8.8, 160, 150, .8, 0]]);
    s += G(magnifier, [[11.5, 600, 250, .6, 0], [12.2, 460, 290, 1, 1], [13.6, 400, 300, 1, 1], [14.6, 360, 160, 1, 1], [15.4, 360, 160, 1, 1], [16.2, 360, 160, .9, 0]]);
    s += G('<g transform="rotate(-10)"><rect x="-82" y="-26" width="164" height="52" rx="10" fill="none" stroke="#C0392B" stroke-width="6"/>' + T('확인 필요', 0, 11, 30, '#C0392B', 900) + '</g>', [[15.8, 400, 250, 1.8, 0], [16.2, 400, 250, 1, 1], [19, 400, 250, 1, 1], [19.5, 400, 250, 1, 0]]);
    s += G(plate(rice), [[17, 400, 370, .7, 0], [17.8, 400, 340, 1, 1]]);
    s += G('<circle r="22" fill="#2E9B5C"/><path d="M-10 0l7 8 14-16" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>', [[18.2, 470, 290, .4, 0], [18.7, 470, 290, 1, 1]]);
    s += G(tag('환각 = 그럴듯한 가짜 메뉴', '#FFEEC2'), [[19, 480, 410, .8, 0], [19.6, 480, 410, 1, 1]]);
    return s;
  }
};

/* ---------- HTML 틀 (한 장짜리) ---------- */
const CSS = 'html,body{margin:0;height:100%;overflow:hidden;background:#16233A;font-family:system-ui,-apple-system,"Segoe UI","Malgun Gothic","Apple SD Gothic Neo",sans-serif;word-break:keep-all}' +
  '#st{position:absolute;inset:0;background:#FFF4E2;cursor:pointer}svg{position:absolute;inset:0;width:100%;height:100%;display:block}' +
  '#bar{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:8px;padding:6px 8px;min-height:20%;background:rgba(22,35,58,.92);color:#fff;box-sizing:border-box}' +
  '#pp{flex:none;width:44px;height:44px;border-radius:50%;border:0;background:#fff;color:#1568D2;display:grid;place-items:center;cursor:pointer;padding:0}#pp svg{position:static;width:22px;height:22px}' +
  '#pp:focus-visible{outline:3px solid #FFE58A;outline-offset:2px}#cap{flex:1;font-size:max(12px,2.9vw);line-height:1.3;font-weight:700}' +
  '#pg{position:absolute;left:0;right:0;bottom:0;height:4px;background:rgba(255,255,255,.25);cursor:pointer}#pg i{display:block;height:100%;width:100%;background:#FFE58A;transform-origin:left;transform:scaleX(0)}' +
  '#big{position:absolute;left:50%;top:40%;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;background:rgba(255,255,255,.95);display:grid;place-items:center;pointer-events:none;transition:opacity .2s}#big svg{position:static;width:30px;height:30px}#big.off{opacity:0}' +
  '@media (min-width:700px){#cap{font-size:20px}}';
const ENGINE = '(function(){var DUR=__DUR__,CAPS=__CAPS__;var R=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;' +
  'var els=[].slice.call(document.querySelectorAll("[data-k]")).map(function(e){return{e:e,k:e.getAttribute("data-k").split(";").map(function(s){var p=s.split(":"),v=p[1].split(",").map(Number);return{t:+p[0],x:v[0],y:v[1],s:v[2],o:v[3]}})}});' +
  'function ez(p){return p*p*(3-2*p)}function at(k,t){if(t<=k[0].t)return k[0];var n=k.length-1;if(t>=k[n].t)return k[n];for(var i=0;i<n;i++){if(t<k[i+1].t){var a=k[i],b=k[i+1],p=ez((t-a.t)/(b.t-a.t));return{x:a.x+(b.x-a.x)*p,y:a.y+(b.y-a.y)*p,s:a.s+(b.s-a.s)*p,o:a.o+(b.o-a.o)*p}}}return k[n]}' +
  'var cap=document.getElementById("cap"),pg=document.getElementById("pg").firstChild,pp=document.getElementById("pp"),big=document.getElementById("big");var t=0,playing=false,last=0,ci=-1;' +
  'var IP=\'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>\',IA=\'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>\',IR=\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"/></svg>\';' +
  'function draw(){els.forEach(function(o){var v=at(o.k,t);o.e.setAttribute("transform","translate("+v.x.toFixed(1)+" "+v.y.toFixed(1)+") scale("+v.s.toFixed(3)+")");o.e.setAttribute("opacity",v.o.toFixed(3))});var c=0;for(var i=0;i<CAPS.length;i++)if(t>=CAPS[i][0])c=i;if(c!==ci){ci=c;cap.textContent=CAPS[c][1]}pg.style.transform="scaleX("+(t/DUR)+")"}' +
  'function ui(){var ended=t>=DUR;pp.innerHTML=playing?IA:(ended?IR:IP);pp.setAttribute("aria-label",playing?"일시정지":(ended?"처음부터 다시 보기":"재생"));big.className=playing?"off":"";big.innerHTML=ended?IR:IP}' +
  'function tick(n){if(!playing)return;t=Math.min(DUR,t+(n-last)/1000);last=n;draw();if(t>=DUR){playing=false;ui();return}requestAnimationFrame(tick)}' +
  'function step(){var nx=null;for(var i=0;i<CAPS.length;i++)if(CAPS[i][0]>t+.01){nx=CAPS[i][0];break}if(nx===null){t=0;draw();ui();return}t=Math.min(DUR,nx+1.4);draw();ui()}' +
  'function play(){if(R){step();return}if(t>=DUR)t=0;playing=true;last=performance.now();ui();requestAnimationFrame(tick)}function pause(){playing=false;ui()}' +
  'function tog(){playing?pause():play()}pp.onclick=function(e){e.stopPropagation();tog()};document.getElementById("st").onclick=tog;' +
  'document.getElementById("pg").onclick=function(e){e.stopPropagation();var r=this.getBoundingClientRect();t=Math.max(0,Math.min(DUR,(e.clientX-r.left)/r.width*DUR));draw();ui()};' +
  'document.addEventListener("keydown",function(e){if(e.key===" "&&e.target===document.body){e.preventDefault();tog()}});' +
  't=R?CAPS[0][0]+1.4:0;draw();ui();if(/autoplay=1/.test(location.search))play();})();';

function page(id, sc) {
  const caps = JSON.stringify(sc.caps);
  return '<!DOCTYPE html>\n<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + sc.term + ' — AI 용어, 그림으로 보기</title><style>' + CSS + '</style></head><body>\n' +
    '<!-- 자동 생성: tools/gen-terms.js · 외부 요청 0건 · 소리 없음 · 자막 항상 켜짐 · 자동재생 없음 -->\n' +
    '<div id="st"><svg viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + sc.term + ' 설명 그림. 아래 자막으로 같은 내용을 읽을 수 있어요.">' + wall + sc.body() + '</svg><div id="big" aria-hidden="true"></div></div>\n' +
    '<div id="bar"><button id="pp" type="button" aria-label="재생"></button><div id="cap" role="status" aria-live="off">' + sc.caps[0][1] + '</div><div id="pg" aria-hidden="true"><i></i></div></div>\n' +
    '<script>' + ENGINE.replace('__DUR__', sc.dur).replace('__CAPS__', caps) + '</script></body></html>\n';
}

Object.keys(S).forEach(id => {
  fs.writeFileSync(path.join(OUT, id + '.html'), page(id, S[id]));
  console.log('생성  terms/anim/' + id + '.html');
});
