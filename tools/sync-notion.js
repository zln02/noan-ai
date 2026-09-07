#!/usr/bin/env node
/* tools/sync-notion.js — 노션 「📅 활동 기록」 을 data/log.json 으로 내린다.
 *
 *   NOTION_TOKEN=... NOTION_LOG_DB=... node tools/sync-notion.js
 *   node tools/sync-notion.js --dry     받아만 오고 파일은 안 쓴다
 *
 * 규칙 셋. 이건 편의가 아니라 안전장치다.
 *
 * 1. 토큰은 환경변수로만 읽는다. 저장소에도, 브라우저에도 남기지 않는다.
 * 2. 사진·산출물 / 다음 액션 / 성취기준 연계 는 내보내지 않는다.
 *    학생 얼굴과 내부 메모다. 필드 이름을 여기 적어두는 것으로 끝나지 않고,
 *    아래 PICK 에 있는 것만 통과시킨다(허용 목록 방식).
 * 3. what · issue 에 사람 이름으로 보이는 것이 있으면 **쓰지 않고 멈춘다.**
 *    완벽한 탐지가 목적이 아니다. 한 번 멈춰 세워 사람이 보게 하는 게 목적이다.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'data', 'log.json');
const TOKEN = process.env.NOTION_TOKEN;
const DB = process.env.NOTION_LOG_DB;
const DRY = process.argv.includes('--dry');

/* 내보낼 필드만. 여기 없는 것은 노션에 있어도 안 나간다. */
const PICK = ['title', 'date', 'kind', 'audience', 'period', 'what', 'issue',
  'tools', 'minutes', 'report'];

/* 노션 속성 이름 -> JSON 키 */
const MAP = {
  '활동명': 'title',
  '날짜': 'date',
  '구분': 'kind',
  '대상': 'audience',
  '차시': 'period',
  '무엇을 했나': 'what',
  '문제·해결': 'issue',
  '사용 도구': 'tools',
  '소요 시간(분)': 'minutes',
  '보고서 반영': 'report'
};

/* 「홍길동 선생님」 「김철수 학생」 처럼 이름으로 보이는 것.
   아래 낱말이 이름 자리에 오면 이름이 아니다. */
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
    case 'multi_select': return prop.multi_select.map((s) => s.name);
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
    if (!PICK.includes(key)) continue;
    const v = plain(page.properties[notionName]);
    if (v !== null && v !== undefined) out[key] = v;
  }
  /* 대상은 학년만 남긴다. 반·이름이 섞여 들어오면 학년만 걸러낸다. */
  if (Array.isArray(out.audience)) {
    out.audience = out.audience
      .map((s) => String(s).trim())
      .filter((s) => /^[1-3]학년$|^교사$|^전교$/.test(s));
  }
  return out;
}

async function main() {
  if (!TOKEN || !DB) {
    console.error('환경변수가 없다. NOTION_TOKEN 과 NOTION_LOG_DB 를 주고 실행해라.');
    console.error('  NOTION_TOKEN=... NOTION_LOG_DB=... node tools/sync-notion.js');
    console.error('토큰을 파일에 적지 마라. 저장소에 남는다.');
    process.exit(2);
  }

  const pages = await fetchAll();
  const records = pages.map(toRecord).filter((r) => r.title || r.date);

  /* 이름 검사 — 하나라도 걸리면 아무것도 쓰지 않는다 */
  const hits = [];
  records.forEach((r, i) => {
    for (const field of ['what', 'issue']) {
      const hit = looksLikeName(r[field]);
      if (hit) hits.push({ i: i + 1, date: r.date || '(날짜 없음)', field, hit, title: r.title });
    }
  });
  if (hits.length) {
    console.error('사람 이름으로 보이는 것이 있다. 아무것도 쓰지 않고 멈춘다.');
    for (const h of hits) {
      console.error('  ' + h.i + '번째 · ' + h.date + ' · ' + h.field + ' · 「' + h.hit + '」  (' + (h.title || '') + ')');
    }
    console.error('노션에서 그 자리를 지우거나 「담당 선생님」 처럼 바꾼 뒤 다시 돌려라.');
    process.exit(1);
  }

  records.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  if (DRY) {
    console.log('받아온 기록 ' + records.length + '건. --dry 라 파일은 안 썼다.');
    return;
  }
  fs.writeFileSync(OUT, JSON.stringify(records, null, 1) + '\n');
  console.log('data/log.json 에 ' + records.length + '건. 이어서 `node tools/sync-data.js` 를 돌려라.');
  console.log('내보내지 않은 것: 사진·산출물 / 다음 액션 / 성취기준 연계');
}

main().catch((e) => {
  console.error(String(e.message || e));
  process.exit(1);
});
