# noan-ai 구현 계약 (모든 파일이 반드시 지킨다)

## 절대 규칙
- 외부 요청 0건. CDN·웹폰트·외부 이미지·WebGL·빌드도구·프레임워크 금지.
- 상대경로만. 덱/일반페이지 모두 `../shared/…` 형태. `/noan-ai/`와 `file://` 둘 다 동작.
- 트래킹·애널리틱스 절대 금지. 모든 페이지 `<meta name="robots" content="noindex">`.
- 닫히지 않은 태그 금지. 모든 `<img>`에 alt. 모든 `<table>`은 `<div class="tw">` 로 감싼다(overflow-x:auto).
- 학생 이름·사진·성적이 들어간 예시 금지.
- 원고(문구)는 tools/copy-*.txt 를 **한 글자도 바꾸지 않고** 옮긴다. `[확인 필요]` 표기도 그대로 남긴다.

## 폰트
`--font: system-ui, -apple-system, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;`

## 토큰 (shared/tokens.css)
:root 에 정의. 값 변경 금지.
```
--ink:#0E3B33  --ink2:#155146  --mint:#3FAE93  --mint2:#7FD6C2
--warm:#D97A38 --stop:#B4524A  --paper:#F6F9F8 --card:#FFFFFF
--mute:#61756F --line:#D9E5E1  --gold:#E3B341
```
추가 파생 토큰(자유): --fs-body(20px) --fs-h1(44px) --radius(14px) --shadow --maxw(1280px)

### 다크
`@media (prefers-color-scheme: dark)` 에서 --paper/--card/--line/--mute/텍스트색만 재정의. 브랜드색(mint/warm/gold/stop)은 유지.

### 프로젝터 모드 — `html[data-projector]`
--mute:#3F4F49 / --line:#B8C8C2 / --mint2 를 --mint 값으로 / --fs-body:22px / --fs-h1:48px
`--shadow:none`, 카드 border 2px. 다크모드보다 우선.

### 모션
`@media (prefers-reduced-motion: reduce)` 에서 등장 애니메이션·tilt·전환·떠다니는 원 전부 무효화(`animation:none;transition:none;transform:none`).

## 공통 내비 (모든 일반 페이지, 덱 제외)
```html
<a class="skip" href="#main">본문으로</a>
<header class="nav"><div class="nav-in">
  <a class="brand" href="{ROOT}index.html">노안중 AI교육</a>
  <button class="nav-toggle" aria-expanded="false" aria-controls="navmenu">메뉴</button>
  <nav id="navmenu" class="nav-menu" aria-label="주요 메뉴">
    <a href="{ROOT}training/">연수</a><a href="{ROOT}class/">수업</a>
    <a href="{ROOT}library/">자료실</a><a href="{ROOT}request/">요청하기</a>
    <a href="{ROOT}about/">소개</a>
  </nav>
  <span class="online-dot" title="네트워크 상태" aria-hidden="true"></span>
</div></header>
<main id="main">…</main>
<footer class="site-foot">…</footer>
```
{ROOT} = 루트는 `` , 하위폴더는 `../`. site.js 가 현재 경로로 `a.is-active` 표시.

## 일반 페이지 클래스 (shared/site.css)
.wrap(최대폭) .hero .hero.dark .eyebrow .lede .btn .btn-primary .btn-ghost
.section .section-title .grid.cols-2 .cols-3 .cols-4
.card .card.tilt(마우스 tilt) .card-title .card-lede .badge .badge-row
.tl(로드맵 타임라인) .tl-item .tl-item.is-now .tl-item.is-soon(흐리게)
.tw(table wrapper) .site-foot .qr
.state-ok/.state-wait/.state-hold/.state-no (승인 상태색)

