# tools/gen-pages.py — 새 하위 페이지(아이모두·AI·용어·3D 풀이·시작 가이드)의 뼈대를 만든다.
# 한 번 만들고 끝나는 도구가 아니라, 머리글·탭바 구조를 바꿀 때 다시 돌려 한 번에 맞추는 용도다.
# 실행: python tools/gen-pages.py   (이후에는 각 index.html 을 메모장으로 직접 고쳐도 된다)
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 쪽 머리 일러스트(움직이는 인라인 SVG). 쪽 이름 → 그림
ART_A = '<svg class="slot-art" viewBox="0 0 190 150" aria-hidden="true" focusable="false"><g class="sa-float"><rect x="30" y="22" width="130" height="96" rx="14" fill="#fff" stroke="#B9D5F8" stroke-width="3"/><rect x="30" y="22" width="130" height="22" rx="14" fill="#E0ECFF"/><circle cx="46" cy="33" r="3.5" fill="#F6B3C8"/><circle cx="58" cy="33" r="3.5" fill="#F5DA9B"/><circle cx="70" cy="33" r="3.5" fill="#A9DCC0"/><rect x="46" y="56" width="28" height="22" rx="7" fill="#FFE9D2"/><rect x="81" y="56" width="28" height="22" rx="7" fill="#D8F2E2"/><rect x="116" y="56" width="28" height="22" rx="7" fill="#E9E0FF"/><rect x="46" y="86" width="28" height="22" rx="7" fill="#FFD9E3"/><rect x="81" y="86" width="28" height="22" rx="7" fill="#E0ECFF"/><rect x="116" y="86" width="28" height="22" rx="7" fill="#FFEEC2"/></g><g class="sa-float2"><circle cx="164" cy="30" r="9" fill="#FFE58A"/><circle cx="26" cy="118" r="6" fill="#C9B6F8"/></g></svg>'
ART_B = '<svg class="slot-art" viewBox="0 0 190 150" aria-hidden="true" focusable="false"><g class="sa-float"><line x1="95" y1="30" x2="95" y2="42" stroke="#3B82F6" stroke-width="4" stroke-linecap="round"/><circle cx="95" cy="26" r="6" fill="#F6B3C8"/><rect x="52" y="42" width="86" height="68" rx="22" fill="#fff" stroke="#B9D5F8" stroke-width="3"/><rect x="62" y="54" width="66" height="40" rx="14" fill="#E0ECFF"/><g class="sa-blink"><circle cx="80" cy="73" r="6.5" fill="#1568D2"/><circle cx="110" cy="73" r="6.5" fill="#1568D2"/></g><path d="M86 86q9 7 18 0" fill="none" stroke="#1568D2" stroke-width="3.2" stroke-linecap="round"/></g><g class="sa-float2"><rect x="128" y="14" width="54" height="30" rx="12" fill="#F7F4FF" stroke="#C9B6F8" stroke-width="2.5"/><circle class="sa-dot" cx="143" cy="29" r="3.2" fill="#6D3ED6"/><circle class="sa-dot" cx="155" cy="29" r="3.2" fill="#6D3ED6"/><circle class="sa-dot" cx="167" cy="29" r="3.2" fill="#6D3ED6"/></g></svg>'
ART_C = '<svg class="slot-art" viewBox="0 0 190 150" aria-hidden="true" focusable="false"><g class="sa-float"><rect x="24" y="30" width="142" height="80" rx="14" fill="#16233A"/><rect x="24" y="30" width="142" height="80" rx="14" fill="none" stroke="#B9D5F8" stroke-width="3"/><circle cx="95" cy="70" r="20" fill="#fff"/><path d="M89 60l18 10-18 10z" fill="#1568D2"/></g><g class="sa-float2"><circle cx="30" cy="26" r="7" fill="#F6B3C8"/><circle cx="166" cy="124" r="9" fill="#A9DCC0"/></g><g class="sa-spin"><path d="M160 24l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FFE58A"/></g></svg>'
ART = {'iamodu': ART_A, 'start': ART_A, 'ai': ART_B, 'terms': ART_C, 'how-ai-answers': ART_C}


