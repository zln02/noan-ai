# Codex 작업 지시 — 선생님용 UX 구현

읽을 순서: `tools/CONTRACT.md` → `docs/decisions.md` → `docs/ux-plan.md` → 이 문서.
`ux-plan.md` 가 무엇을·왜이고, 이 문서가 어떻게다. **판단이 필요하면 `ux-plan.md` 가 이긴다.**

저장소 `C:\Users\User\dev\noan-ai` · 배포 <https://zln02.github.io/noan-ai/>

---

## 0. 시작 전 확인

이 셋이 정해지기 전에는 **해당 작업을 시작하지 마라.** `ux-plan.md` 0절에 배경이 있다.

- **색** — 녹색 유지인지 파랑 전환인지. 정해지기 전에는 **기존 토큰만 쓴다**
- **로고** — `assets/logo.png` 가 아직 없다. 슬롯과 「노안중학교」 텍스트 폴백을 **지우지 마라**
- **덱 도구 배지** — s15·s16 은 손대지 마라. 별도 승인 사안이다

## 1. 절대 규칙

1. **외부 요청 0건.** CDN·웹폰트·외부 이미지·아이콘 CDN 금지. `file://` 로 열어도 전부 동작
2. **빌드 도구 금지.** npm script·번들러·Tailwind·SCSS 전부 안 된다. 순수 HTML/CSS/JS
3. **새 색 금지.** `shared/tokens.css` 토큰만. 농도가 필요하면 `rgba(63,174,147,.10)` 처럼 투명도로
4. **`shared/*` 의 기존 줄을 지우거나 고치지 마라.** 파일 끝에 덧붙여 덮는다
5. **문구를 지어내지 마라.** 화면의 모든 글자는 이미 저장소에 있던 문장이어야 한다.
   이 저장소에서 실제로 두 번 사고가 났다 — 랜딩 제목이 없던 홍보 문구로 바뀌었고,
   `schedule.json` 에 존재하지 않는 회차 날짜가 들어갔다. 자리가 비면 **비운 채 두고 보고해라**
6. **`data/tasks.json` 과 `tools/copy-s1-*.txt` 는 한 글자도 못 바꾼다.** 인쇄본과 대조 검증한다
7. `<img>` alt 필수 · 태그 균형 · 전 쪽 `<meta name="robots" content="noindex">` 유지
8. `/ops/` 링크를 선생님 화면에 만들지 마라

## 2. 손대지 말 것

`data/tasks.json` · `tools/copy-s1-*.txt` · `training/s1.html` · `shared/deck.css` ·
`shared/tokens.css` · `tools/*` · `ops/*` · `guide/` 상세의 **검은 프롬프트 박스 모양**

## 3. 작업 — 이 순서로, 커밋을 나눠서

### 커밋 1 · 빠른 업무 데이터
`data/quicktasks.json` 을 새로 만든다. `ux-plan.md` 5절 표 그대로:

```json
[
 { "label": "가정통신문",        "no": "01" },
 { "label": "회의록",            "no": "04" },
 { "label": "긴 공문",           "no": "02" },
 { "label": "활동지 · 문항",     "no": "11" },
 { "label": "설문",              "no": "07" },
 { "label": "발표자료",          "no": "06" },
 { "label": "자료 여러 개 비교", "no": "02" },
 { "label": "문서 검토",         "no": "03" }
]
```

`tools/sync-data.js` 의 `PAIRS` 에 한 줄 추가하고 `node tools/sync-data.js` 를 돌려라.
**PAIRS 줄만 건드려라.** 파일 끝의 최종수정 갱신 코드는 손대지 마라.

### 커밋 2 · `/guide/` 첫 화면 — QR 도착지
`guide/index.html` 의 목록 화면을 이렇게 바꾼다. **카드 상세는 이 커밋에서 건드리지 마라.**

```
"무엇을 하시려고요?"
[ 큰 검색창 ]                      placeholder: 가정통신문, 회의록, 긴 공문, 활동지, 설문, 발표자료
[빠른 업무 8개 버튼]                quicktasks.json 에서. 누르면 location.hash = '#' + no
[ 16가지 전체 보기 ]  ← <details>   펼치면 지금의 카드 그리드 그대로
「도구가 안 보이실 때」 안내 띠       지금 자리 유지 (meta.tip)
```

- 검색은 지금 로직 그대로. **결과 칸만 다시 그리는 방식을 유지해라** — 입력칸을 새로 만들면
  한글 입력이 끊긴다. 이미 겪은 문제다
- 검색어를 넣으면 `<details>` 가 자동으로 열리고 결과가 보여야 한다
- 빠른 업무 버튼은 카드가 아니라 **알약형 버튼**. 카드를 남발하지 마라

### 커밋 3 · 가이드 상세 7단 구조
`guide/index.html` 의 `renderDetail()` 순서를 `ux-plan.md` 6절 표대로 바꾼다.
**데이터는 전부 이미 있다. 새 문장 금지.**

1 이런 때 씁니다(`when`) · 2 추천 도구(`tool`+`path`) · 3 3단계(`steps`) ·
4 프롬프트(`prompt`+복사) · 5 캡처(`shot`+`marks`) · 6 꼭 확인할 것(`caution`) ·
7 공식 매뉴얼(`data/guides.json` 에서 `tool` 이 일치하는 항목, 없으면 그 절을 통째로 생략)

