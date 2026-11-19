#!/usr/bin/env node
/* tools/gen-home-static.js — 첫 화면(index.html)의 「자바스크립트 없이도 보이는 목록」을 data/tasks.json 으로 만든다.
 *
 * 왜: 자바스크립트가 꺼져 있거나 아주 오래된 크롬이면 Alpine(찾기·찜 목록)이 돌지 않는다.
 *     그때도 안내서 25장을 펼쳐 읽고 지시서를 손으로 복사할 수 있게, 같은 내용을 평범한 HTML 로 넣어 둔다.
 *     카드마다 id 가 번호(#02)라서 QR 주소로 들어와도 그 카드 자리로 내려간다.
 *
 *   node tools/gen-home-static.js          index.html 의 표시 사이를 다시 쓴다
 *   node tools/gen-home-static.js --check  어긋났는지만 본다 (다르면 종료코드 1)
 *
 * `node tools/sync-data.js` 를 돌리면 이것도 같이 돈다. index.html 의 표시 사이는 손으로 고치지 마라.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const START = '<!-- 정적 목록 시작 (자동 생성: node tools/gen-home-static.js — 손으로 고치지 마세요) -->';
const END = '<!-- 정적 목록 끝 -->';

const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function card(t, groups) {
  const g = groups[t.group] || {};
  const mins = t.min && t.min[1] ? ' · ' + t.min[1] + '분' : '';
  const pathLine = (t.path && t.path.length) ? '<p class="g-static-path">[ ' + t.path.map(esc).join(' &gt; ') + ' ]</p>' : '';
  const steps = (t.steps || []).map((s) => '<li>' + esc(s) + '</li>').join('');
  const prompt = t.prompt ? '<p class="g-static-lab">지시서 — 그대로 붙여넣으세요 (길게 눌러 선택 → 복사)</p><pre>' + esc(t.prompt) + '</pre>' : '';
  const caution = t.caution ? '<p class="g-static-caution"><b>꼭 확인할 것</b> ' + esc(t.caution) + '</p>' : '';
  return '<details class="g-static-card" id="' + esc(t.no) + '">' +
    '<summary><span class="g-static-no">' + esc(t.no) + '</span><span class="g-static-t"><b>' + esc(t.title) + '</b>' +
    '<span>' + esc(t.when) + '</span><small>' + esc(g.label || '') + ' · ' + esc(t.tool) + mins + (t.prompt ? ' · 지시서 있음' : '') + '</small></span></summary>' +
    '<div class="g-static-body"><p><b>추천 도구</b> ' + esc(t.tool) + '</p>' + pathLine +
    (steps ? '<ol>' + steps + '</ol>' : '') + prompt + caution + '</div></details>';
}

function build(data) {
  const groups = {};
  (data.groups || []).forEach((g) => { groups[g.id] = g; });
  return START + '\n<div class="g-static" id="gStatic">\n' +
    '<p class="g-static-note">하시려는 일을 눌러 펼치면 사용법과 지시서가 나옵니다. 종이로 보시려면 위의 인쇄용 PDF를 쓰세요.</p>\n' +
    data.tasks.map((t) => card(t, groups)).join('\n') + '\n</div>\n' + END;
}

function run(check) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tasks.json'), 'utf8'));
  const file = path.join(ROOT, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const a = html.indexOf(START), b = html.indexOf(END);
  if (a === -1 || b === -1) { console.error('index.html 에 정적 목록 표시가 없습니다'); return 1; }
  const next = html.slice(0, a) + build(data) + html.slice(b + END.length);
  if (next === html) { console.log('그대로  index.html (정적 목록)'); return 0; }
  if (check) { console.error('어긋남  index.html 정적 목록 — `node tools/gen-home-static.js` 를 돌려라'); return 1; }
  fs.writeFileSync(file, next);
  console.log('생성    index.html 정적 목록  <-  data/tasks.json');
  return 0;
}

module.exports = { run };
if (require.main === module) process.exit(run(process.argv.indexOf('--check') !== -1));
