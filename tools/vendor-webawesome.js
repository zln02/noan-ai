#!/usr/bin/env node
/*
 * tools/vendor-webawesome.js — Web Awesome(무료·MIT) 부품 몇 개만 골라 한 파일로 묶는다.
 *
 * 왜: 크롬은 file:// 에서 <script type="module"> 을 막는다. 그래서 ESM 부품을
 *     평범한 <script> 한 개(즉시 실행 함수)로 바꿔 shared/vendor/webawesome/ 에 넣어 둔다.
 *     사이트를 돌리는 데는 이 도구가 필요 없다(이미 만든 파일이 저장소에 있다).
 *     Web Awesome 을 새 판으로 바꿀 때만 한 번 돌린다. 외부 도구(npm 패키지) 없이 node 만 쓴다.
 *
 * 쓰는 법:
 *   npm pack @awesome.me/webawesome@3.15.0   (아무 빈 폴더에서) → 압축을 푼다
 *   node tools/vendor-webawesome.js <압축 푼 폴더>/package
 *
 * 동작: dist-cdn/ 의 ESM 파일(esbuild 가 만든 규칙적인 import/export 줄)을 읽어
 *       작은 모듈 등록기(__d/__r)로 감싼다. 동적 import() 를 쓰는 자동 불러오기(loader)는 넣지 않는다.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const PKG = process.argv[2];
if (!PKG) { console.error('사용법: node tools/vendor-webawesome.js <webawesome package 폴더>'); process.exit(1); }
const CDN = path.join(PKG, 'dist-cdn');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'shared', 'vendor', 'webawesome');

// 쓰는 부품만 (늘리려면 여기 한 줄)
const COMPONENTS = ['tab-group', 'tab', 'tab-panel', 'details', 'tooltip', 'copy-button', 'progress-bar', 'dialog'];
const ENTRIES = ['components/icon/library.js', 'chunks/chunk.HOKYDFUG.js']
  .concat(COMPONENTS.map(c => `components/${c}/${c}.js`));

const KEEP_ICONS = ['check', 'chevron-down', 'chevron-left', 'chevron-right', 'copy', 'xmark', 'circle-question', 'circle-info'];
const mods = new Map(); // id -> code
const order = [];

function rel(id) { return path.relative(CDN, id).split(path.sep).join('/'); }

function load(file) {
  const id = path.resolve(file);
  if (mods.has(id)) return rel(id);
  mods.set(id, null);
  let src = fs.readFileSync(id, 'utf8');
  const head = [];
  const deps = [];
  const resolveDep = s => { const d = path.resolve(path.dirname(id), s); deps.push(d); return rel(d); };
  const names = list => list.split(',').map(s => s.trim()).filter(Boolean);

  // import { a, b as c } from "x";
  src = src.replace(/^import\s*\{([^}]*)\}\s*from\s*"([^"]+)";?/gm, (m, list, s) => {
    const r = resolveDep(s);
    const parts = names(list).map(n => { const k = n.split(/\s+as\s+/); return k[1] ? `${k[0]}: ${k[1]}` : k[0]; });
    head.push(`var { ${parts.join(', ')} } = __r(${JSON.stringify(r)});`);
    return '';
  });
  // import x from "y";
  src = src.replace(/^import\s+([\w$]+)\s+from\s*"([^"]+)";?/gm, (m, n, s) => {
    head.push(`var ${n} = __r(${JSON.stringify(resolveDep(s))}).default;`); return '';
  });
  // import "x";
  src = src.replace(/^import\s*"([^"]+)";?/gm, (m, s) => { head.push(`__r(${JSON.stringify(resolveDep(s))});`); return ''; });
  if (/^\s*import[\s{*]/m.test(src)) throw new Error('처리 못 한 import: ' + rel(id));
  // export { a, b as c };
  const ex = [];
  src = src.replace(/^export\s*\{([^}]*)\};?/gm, (m, list) => {
    names(list).forEach(n => { const k = n.split(/\s+as\s+/); ex.push(`${JSON.stringify(k[1] || k[0])}: function () { return ${k[0]}; }`); });
    return '';
  });
  src = src.replace(/^export default /m, () => { ex.push('"default": function () { return __default; }'); return 'var __default = '; });
  if (/^export\s/m.test(src)) throw new Error('처리 못 한 export: ' + rel(id));
  if (/\bimport\(/.test(src)) console.warn('동적 import() 가 남아 있음(쓰지 않는 길이어야 함): ' + rel(id));
  src = src.replace(/import\.meta\.url/g, '""');
  // 내장 아이콘 묶음은 부품이 실제로 쓰는 몇 개만 남긴다(약 60KB 절약). 아이콘은 Font Awesome Free(CC BY 4.0) — SVG 안의 출처 주석은 그대로 둔다
  if (/var icons = \{\s*\/\//.test(src)) {
    src = src.replace(/^    (?:"([a-z-]+)"|([a-z]+)): `<svg[^`]*`,?\n/gm, (m, a, b) => (KEEP_ICONS.indexOf(a || b) >= 0 ? m : ''));
  }
  // 파일마다 붙은 같은 저작권 머리말은 맨 위 한 번만
  src = src.replace(/^\/\*! Copyright \d+ Fonticons, Inc\. - https:\/\/webawesome\.com\/license \*\/\n/m, '');

  // 의존 파일 먼저 읽는다
  deps.forEach(d => load(d));
  const code = `__d(${JSON.stringify(rel(id))}, function (__e) {\n__x(__e, { ${ex.join(', ')} });\n${head.join('\n')}\n${src}\n});`;
  mods.set(id, code);
  order.push(id);
  return rel(id);
}

ENTRIES.forEach(e => load(path.join(CDN, e)));

const ver = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8')).version;
const prelude = `/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license
 * Web Awesome ${ver} (free, MIT) — 부품 ${COMPONENTS.length}개만 묶은 판. LICENSE.md 참고. 내장 아이콘은 Font Awesome Free(CC BY 4.0).
 * 만든 도구: tools/vendor-webawesome.js — 손으로 고치지 마세요. */
