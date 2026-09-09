# 노안중 AI교육 운영 사이트

전남 나주 노안중학교(교육부 AI 중점학교) AI교육 코디네이터가 4개월 동안 운영·기록·인수인계에 쓴 사이트.
빌드 도구 없는 순수 HTML/CSS/JS. **외부 요청 0건** — `file://` 로 열어도 그대로 돈다.

배포: <https://zln02.github.io/noan-ai/> — 첫 화면이 업무별 안내서다. QR 이 가리키는 곳.

---

## 무엇을 푸는가

교사 12명, 코디네이터 1명, 4개월. 문제는 도구가 없는 게 아니라 **있는데 안 쓰는 것**이었다.

| 문제 | 이 저장소의 답 |
|---|---|
| 교육청이 이미 준 도구(아이모두 44개)를 안 쓴다 | 업무별 안내서 **17장** + 연수 덱 24장 |
| 4개월 뒤 결과보고서를 몰아서 써야 한다 | 근무일마다 5분 기록이 그대로 보고서 원천이 되게 |
| 후임자에게 넘길 것이 사람 머릿속에만 있다 | `/ops/handover` 한 쪽 |

## 설계 원칙

이 저장소에서 봐 주셨으면 하는 건 화면이 아니라 아래 여섯 가지다.

**외부 요청 0건.** CDN·웹폰트·트래킹이 없다. 아이콘은 SVG path 를 저장소에 넣어 쓴다.
학교 네트워크가 죽어도 연수가 진행된다. 이건 취향이 아니라 요구사항이었다 —
강당 와이파이를 믿고 슬라이드를 짤 수 없다.

**빌드 도구 없음.** npm run 이 없다. 후임자가 IDE 없이 메모장으로 글자를 고치고 저장하면 반영된다.
넘겨받을 사람이 개발자가 아니다.

**데이터는 JSON 한 벌.** `Notion → tools/sync-notion.js → data/*.json → 페이지`.
토큰은 환경변수로만 읽는다. 저장소에도 브라우저에도 남기지 않는다.

**JSON 과 JS 를 짝으로 둔다.** 크롬은 `file://` 에서 `fetch` 를 막는다.
그래서 `tools/sync-data.js` 가 JSON 마다 `window.X_DATA` 를 담은 `.js` 를 만든다.
페이지는 `fetch` 를 먼저 쓰고 막히면 전역 변수로 넘어간다. USB 로 들고 가도 뜬다.

**개인정보 경계를 코드로 지킨다.** 사진·이름·성적은 `private/`(gitignore)와 노션에만.
sync 스크립트는 내보낼 필드를 **허용 목록**으로 못 박고, 본문에서 사람 이름 같은 문자열이
잡히면 **아무것도 쓰지 않고 멈춘다.** 사람의 주의력에 기대지 않는다.

**관객을 나눈다.** 선생님(`/`)과 운영(`/ops/`)이 다른 층이다.
선생님 내비에 「기록」은 없다. `/ops/` 는 링크로만 가고 `noindex` 다.

## 구조

```
noan-ai/
├── index.html                  ★ 첫 화면 = 업무별 AI 안내서 17장 (QR 이 가리키는 곳)
├── guide/                      안내서 인쇄본 PDF · 옛 주소(/guide/)를 첫 화면으로 넘기는 쪽
├── training/                   연수 덱 24장
├── library/  contest/  request/  about/  class/  showcase/
├── ops/                        운영 층 — 홈 · 기록 · 회차 · 인수인계
├── data/                       ★ 모든 데이터가 여기 한 곳
│   ├── tasks.json      안내서 17장의 원본 (인쇄본과 같은 원천)
│   ├── guides.json     도구별 공식 안내 판정 12건 + 외부 연수 3건
│   ├── schedule.json   연수 일정 (D-day 계산의 원천)
│   ├── log.json        활동 기록 (노션에서 내려받음)
│   ├── sessions.json   회차별 기록
│   ├── approval.json   도구 승인 현황
│   └── contest.json  showcase.json
├── shared/   tokens.css  site.css  deck.css  icons.js  deck.js  site.js
├── assets/   noari/(마스코트)  guide/(캡처)  qr-*.svg
├── tools/    sync-data.js  sync-notion.js  check-copy.js  guide-build.py  CONTRACT.md
├── docs/     decisions.md  handover.md  cli/  manual-findings.md  shots/
├── private/  (gitignore) 학교 실물 자료
└── README.md  LICENSE
```