def page(path, title, desc, body, scripts=""):
    full = os.path.join(ROOT, path)
    body = body.replace('<section class="page-hero">', '<section class="page-hero">' + ART.get(path.split('/')[0], ''), 1)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    html = f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} · 노안중 AI교육</title>
<meta name="description" content="{desc}">
<meta name="robots" content="noindex">
<link rel="icon" href="../assets/noan-ai-icon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="../assets/noan-ai-touch-180.png">
<link rel="manifest" href="../manifest.webmanifest">
<meta name="theme-color" content="#1568D2">
<link rel="stylesheet" href="../shared/tokens.css">
<link rel="stylesheet" href="../shared/site.css">
<link rel="stylesheet" href="../shared/portal.css">
<link rel="stylesheet" href="../shared/app.css">
<script src="../shared/app.js"></script>
</head>
<body class="portal">
<a class="skip" href="#main">본문으로</a>
<header class="p-header">
  <div class="p-wrap p-header-inner">
    <a class="p-brand" href="../index.html" aria-label="노안중학교 AI교육 홈">
      <img src="../assets/logo.png" alt="노안중학교" width="120" height="40">
      <span class="p-brand-name">AI교육 포털</span>
    </a>
    <nav class="p-nav" aria-label="주요 메뉴">
      <a class="p-nav-cta" href="https://ai.jne.kr/" target="_blank" rel="noopener">아이모두 바로가기</a>
    </nav>
  </div>
</header>
<main id="main" class="wrap">
{body}
</main>
{scripts}
</body>
</html>
'''
    with open(full, 'w', encoding='utf8', newline='\n') as f:
        f.write(html)


def write(path, text):
    with open(os.path.join(ROOT, path), 'w', encoding='utf8', newline='\n') as f:
        f.write(text)


SOON = '<span class="soon">내용 준비 중</span>'
LINK = 'style="text-decoration:none;color:inherit"'

page('iamodu/index.html', '아이모두 완전 정복', '아이모두에 무엇이 들어 있는지, 어떻게 로그인하는지, 어떤 일에 어떤 도구를 쓰는지 한곳에 모은 안내', f'''
<section class="page-hero"><h1>아이모두 완전 정복</h1>
<p>아이모두(ai.jne.kr)에 무엇이 들어 있고, 어떻게 들어가며, 어떤 일에 무엇을 쓰는지 한곳에서 봅니다.</p>{SOON}</section>
<div class="toc">
 <a class="panel" href="../index.html#00" {LINK}><h2>1. 들어가기 — 로그인과 인증</h2><p>처음 한 번 하는 계정 인증. 안내서 카드 00번에 있습니다.</p></a>
 <section class="panel"><h2>2. 안에 무엇이 있나</h2><p>도구모음 · 에이전트 · 학교 메뉴 지도. (정리 예정)</p></section>
 <section class="panel"><h2>3. 어떤 일에 어떤 도구</h2><p>업무별 안내서 25장과 이어지는 한 장짜리 표. (정리 예정)</p></section>
 <section class="panel"><h2>4. 막혔을 때</h2><p>안 열릴 때, 권한이 없을 때, 누구에게 물을지. (정리 예정)</p></section>
</div>
<p><a class="btn btn-primary" href="https://ai.jne.kr/" target="_blank" rel="noopener">아이모두 열기</a></p>
''')

page('ai/index.html', 'AI 활용 안내', '주요 AI 서비스를 확인한 날짜와 함께 한눈에 보는 안내', f'''
<section class="page-hero"><h1>AI 활용 안내</h1>
<p>AI 서비스는 자주 바뀝니다. 모든 항목에 「확인한 날」을 적고, 확인하지 않은 것은 「확인 전」이라고 보여 줍니다.</p>{SOON}</section>
<div id="models" class="model-list" aria-live="polite"><p>불러오는 중…</p></div>
<section class="toc" style="margin-top:24px">
 <a class="panel" href="../terms/index.html" {LINK}><h2>AI 용어, 그림으로 보기</h2><p>움직이는 그림으로 길을 따라가며 이해합니다.</p></a>
 <a class="panel" href="../how-ai-answers/index.html" {LINK}><h2>AI는 어떻게 답을 만들까</h2><p>입력부터 답까지 여섯 걸음, 음식에 빗대어.</p></a>