## 덱 클래스 (shared/deck.css)
```
.deck > section.slide            한 화면. scroll-snap-align:start; min-height:100vh
section.slide.dark               --ink 배경 + 밝은 글자
.slide-inner                     최대폭 1280px, 세로 중앙
.s-title .s-sub .s-info .s-foot .s-lead
.cards.cols-2/.cols-3/.cols-4    카드 그리드
.card3d                          등장: rotateX(8deg) translateY(30px) -> 0, .6s ease-out
                                 hover: 마우스 위치 따라 최대 6deg tilt
.card3d.gold / .card3d.mint / .card3d.warm   테두리 강조
.scene                           장면 슬라이드 2열(좌 고민 / 우 도구)
.pain / .tool / .steps(ol)
.demo[data-src]                  <video autoplay muted loop playsinline preload="metadata">
                                 data-src 비면 "시연 화면" 플레이스홀더
.poll[data-form]                 iframe + 아래 "폼 링크 열기" 버튼. 비면 안내문구
.timer[data-min]                 클릭 시작, 0초에 --warm
.checklist input[type=checkbox]  체크 시 부모 행 --mint
.aimap / .map-panel              줌 지도 + 우측 설명 패널
.hud .hud-num .hud-time          우하단 현재/전체 + 경과 mm:ss
.toc                             Esc 목차 오버레이 (+ "사이트로 돌아가기" 링크)
.blackout                        전체 검정 오버레이
aside.notes                      기본 display:none, .notes-on 일 때 하단 표시
.orb                             표지 배경 원 2개, 20s loop
```
`<section class="slide" id="s7" data-t="8" data-title="현 위치② 셋 다 비슷합니다">`
- id 는 s1..s24, data-t 는 목표 경과(분), data-title 은 목차용.

## deck.js API/동작
- 키: → Space Enter PageDown = 다음 / ← Backspace PageUp = 이전 / F, F5 = 전체화면
  / . , B = 블랙아웃 / N = 노트 / Esc = 목차 / Z = 지도 줌(지도 슬라이드에서만) / P = 프로젝터
- 입력 중(input/textarea/contenteditable)이면 키 무시. F5·PageDown 등은 preventDefault.
- 터치 좌우 스와이프(가로 60px 이상, 세로 이동 40px 미만).
- URL 해시 #s7 로 위치 유지·복원. history.replaceState 사용.
- 경과시간: 첫 이동 입력 시각부터. mm:ss, 60분 초과 시 --warm.
- 노트 켜면 각 슬라이드 목표시각과 경과 비교해 `+3분 밀림` / `-2분 빠름` 표시.
- 프로젝터 모드 localStorage('noan-projector') try/catch.
- navigator.onLine + online/offline 이벤트로 .online-dot 색(초록/회색).
- 지도: g[data-zoom] 0→1→2→0. Z키 또는 노드 클릭. transform scale+translate, .8s cubic-bezier(.4,0,.2,1).
  노드 hover/focus 시 .map-panel 갱신(g.node의 data-name/data-desc/data-use).
- 외부 의존 0. 대략 300줄.

## 지도 SVG 규격 (슬라이드 9)
`<svg class="aimap" viewBox="0 0 1200 760" role="img" aria-label="AI 도구 전체 지도">`
- `<g class="zoomer">` 하나가 카메라. 그 안에 7개 `<g class="cat" data-cat="…">`.
- 노드: `<g class="node" data-cat="…" data-jne="1" data-name="…" data-desc="…" data-use="…" tabindex="0" role="button">`
  안에 `<circle>` + 아이콘 `<use>`/foreignObject 대신 **텍스트 라벨 + 아이콘은 NoanIcons.render로 innerHTML 주입**(g에 data-icon 속성).
- 줌 단계는 zoomer의 transform 을 JS가 계산해 설정. data-zoom 속성은 `<svg>` 루트에 0|1|2 로 반영해 CSS가 상태별 투명도 처리.
  - 줌1: `[data-zoom="1"] .node:not([data-jne]) { opacity:.25 }`, jne 노드 --gold 테두리.

## 접근성
- 포커스 링 `:focus-visible { outline:3px solid var(--warm); outline-offset:2px }`
- 제목 계층 h1→h2→h3 건너뛰지 않기. 덱은 슬라이드마다 h2(표지만 h1).
- 대비 4.5:1 이상. --mute 위 흰 배경 OK.
