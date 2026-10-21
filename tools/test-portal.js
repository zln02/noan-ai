#!/usr/bin/env node
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read(file));
const exists = file => fs.existsSync(path.join(root, file));
const tasks = json('data/tasks.json');

test('업무 안내서는 찾기와 상세 열기에 필요한 실제 데이터를 갖는다', () => {
  const ids = new Set(), numbers = new Set();
  const groups = new Set(tasks.groups.map(group => group.id));
  for (const task of tasks.tasks) {
    for (const key of ['id', 'no', 'group', 'title', 'when', 'tool', 'caution']) {
      assert.ok(task[key], `${task.id}: ${key} 없음`);
    }
    assert.ok(groups.has(task.group), `${task.id}: 모르는 그룹`);
    assert.ok(Array.isArray(task.path) && task.path.length, `${task.id}: 진입 경로 없음`);
    assert.ok(Array.isArray(task.steps) && task.steps.length, `${task.id}: 단계 없음`);
    assert.ok(Array.isArray(task.keywords) && task.keywords.length, `${task.id}: 검색어 없음`);
    assert.ok(!ids.has(task.id), `${task.id}: 중복 ID`);
    assert.ok(!numbers.has(task.no), `${task.no}: 중복 번호`);
    ids.add(task.id); numbers.add(task.no);
    for (const shot of task.shot ? [].concat(task.shot) : []) {
      assert.ok(exists(`assets/guide/${shot}`), `${task.id}: 없는 캡처 ${shot}`);
    }
    assert.ok(Array.isArray(task.sources) && task.sources.length, `${task.id}: 확인 근거 없음`);
    for (const source of task.sources) {
      assert.ok(source.label && source.detail, `${task.id}: 근거 설명 부족`);
      if (source.url) assert.match(source.url, /^https:\/\//, `${task.id}: 안전하지 않은 근거 주소`);
      assert.match(source.checked, /^\d{4}-\d{2}-\d{2}$/, `${task.id}: 확인일 없음`);
    }
  }
  for (const shortcut of json('data/quicktasks.json')) {
    assert.ok(numbers.has(shortcut.no), `${shortcut.label}: 연결되지 않은 카드`);
  }
  assert.ok(numbers.has('16'), '업무 지시서 바로가기 없음');
});

test('공개 작품은 동의 기준을 갖고, 실제 도구 링크는 파일이 존재한다', () => {
  for (const item of json('data/showcase.json')) {
    assert.equal(typeof item.consent, 'boolean', '동의 여부를 명시해야 함');
  }
  const page = read('showcase/index.html');
  const links = [...page.matchAll(/href="\.\.\/(studio\/[^"#]+)"/g)].map(match => match[1]);
  assert.ok(links.length >= 3, '활용 사례에 실제 도구가 없음');
  for (const link of links) assert.ok(exists(link), `없는 도구: ${link}`);
  assert.match(page, /consent === true/, '동의 필터가 빠짐');
});

test('안내서 검색 화면과 모든 정보 페이지가 공유 스타일을 사용한다', () => {
  const home = read('index.html');
  assert.match(home, /DATA\.tasks\.length \+ '가지 전체 보기'/);
  assert.match(home, /data-no="16"/);
  for (const page of ['about/index.html', 'class/index.html', 'contest/index.html',
    'library/index.html', 'library/rules.html', 'library/approval.html',
    'request/index.html', 'showcase/index.html', 'training/index.html']) {
    assert.match(read(page), /portal-pages\.css/, `${page}: 공유 스타일 누락`);
  }
});

test('포털의 내부 이동과 이미지 주소는 게시 파일에 연결된다', () => {
  const pages = ['index.html', 'about/index.html', 'class/index.html',
    'contest/index.html', 'library/index.html', 'library/rules.html',
    'library/approval.html', 'request/index.html', 'showcase/index.html',
    'training/index.html'];
  for (const page of pages) {
    const html = read(page).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    for (const [, raw] of html.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
      if (!raw || raw.startsWith('#') || /^(https?:|mailto:|data:|javascript:)/i.test(raw)) continue;
      if (raw.includes('{') || raw.includes('$')) continue;
      const target = path.resolve(root, path.dirname(page), decodeURIComponent(raw.split(/[?#]/)[0]));
      assert.ok(fs.existsSync(target), `${page}: 없는 내부 파일 ${raw}`);
    }
  }
});