- `prompt` 가 `null` 인 카드(8장)에 **검은 박스를 만들지 마라.** `prompt_note` 를 민트 박스로
- `min[0]` 이 0 이면 절감 시간 줄을 아예 빼라
- 캡처가 없으면 **오른쪽 칸을 만들지 말고 본문이 전체 폭**을 쓴다. 점선 자리표시 금지,
  파일명 노출 금지. 이미 그렇게 되어 있으니 깨지 마라
- 6·7번은 `<details>` 로 기본 접힘. JS 없이

### 커밋 4 · 홈 정리
`index.html` 을 `ux-plan.md` 4절 IA 로. **삭제가 아니라 이동이다:**

- 「이번 주」 → `training/index.html` 로 옮긴다
- 「2학기 로드맵」 → `about/index.html` 로 옮긴다
- 「대회」 · 「둘러보기」 · 「이미 갖고 계신 것」 → 홈에서 제거, 푸터 링크로
- 내비를 4개로: 안내서 · 연수 · 자료실 · 요청하기 (수업 · 대회 · 소개는 푸터)
- 홈 상단은 「무엇을 하시려고요?」 + 검색창 + 빠른 업무 8개.
  **검색과 빠른 업무는 `/guide/` 로 보낸다**(`guide/index.html#01` 형태). 홈에서 결과를 그리지 마라

옮긴 문장은 **한 글자도 고치지 말고** 그대로 옮겨라.

### 커밋 5 · 모바일
`ux-plan.md` 7절. 390px 에서 첫 화면에 [헤더 · 질문 · 검색창 · 빠른 업무 2×2] 가 들어가야 한다.
프롬프트 복사 버튼은 **화면 폭 가득**. 긴 안내는 `<details>`.

## 4. 검증 — 커밋마다 돌리고 결과를 보고에 넣어라

```bash
node tools/sync-data.js --check     # JSON↔JS 짝
node tools/check-copy.js            # 덱 대본 141문장 (덱을 안 건드려도 돌려라)
```

화면 검증은 헤드리스 크롬으로. 저장소 루트에서 `python -m http.server 8811 --bind 127.0.0.1`:

```python
from playwright.sync_api import sync_playwright   # channel="chrome" 이라 브라우저 내려받기 없음
with sync_playwright() as pw:
    b = pw.chromium.launch(channel="chrome", headless=True)
    for w in (390, 820, 1280):
        pg = b.new_page(viewport={"width": w, "height": 900})
        pg.goto("http://127.0.0.1:8811/guide/index.html", wait_until="load")
        pg.wait_for_timeout(1200)
        # 등장 애니메이션 때문에 한 번 끝까지 굴린 뒤에 찍는다
        pg.evaluate("""async ()=>{for(let y=0;y<document.body.scrollHeight;y+=400){
            window.scrollTo(0,y); await new Promise(r=>setTimeout(r,40));} window.scrollTo(0,0);}""")
        pg.wait_for_timeout(700)
        print(w, pg.evaluate("()=>document.documentElement.scrollWidth-document.documentElement.clientWidth"))
        pg.screenshot(path=f"docs/shots/site/{w}-guide.png", full_page=True)
```

**함정 둘 — 여기 이미 걸렸다.**
- 화면 밖 요소는 레이아웃이 안 잡혀 크기가 0 으로 나온다. **한 쪽씩 실제로 띄워서** 재라
- 카드에 등장 애니메이션이 있어 굴리지 않고 찍으면 빈 화면으로 찍힌다

**통과 기준**
- 390 · 820 · 1280 세 폭에서 가로 스크롤 0, 404 0 (`assets/logo.png` 만 예외)
- `/guide/` 카드 16장 · 업무 10 / 수업 6 유지
- 프롬프트 복사 버튼 동작 — 성공 경로와 `file://` 실패 경로(본문 선택 + Ctrl+C 안내) 둘 다
- 390px 첫 화면(스크롤 0)에 검색창이 보인다

## 5. 커밋과 보고

- **한 커밋에 한 단계.** 3절의 1~5 를 섞지 마라
- 브랜치를 따로 파고 PR 로 올려라. `main` 에 직접 넣지 마라
- 커밋 메시지는 한국어. 첫 줄은 `feat:` `style:` `refactor:` 중 하나
- 보고: ① 커밋 해시 ② 세 폭 스크린샷 경로 ③ 4절 검증 결과 ④ 옮긴 문장 목록
  (원문 그대로인지) ⑤ 판단이 갈렸던 지점

## 6. 톤

교사 12명이 쓰는 학교 사이트다. 화려할 필요 없다. **읽기 쉽고, 휴대폰에서 살아야 한다.**
40대 후반 선생님이 처음 보고 어디를 눌러야 할지 헷갈리면 실패다.

큰 여백 · 큰 검색창 · 짧은 설명 · 카드 남발 금지 · 한 화면에 정보 과다 금지.
마스코트는 보조다. 한 화면에 한 마리 이상 두지 마라.