(function () {
'use strict';
var __defs = {}, __cache = {};
function __d(id, fn) { __defs[id] = fn; }
function __x(e, g) { Object.keys(g).forEach(function (k) { Object.defineProperty(e, k, { get: g[k], enumerable: true }); }); }
function __r(id) { if (__cache[id]) return __cache[id]; var e = __cache[id] = {}; __defs[id](e); return e; }
`;
const tail = `
var ICON = __r("components/icon/library.js");
// 외부 요청 0건: 기본 아이콘 묶음(Font Awesome CDN)은 끈다. 부품 안의 아이콘은 모두 "system"(내장 SVG)
ICON.registerIconLibrary("default", { resolver: function () { return ""; } });
var L10N = __r("chunks/chunk.HOKYDFUG.js");
L10N.registerTranslation({ $code: "ko", $name: "한국어", $dir: "ltr", close: "닫기", copy: "복사", copied: "복사했어요", error: "복사하지 못했어요", currentValue: "현재 값", progress: "진행", scrollToStart: "처음으로", scrollToEnd: "끝으로", showMore: "더 보기", showLess: "접기" });
${COMPONENTS.map(c => `__r("components/${c}/${c}.js");`).join('\n')}
window.NOAN_WA = "${ver}";
})();
`;
fs.mkdirSync(OUT, { recursive: true });
const body = order.map(id => mods.get(id)).join('\n');
fs.writeFileSync(path.join(OUT, 'webawesome.js'), prelude + body + tail);

// 테마 CSS: 층(layers) + 기본 팔레트 + 기본 테마 + 색 변형. native.css(전역 태그 꾸밈)는 넣지 않는다
const css = ['styles/layers.css', 'styles/color/palettes/default.css'].concat(['brand', 'neutral', 'success', 'warning', 'danger'].map(v => `styles/color/variants/${v}.css`), ['styles/themes/default.css'])
  .map(f => fs.readFileSync(path.join(CDN, f), 'utf8').replace(/^@import[^;]+;\s*/gm, ''))
  .join('\n');
fs.writeFileSync(path.join(OUT, 'webawesome.css'), `/*! Web Awesome ${ver} (free, MIT) — 테마 CSS(층·기본 팔레트·색 변형·기본 테마). 만든 도구: tools/vendor-webawesome.js */\n` + css);
fs.copyFileSync(path.join(PKG, 'LICENSE.md'), path.join(OUT, 'LICENSE.md'));
console.log('webawesome.js', fs.statSync(path.join(OUT, 'webawesome.js')).size, 'bytes,', order.length, 'modules');
console.log('webawesome.css', fs.statSync(path.join(OUT, 'webawesome.css')).size, 'bytes');