## 데이터 흐름

```
  ┌─────────┐   sync-notion.js    ┌──────────────┐   sync-data.js   ┌──────────────┐
  │ Notion  │ ──────────────────▶ │ data/*.json  │ ───────────────▶ │ data/*.js    │
  │ (원천)  │   토큰=환경변수      │  (원본)      │  file:// 폴백    │ window.X_DATA│
  └─────────┘   이름 잡히면 정지   └──────────────┘                  └──────────────┘
                                          │                                 │
                                          └──────────┬──────────────────────┘
                                                     ▼
                                      페이지: fetch 먼저, 막히면 전역 변수
```

인쇄본도 같은 원천에서 나온다. `tools/guide-build.py` 가 `data/tasks.json` 하나로
A4 가로 18쪽 PDF 를 만든다. 화면과 종이의 문장이 갈라질 수 없는 구조다.

## 로컬에서 보기

`index.html` 을 더블클릭한다. 끝이다. 서버도 설치도 필요 없다.

## 갱신하기

```bash
# 1. 노션에 적는다 (활동 기록 · 도구 승인 현황)
# 2. 내려받는다
NOTION_TOKEN=... NOTION_LOG_DB=... node tools/sync-notion.js
# 3. file:// 폴백 짝을 다시 만든다 (푸터의 「최종 수정」도 오늘 날짜로 찍힌다)
node tools/sync-data.js
# 4. 커밋
```

덱이나 안내서의 문장을 만졌다면:

```bash
node tools/check-copy.js      # 대본 141문장이 덱에 그대로 있는지
node tools/sync-data.js --check
```

## 결과

*2026-12 결과보고서 작성 시 손으로 채운다. 자동 집계하지 않는다 — 숫자를 자랑하려고
만든 사이트가 아니라 일을 줄이려고 만든 사이트다.*

- 연수 __회 · 참석 __명
- 업무별 안내서 17장 (인쇄본 A4 가로 18쪽)
- 도구별 공식 안내 판정 12건
- 활동 기록 __건

## 인수인계

[`/ops/handover`](ops/handover/index.html) — 이 자리가 하는 일, 연간 흐름, 계정 발급 절차,
파일 위치, 첫날 할 일 5개, 미해결 목록.
큰 결정의 이유는 [`docs/decisions.md`](docs/decisions.md) 에 날짜와 함께 적어 두었다.

## 라이선스

코드는 MIT ([LICENSE](LICENSE)).
마스코트 「노아리」와 학교 로고·교표는 **노안중학교 소유이며 재사용을 허락하지 않는다**
(`assets/noari/`, `assets/logo.png`). 저장소를 참고하실 때 그 파일들은 빼고 보시면 된다.

---

## In English

A public-school operations site built by a single AI-education coordinator at Noan Middle School
(Naju, Jeonnam, Korea) over one semester. Plain HTML/CSS/JS — **no build step, no CDN, no
tracking, zero external requests** — because the school's Wi-Fi cannot be trusted during a
teacher-training session, and the person inheriting this repository is not a developer.

Three things are worth a look. **The privacy boundary is enforced in code, not in a policy
document**: the Notion sync ships an allow-list of exportable fields and halts the whole
export when a string that looks like a student's name appears in the body text.
**Every JSON file has a generated JS twin** (`window.X_DATA`) so that pages still render from a
USB stick when Chrome blocks `fetch` on `file://`. And **the same JSON produces both the web
guide and the printed A4 booklet**, so screen and paper cannot drift apart.

The site is split into two audiences: teachers at `/`, operations at `/ops/` (noindex, linked
from nowhere). Design decisions and their reasons are logged in `docs/decisions.md`.
