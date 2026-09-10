#!/usr/bin/env node
/* tools/sync-requests.js — 노션 「요청 게시판」 을 data/requests.json 으로 내린다.
 *
 *   NOTION_TOKEN=... NOTION_REQUESTS_DB=... node tools/sync-requests.js
 *   node tools/sync-requests.js --dry     받아만 오고 파일은 안 쓴다
 *
 * tools/sync-notion.js 와 같은 규칙을 쓴다. 편의가 아니라 안전장치다.
 *
 * 1. 토큰은 환경변수로만 읽는다. 저장소에도, 브라우저에도 남기지 않는다.
 * 2. 「공개」 가 켜진 줄만 내보낸다. 선생님이 보낸 원문이 곧바로 학교 사이트에
 *    올라가지 않는다. 코디네이터가 한 번 보고 켜야 나간다.
 * 3. 제목·내용·답변에 사람 이름으로 보이는 것이 있으면 **쓰지 않고 멈춘다.**
 *    완벽한 탐지가 목적이 아니다. 한 번 멈춰 세워 사람이 보게 하는 게 목적이다.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'data', 'requests.json');
const TOKEN = process.env.NOTION_TOKEN;
const DB = process.env.NOTION_REQUESTS_DB;
const DRY = process.argv.includes('--dry');

/* 노션 속성 이름 -> JSON 키. 여기 없는 것은 노션에 있어도 안 나간다. */
const MAP = {
  '제목': 'title',
  '내용': 'body',
  '유형': 'tag',
  '상태': 'status',
  '소속': 'dept',
  '공감': 'count',
  '답변': 'answer',
  '공개': 'public',
  '올린 날': 'date'
};

/* 이름 검사 — sync-notion.js 와 같은 목록을 쓴다. */
const NOT_A_NAME = new Set([
  '우리', '저희', '담당', '해당', '교과', '학년', '학급', '전체', '모든', '여러',
  '교감', '교장', '부장', '행정', '보건', '영양', '상담', '특수', '기간', '신규',
  '선생', '학생', '어머', '아버', '학부'
]);
const NAME_RE = /([가-힣]{2,4})\s*(선생님|샘|님|학생)/g;

function looksLikeName(text) {
  if (!text) return null;
  let m;
  NAME_RE.lastIndex = 0;
  while ((m = NAME_RE.exec(text))) {
    const who = m[1];
    if (NOT_A_NAME.has(who)) continue;
    if (NOT_A_NAME.has(who.slice(0, 2))) continue;
    return m[0];
  }
  return null;
}

function plain(prop) {
  if (!prop) return null;
  switch (prop.type) {
    case 'title': return prop.title.map((t) => t.plain_text).join('').trim() || null;
    case 'rich_text': return prop.rich_text.map((t) => t.plain_text).join('').trim() || null;
    case 'date': return prop.date ? prop.date.start : null;
    case 'select': return prop.select ? prop.select.name : null;
    case 'number': return prop.number;
    case 'checkbox': return prop.checkbox;
    default: return null;
  }
}

async function fetchAll() {
  const rows = [];
  let cursor;
  do {
    const res = await fetch('https://api.notion.com/v1/databases/' + DB + '/query', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cursor ? { start_cursor: cursor } : {})
    });
    if (!res.ok) {
      throw new Error('노션이 ' + res.status + ' 로 답했다. 토큰과 DB 아이디를 보라.');
    }
    const json = await res.json();
    rows.push.apply(rows, json.results);
    cursor = json.has_more ? json.next_cursor : null;
  } while (cursor);
  return rows;
}

function toRecord(page) {
  const out = {};
  for (const [notionName, key] of Object.entries(MAP)) {
    const v = plain(page.properties[notionName]);
    if (v !== null && v !== undefined) out[key] = v;
  }
  /* 아이디는 노션 쪽 아이디에서 딴다. 동기화를 다시 돌려도 같은 값이라
     브라우저에 저장된 공감 표시가 엉뚱한 줄로 옮겨가지 않는다. */
  out.id = String(page.id).replace(/-/g, '').slice(0, 12);
  if (!out.date) out.date = String(page.created_time || '').slice(0, 10);
  return out;
}

async function main() {
  if (!TOKEN || !DB) {
    console.error('환경변수가 없다. NOTION_TOKEN 과 NOTION_REQUESTS_DB 를 주고 실행해라.');
    console.error('  NOTION_TOKEN=... NOTION_REQUESTS_DB=... node tools/sync-requests.js');
    console.error('토큰을 파일에 적지 마라. 저장소에 남는다.');
    process.exit(2);
  }

  const pages = await fetchAll();
  const all = pages.map(toRecord).filter((r) => r.title);
  const open = all.filter((r) => r.public === true);

  /* 이름 검사 — 하나라도 걸리면 아무것도 쓰지 않는다 */
  const hits = [];
  open.forEach((r, i) => {
    for (const field of ['title', 'body', 'answer']) {
      const hit = looksLikeName(r[field]);
      if (hit) hits.push({ i: i + 1, field, hit, title: r.title });
    }
  });
  if (hits.length) {
    console.error('사람 이름으로 보이는 것이 있다. 아무것도 쓰지 않고 멈춘다.');
    for (const h of hits) {
      console.error('  ' + h.i + '번째 · ' + h.field + ' · 「' + h.hit + '」  (' + h.title + ')');
    }
    console.error('노션에서 그 자리를 지우거나 「담당 선생님」 처럼 바꾼 뒤 다시 돌려라.');
    process.exit(1);
  }

  /* 새 것이 위로 */
  open.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const items = open.map((r) => ({
    id: r.id,
    tag: r.tag || '도움 요청',
    status: r.status || '검토 중',
    count: Number(r.count) || 0,
    title: r.title,
    body: r.body || '',
    dept: r.dept || '',
    date: r.date || '',
    answer: r.answer || ''
  }));

  /* meta·statuses·tags 는 손으로 정한 값이다. 덮어쓰지 않는다. */
  const cur = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  cur.items = items;
  cur.meta.updated = new Date().toISOString().slice(0, 10);

  const skipped = all.length - open.length;

  if (DRY) {
    console.log('받아온 줄 ' + all.length + '건 중 공개 ' + open.length + '건. --dry 라 파일은 안 썼다.');
    return;
  }

  fs.writeFileSync(OUT, JSON.stringify(cur, null, 1) + '\n');
  console.log('data/requests.json 에 ' + items.length + '건.' +
    (skipped ? ' 「공개」 가 꺼진 ' + skipped + '건은 안 내보냈다.' : ''));
  console.log('이어서 `node tools/sync-data.js` 를 돌려라.');
}

main().catch((e) => {
  console.error(String(e.message || e));
  process.exit(1);
});
