const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('icons-raw.json', 'utf8'));

// 텍스트 배지 (simple-icons에 없거나 국내 도구). color 미상은 null -> CSS에서 --ink2
const badges = {
  openai:            { label: 'GPT',  color: '#10A37F' },
  microsoftcopilot:  { label: 'Co',   color: '#0078D4' },
  canva:             { label: 'Cv',   color: '#00C4CC' },
  adobe:             { label: 'Ad',   color: '#FF0000' },
  capcut:            { label: 'Cc',   color: '#111111' },
  microsoft:         { label: 'MS',   color: '#5E5E5E' },
  wrtn:              { label: '뤼튼', color: null },
  clovax:            { label: '클X',  color: '#03C75A' },
  clovanote:         { label: '클노', color: '#03C75A' },
  clovadubbing:      { label: '더빙', color: '#03C75A' },
  miricanvas:        { label: '미리', color: '#3B5BFF' },
  vrew:              { label: '브루', color: null },
  thinkerbell:       { label: '띵커', color: null },
  padlet:            { label: '패들', color: '#ED5A5A' },
  entry:             { label: '엔트', color: null },
  classting:         { label: '클팅', color: null },
  classeum:          { label: '이음', color: null },
  imodu:             { label: '아이', color: null },
  gamma:             { label: 'Ga',   color: null },
  mentimeter:        { label: '멘티', color: '#196CFF' },
  notebooklm:        { label: 'NL',   color: '#4285F4' },
  teachablemachine:  { label: '티처', color: null },
  typecast:          { label: '타입', color: null },
  midjourney:        { label: 'MJ',   color: '#111111' },
  dalle:             { label: 'DE',   color: '#10A37F' },
  runway:            { label: 'Rw',   color: '#111111' },
  sora:              { label: 'So',   color: '#111111' },
  cursor:            { label: 'Cu',   color: '#111111' },
  claudecode:        { label: 'CC',   color: '#191919' }
};

const paths = {};
for (const k of Object.keys(raw)) if (raw[k]) paths[k] = raw[k];

const j = (o) => JSON.stringify(o, null, 2).replace(/\n/g, '\n  ');

const src = `/* shared/icons.js — 아이콘 사전 (외부 요청 0건)
 * PATHS: simple-icons(CC0)에서 추출한 SVG path. viewBox="0 0 24 24".
 * BADGES: simple-icons에 없는 브랜드 + 국내 도구. 브랜드색 근사치이며
 *         color:null 은 --ink2 로 렌더된다. [색상 확인 필요]
 * 사용: NoanIcons.render(slug, size) -> SVG 문자열
 */
(function (global) {
  'use strict';

  var PATHS = ${j(paths)};

  var BADGES = ${j(badges)};

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* 아이콘 또는 텍스트 배지 SVG 문자열. 없는 slug는 회색 배지로 폴백 */
  function render(slug, size) {
    var s = size || 28;
    var ico = PATHS[slug];
    if (ico) {
      return '<svg class="ico" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" ' +
        'role="img" aria-label="' + esc(slug) + '" focusable="false">' +
        '<path fill="' + ico.color + '" d="' + ico.path + '"/></svg>';
    }
    var b = BADGES[slug] || { label: slug.slice(0, 2).toUpperCase(), color: null };
    var bg = b.color || 'var(--ink2)';
    var len = b.label.length;
    var fs = len >= 3 ? 8.2 : 9.5;
    return '<svg class="ico ico-badge" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" ' +
      'role="img" aria-label="' + esc(b.label) + '" focusable="false">' +
      '<rect width="24" height="24" rx="5" fill="' + bg + '"/>' +
      '<text x="12" y="12" text-anchor="middle" dominant-baseline="central" ' +
      'font-size="' + fs + '" font-weight="700" fill="#fff" ' +
      'font-family="system-ui, Malgun Gothic, sans-serif">' +
      esc(b.label) + '</text></svg>';
  }

  /* [data-icon="slug"] 요소를 전부 채운다 */
  function mount(root) {
    var nodes = (root || document).querySelectorAll('[data-icon]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.getAttribute('data-icon-done')) continue;
      el.innerHTML = render(el.getAttribute('data-icon'), +el.getAttribute('data-icon-size') || 28);
      el.setAttribute('data-icon-done', '1');
    }
  }

  global.NoanIcons = { render: render, mount: mount, PATHS: PATHS, BADGES: BADGES };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { mount(); });
  } else {
    mount();
  }
})(window);
`;
fs.writeFileSync('../shared/icons.js', src, 'utf8');
console.log('written shared/icons.js');
