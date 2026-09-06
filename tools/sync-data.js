#!/usr/bin/env node
/* tools/sync-data.js — JSON 을 file:// 에서도 읽히는 JS 파일로 내보낸다.
 *
 * 크롬은 file:// 에서 fetch 를 CORS 로 막는다. 그래서 각 JSON 은
 * 같은 내용을 담은 <script> 파일을 짝으로 둔다. 페이지는 fetch 를 먼저 쓰고,
 * 실패하면 이 전역 변수로 대체한다.
 *
 *   node tools/sync-data.js          생성
 *   node tools/sync-data.js --check  어긋났는지만 검사 (다르면 종료코드 1)
 *
 * JSON 이 원본이다. JS 파일은 절대 손으로 고치지 마라.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAIRS = [
  { json: 'data/approval.json', js: 'data/approval.js', global: 'APPROVAL_DATA' },
  { json: 'data/showcase.json', js: 'data/showcase.js', global: 'SHOWCASE_ITEMS' },
  { json: 'data/contest.json',  js: 'data/contest.js',  global: 'CONTEST_ITEMS' },
  { json: 'data/tasks.json',    js: 'data/tasks.js',    global: 'GUIDE_TASKS' },
  { json: 'data/schedule.json', js: 'data/schedule.js', global: 'SCHEDULE_DATA' }
];

function build(pair) {
  const src = fs.readFileSync(path.join(ROOT, pair.json), 'utf8');
  const data = JSON.parse(src); // 깨진 JSON 이면 여기서 멈춘다
  return '/* 자동 생성 파일 — 손으로 고치지 마라.\n' +
    '   원본은 ' + pair.json + ' 이다. 고친 뒤 `node tools/sync-data.js` 를 돌려라.\n' +
    '   file:// 로 열었을 때 fetch 가 막히면 이 전역 변수로 대체한다. */\n' +
    'window.' + pair.global + ' = ' + JSON.stringify(data, null, 1) + ';\n';
}

const check = process.argv.indexOf('--check') !== -1;
let drift = 0;

for (const pair of PAIRS) {
  const out = build(pair);
  const dest = path.join(ROOT, pair.js);
  const cur = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : null;
  if (cur === out) {
    console.log('그대로  ' + pair.js);
    continue;
  }
  if (check) {
    console.error('어긋남  ' + pair.js + ' — `node tools/sync-data.js` 를 돌려라');
    drift++;
    continue;
  }
  fs.writeFileSync(dest, out);
  console.log('생성    ' + pair.js + '  <-  ' + pair.json);
}

if (check && drift) process.exit(1);
