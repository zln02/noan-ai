#!/usr/bin/env node
/* tools/check-copy.js — 대본이 덱에 그대로 살아 있는지 검사한다.
 *
 * tools/copy-s1-a.txt · copy-s1-b.txt 의 [SLIDE n] 블록에서 문장을 뽑아
 * training/s1.html 의 해당 슬라이드 안에 그 문장이 있는지 본다.
 * 하나라도 없으면 그 자리를 찍고 종료코드 1 로 끝난다.
 *
 *   node tools/check-copy.js          검사
 *   node tools/check-copy.js --list   뽑아낸 문장을 슬라이드별로 보여준다
 *
 * 레이아웃을 바꿀 때 이걸 통과시키는 게 규칙이다. 문장은 옮기기만 하고
 * 고치지 않는다 — CONTRACT.md 참조.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DECK = path.join(ROOT, 'training', 's1.html');
const COPY = ['copy-s1-a.txt', 'copy-s1-b.txt'].map((f) => path.join(__dirname, f));

/* 값을 담고 있는 라벨. 여기 없는 라벨은 구조 메모로 보고 건너뛴다. */
const LABELS = [
  'H1', 'H2', '아이브로우', '고민', '불릿', '도구배지', '도구한줄', '단계',
  '푸터', 'NOTES', '하단 작게', '리드', '경고', '인용', '강조', '표', '버튼',
  '체크', '안내', '소제목', '설명'
];
/* 이 조각이 들어 있으면 문장이 아니라 마크업 메모다. */
const MARKUP = ['.card', 'cols-', 'hr.', '.orb', '--ink', '--mint', '--warm', 'class=',
  'id=', 'data-', '.slide', '.demo', '.qr', '.tw', 'svg', 'px', 'loop'];

function norm(s) {
  return s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

/* 슬라이드별 텍스트 — 태그를 걷어내고 공백을 하나로 */
function deckText() {
  const src = fs.readFileSync(DECK, 'utf8');
  const out = {};
  const re = /<section\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
  let m;
  while ((m = re.exec(src))) {
    const body = m[2]
      .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ');
    const ent = (t) => t
      .replace(/&gt;/g, '>').replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');
    /* 태그를 공백으로 지운 것과 그냥 지운 것 둘 다 본다.
       <b>쓰는 법</b>을 처럼 태그가 낱말 가운데 있으면 공백판에서만 갈라진다. */
    out[m[1]] = {
      spaced: norm(ent(body.replace(/<[^>]+>/g, ' '))),
      tight: norm(ent(body.replace(/<[^>]+>/g, '')))
    };
  }
  return out;
}

/* 대본에서 (슬라이드 id, 문장) 목록을 뽑는다 */
function copySentences() {
  const items = [];
  for (const file of COPY) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    let id = null;
    let inBlock = false;
    for (const raw of lines) {
      const line = raw.replace(/\s+$/, '');
      if (!line.trim()) { inBlock = false; continue; }
      if (line.trim().startsWith('#') || line.trim().startsWith('※')) continue;

      const head = line.match(/^\[SLIDE\s+\d+[^\]]*\]\s+id=([A-Za-z0-9]+)/);
      if (head) { id = head[1]; inBlock = false; continue; }
      if (!id) continue;

      const indented = /^\s+\S/.test(raw);
      let value = null;

      const labelled = line.match(/^([^:]{1,12}):\s*(.*)$/);
      if (labelled && LABELS.includes(labelled[1].trim())) {
        value = labelled[2];
        inBlock = value === '';
      } else if (labelled && /\(.*\)\s*:?$/.test(labelled[1])) {
        /* 「부제(두 줄):」 「정보(세 줄):」 처럼 괄호가 붙은 블록 머리 */
        inBlock = true;
        value = labelled[2];
      } else if (indented && inBlock) {
        value = line.trim();
      } else if (/^CARDS/.test(line.trim())) {
        inBlock = true;
        continue;
      } else {
        inBlock = false;
        continue;
      }

      if (!value) continue;
      for (let piece of String(value).split(' / ')) {
        piece = piece.trim().replace(/^\d+\s+/, '');
        /* 대본에서 인용부호로 감싼 것은 화면에 부호 없이 나온다 */
        piece = piece.replace(/^["“'«]+/, '').replace(/["”'»]+$/, '').trim();
        if (piece.length < 4) continue;
        if (MARKUP.some((k) => piece.includes(k))) continue;
        items.push({ id, text: norm(piece) });
      }
    }
  }
  return items;
}

const deck = deckText();
const items = copySentences();

if (process.argv.includes('--list')) {
  const by = {};
  for (const it of items) (by[it.id] = by[it.id] || []).push(it.text);
  for (const id of Object.keys(by)) {
    console.log('[' + id + '] ' + by[id].length + '문장');
    by[id].forEach((t) => console.log('   ' + t));
  }
  process.exit(0);
}

let missing = 0;
for (const it of items) {
  const hay = deck[it.id];
  if (hay === undefined) {
    console.error('없는 슬라이드  ' + it.id + '  ← 대본에는 있는데 덱에 없다');
    missing++;
    continue;
  }
  if (!hay.spaced.includes(it.text) && !hay.tight.includes(norm(it.text.replace(/ /g, '')))
      && !hay.tight.includes(it.text)) {
    console.error('빠진 문장  [' + it.id + ']  ' + it.text);
    missing++;
  }
}

console.log('대본 문장 ' + items.length + '개 · 슬라이드 ' + Object.keys(deck).length + '장');
if (missing) {
  console.error('빠진 문장 ' + missing + '개 — 레이아웃을 바꾸면서 대본이 없어졌다. 되돌려라.');
  process.exit(1);
}
console.log('빠진 문장 없음');