</section>
''', '''<script src="../data/ai-models.js"></script>
<script src="ai.js"></script>''')

write('ai/ai.js', '''/* ai/ai.js — data/ai-models.json 을 카드로 그린다 (막히면 AI_MODELS_DATA) */
(function () {
  'use strict';
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function row(k, v) { return '<dt>' + k + '</dt><dd>' + (v ? esc(v) : '<span class="checked">확인 전</span>') + '</dd>'; }
  function draw(data) {
    var box = document.getElementById('models');
    if (!data || !data.items) { box.textContent = '자료를 불러오지 못했습니다.'; return; }
    box.innerHTML = data.items.map(function (m) {
      return '<article class="model"><h2>' + esc(m.name) + '</h2>' +
        '<span class="chip">' + esc(m.kind) + (m.maker ? ' · ' + esc(m.maker) : '') + '</span>' +
        '<dl>' + row('한 줄', m.summary) + row('잘하는 일', m.good_for) + row('아이모두 안에', m.in_aimodu) + '</dl>' +
        '<p class="checked">확인한 날: ' + (m.checked ? esc(m.checked) : '확인 전') + '</p></article>';
    }).join('');
  }
  fetch('../data/ai-models.json').then(function (r) { return r.json(); })
    .catch(function () { return window.AI_MODELS_DATA; }).then(draw);
})();
''')

page('terms/index.html', 'AI 용어, 그림으로 보기', 'AI 용어를 가로 화면의 움직이는 그림으로 설명하는 모음', f'''
<section class="page-hero"><h1>AI 용어, 그림으로 보기</h1>
<p>글로만 어려운 말을 움직이는 그림으로 봅니다. 눌러야 재생되고, 소리는 기본으로 꺼져 있으며, 자막은 항상 나옵니다.</p>{SOON}</section>
<div id="terms" class="term-grid" aria-live="polite"><p>불러오는 중…</p></div>
<p style="margin-top:24px"><a class="btn" href="../how-ai-answers/index.html">AI는 어떻게 답을 만들까 보러 가기</a></p>
''', '''<script src="../data/terms.js"></script>
<script src="terms.js"></script>''')

write('terms/terms.js', '''/* terms/terms.js — data/terms.json(16:9) 갤러리. 눌러야 재생, 자동재생 없음, 자막 항상 표시.
   file 이 .html 이면 같은 사이트의 오프라인 애니메이션을 iframe 으로, .mp4 면 video 로 연다. */
(function () {
  'use strict';
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var PLAY = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  function card(t) {
    var ready = t.status === 'ready' && t.file;
    var poster = '<span class="term-poster">' + (ready ? '<span class="term-play">' + PLAY + '</span>' : '') +
      '<b>' + esc(t.term) + '</b><span>' + esc(t.analogy) + '</span></span>';
    var frame = ready
      ? '<button type="button" class="term-frame" data-file="' + esc(t.file) + '" aria-label="' + esc(t.term) + ' 재생">' + poster + '</button>'
      : '<div class="term-frame">' + poster + '</div>';
    var caps = (t.captions || []).map(esc).join(' · ');
    return '<article class="term">' + frame +
      '<div class="term-cap"><b>' + esc(t.term) + (ready ? '' : ' <span class="chip">준비 중</span>') + '</b>' +
      '<span>' + esc(t.meaning) + '</span>' +
      '<small>' + (t.duration_sec ? t.duration_sec + '초 · ' : '') + '확인한 날: ' + (t.checked ? esc(t.checked) : '확인 전') + '</small></div>' +
      (caps ? '<p class="term-captions">' + caps + '</p>' : '') + '</article>';
  }
  function play(btn) {
    var f = btn.getAttribute('data-file');
    if (/\\.mp4$/i.test(f)) {
      btn.innerHTML = '<video src="../' + f + '" controls playsinline preload="none"></video>';
      btn.querySelector('video').play();
    } else {
      btn.innerHTML = '<iframe src="../' + f + '" title="애니메이션" sandbox="allow-scripts"></iframe>';
    }
  }
  function draw(data) {
    var box = document.getElementById('terms');
    if (!data || !data.items) { box.textContent = '자료를 불러오지 못했습니다.'; return; }
    box.innerHTML = data.items.map(card).join('');
    box.addEventListener('click', function (e) { var b = e.target.closest('button[data-file]'); if (b) play(b); });
  }
  fetch('../data/terms.json').then(function (r) { return r.json(); })
    .catch(function () { return window.TERMS_DATA; }).then(draw);
})();
''')

STEPS = [
    ("입력", "주문서", "내가 쓴 글(프롬프트)이 AI에 들어갑니다. 식당에 주문서를 내는 것과 같습니다."),
    ("토큰으로 쪼개기", "재료 손질", "글을 작은 조각(토큰)으로 나눕니다. 재료를 먹기 좋게 써는 일입니다."),
    ("의미 공간에 놓기", "재료 배치", "뜻이 비슷한 조각끼리 가까이 놓입니다. 비슷한 재료를 한 접시에 모으는 것과 같습니다."),
    ("서로 관계 보기", "어울림 판단", "어느 조각이 어느 조각과 이어지는지 따져 봅니다(어텐션). 어떤 재료가 어떤 재료와 어울리는지 보는 일입니다."),
    ("다음 말 하나씩 예측", "한 숟갈씩", "가장 어울리는 다음 말을 하나 고르고, 그것까지 포함해 또 하나 고릅니다. 한 숟갈씩 떠서 맛을 보는 셈입니다."),
    ("답", "완성 요리", "이어 붙인 말이 답이 됩니다. 접시에 담겨 나온 요리입니다."),
]
lis = "".join(
    f'<li id="s{i+1}"><span class="flow-n">{i+1}</span><div><h2>{a}</h2><p class="flow-food">비유: {b}</p><p>{c}</p></div>'
    f'<div class="flow-stage" role="img" aria-label="{a} 장면 자리">장면 자리 — 16:9 움직이는 3D·모션 (준비 중)</div></li>'
    for i, (a, b, c) in enumerate(STEPS))
chips = "".join(
    f'<a class="chip-btn" href="#s{i+1}" style="text-decoration:none;display:inline-flex;align-items:center">{i+1}. {s[1]}</a>'
    for i, s in enumerate(STEPS))

page('how-ai-answers/index.html', 'AI는 어떻게 답을 만들까', '입력부터 답이 나오기까지 AI 안에서 일어나는 일을 여섯 걸음으로 보는 안내', f'''
<section class="page-hero"><h1>AI는 어떻게 답을 만들까</h1>
<p>입력이 답이 되기까지 여섯 걸음. 각 걸음을 음식 만들기에 빗대었습니다. 아래로 내리거나 번호를 눌러 넘깁니다.</p>{SOON}</section>
<nav class="chips" aria-label="걸음 바로가기" style="margin-bottom:16px">{chips}</nav>
<ol class="flow">{lis}</ol>
<p class="checked" style="margin-top:16px">3D 장면은 교사 스튜디오 3D 도구로 만들어 이 자리에 넣습니다. 3D가 어려운 컴퓨터에서는 2D 그림으로 대신 보여 줍니다.</p>
<p><a class="btn" href="../ai/index.html">AI 활용 안내로</a> <a class="btn" href="../terms/index.html">AI 용어, 그림으로 보기</a></p>
''')

page('start/index.html', '설치·시작 가이드', '교사 스튜디오를 처음 설치하고 시작하는 방법 (준비 중)', f'''
<section class="page-hero"><h1>설치·시작 가이드</h1>
<p>교사 스튜디오(하네스)를 내 컴퓨터에 설치하고 첫 수업 자료를 만들 때까지의 안내가 들어올 자리입니다.</p>{SOON}</section>
<ol class="how-steps" style="grid-template-columns:1fr"><li><b>1</b><span>준비물 확인</span></li><li><b>2</b><span>설치</span></li><li><b>3</b><span>첫 자료 만들어 보기</span></li></ol>
<p style="margin-top:16px"><a class="btn" href="../index.html">업무별 안내서로</a></p>
''')
