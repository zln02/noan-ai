# 정보 구조 (IA)

핵심 원칙: **업무에서 출발한다.** 도구 이름이 아니라 「가정통신문을 써야 한다」에서 시작해 → 안내서 카드 → 아이모두에서 누를 곳 → 지시서 복사 → 주의사항.

## 사이트맵

```
/                       홈 = 검색 + 바로가기 4 + 업무별 안내서 카드 25장(분류 칩)
  #00 … #21             카드 상세 (주소 그대로 유지 — QR이 가리킨다)
iamodu/                 아이모두 완전 정복 (뼈대, 내용은 별도 작업)
ai/                     AI 활용 안내 (data/ai-models.json, 항목마다 확인한 날)
  terms/                  AI 용어, 그림으로 보기 (16:9 모션·3D, data/terms.json)
  how-ai-answers/         AI는 어떻게 답을 만들까 (여섯 걸음, 3D 자리)
training/               연수 자료 (덱 24장 · s1 · s2)
library/                자료실 (도구 판정 · 승인 · 안전 규칙 한 장)
showcase/ contest/      활용 사례 · 대회
start/                  설치·시작 가이드 (교사 스튜디오 하네스, 준비 중)
start/#stuck            막혔을 때 (요청하기는 2026-11 에 없앰)
about/ class/ studio/   소개 · 수업 · 수업 도구(게임) — 위 메뉴(PC) 또는 홈 아래 링크
ops/                    운영 층 (noindex, 링크로만) — 그대로
guide/                  옛 주소 → 홈으로 넘김 (유지)
```

## 내비게이션

| 폰 (아래 탭바 5개) | PC (위 메뉴) |
|---|---|
| 홈 · 아이모두 · AI 알기 · 연수·자료 · 도움 | 업무별 안내서 · 아이모두 · AI 알기 · 연수·자료 · 도움 · 수업 도구 · **아이모두 바로가기(버튼)** |

- 탭바·위 메뉴는 `shared/app.js` 한 곳에서 만든다. 항목을 바꾸려면 `TABS` 배열만 고치면 모든 페이지가 따라온다.
- 운영 층(`/ops/`)은 메뉴에 없다.

## 안내서 카드 해부 (목록 카드)

```
[번호 · 분류 ········ 지시서 배지]
제목                        ← 업무 이름 (한 줄 효과가 아니라 하는 일)
이럴 때 씁니다 한 줄        ← task.when
[도구 칩] [소요 시간 칩]  열기 ›
```
데이터 필드: `no · group · title · when · tool · min[1]` (소요 시간) · `prompt` 유무(지시서 배지). 난이도 필드는 데이터에 없어 넣지 않았다(필요하면 `tasks.json`에 `level` 추가).

## 안내서 상세 템플릿 (순서가 곧 여정)

1. 위 줄: ← 목록 · 막혔을 때 · ← 이전 · 다음 →
2. 머리: 도구 로고 · 번호 · 제목 · 분류 · 시간 · 인쇄
3. **이럴 때 씁니다** (한 줄) + 시간 절약 문구
4. **추천 도구**: 경로(아이모두 > 도구모음 > …) · 확인한 가이드
5. **N단계 사용법**: 각 단계. `prompt_step` 단계 안에 지시서 상자가 들어간다
6. **지시서 상자** (1급 구성요소): 「지시서 — 그대로 붙여넣으세요」 · **지시서 복사**(큰 버튼, 한 번에 복사) · `[빈칸]`과 `「○○」`는 노랗게 · 「이렇게 표시된 곳만 내 내용으로 바꾸세요」 · 복사 직후 붙여넣는 법 한 줄 · (선택) 「도움 됐어요」
7. 실제 화면 · 누를 곳 (캡처)
8. 이런 결과가 나와요 (예시 결과)
9. **꼭 확인할 것** (주의사항, 호박색 상자)
10. 근거·관련 공식 안내 · 이전/다음 카드

## 페이지 템플릿

| 템플릿 | 쓰는 곳 | 구성 |
|---|---|---|
| 홈 | `/` | 히어로(검색·칩) → 바로가기 4 → 카드 그리드 → 따라 하는 법 4단계 → 더 알아보기 → 인쇄 PDF |
| 상세 | `/#NN` | 위 해부 |
| 모음 | training · library · showcase | 제목 → 카드 목록 → 상세 |
| 뼈대 | iamodu · start · ai · terms · how-ai-answers | `page-hero`(+「내용 준비 중」) → `panel`/`toc` 목차 → 자리 표시 |

## 새로 만든 슬롯과 데이터

| 슬롯 | 파일 | 스키마 |
|---|---|---|
| AI 활용 안내 | `data/ai-models.json` | `items[{id,name,maker,kind,summary,good_for,in_aimodu,url,checked}]` — `checked`가 비면 「확인 전」. 지어낸 내용 없음 |
| AI 용어, 그림으로 보기 | `data/terms.json` | `items[{id,term,analogy,meaning,file,poster,aspect:"16:9",duration_sec,captions[],checked,status}]` — 스키마 설명은 파일 `meta.schema`. 자리 항목 2개: 프롬프트(주문서), 하네스(주방 동선·규칙) |
| AI는 어떻게 답을 만들까 | `how-ai-answers/index.html` | 여섯 걸음 + 음식 비유 + 16:9 장면 자리. 3D는 나중에 오프라인 HTML로 넣고, 약한 PC에선 2D 폴백 |
| 설치·시작 가이드 | `start/index.html` | 교사 스튜디오 하네스 안내 자리 |

용어 플레이어 규칙: 16:9 · 눌러야 재생 · **자동재생 없음, 소리 기본 꺼짐** · 자막(`captions`)은 항상 보임 · 폰 세로에선 가로폭을 채우고 위아래 여백, 가로로 돌리면 꽉 참 · `file`이 `.html`이면 sandbox iframe, `.mp4`이면 video.

연결: AI 활용 안내 ↔ 용어 ↔ 답 만들기 풀이가 서로 링크 (`ai/index.html`에서 둘 다 연다, 용어 쪽에서 풀이로).

## Supabase 쓰는 곳과 이유 (선택 기능만)

원칙: **핵심(안내서 카드·지시서 복사·연수 자료)은 완전 정적**이며 Supabase 없이 오프라인에서도 동작한다. Supabase는 아래 선택 기능에만 쓰고, 설정이 비어 있거나 막히면 기능이 켜지지 않거나 한 줄 안내만 보인다.

| 기능 | 상태 | 이유 | 안전장치 |
|---|---|---|---|
| 「이 지시서 도움 됐어요」 | 코드·SQL 작성 (`shared/feedback.js`, `supabase/feedback.sql`) | 어떤 지시서가 쓸모 있는지 알아 안내서를 고친다 | anon 키만 · RLS insert-only · 카드 번호와 true/false만 저장 · 이름·학교·IP 없음 |
| 인기 지시서 순위 | 아직 없음 (후속) | 위 데이터를 읽어 홈에 올림 | 집계 view만 공개 읽기 |
| 요청·문의 접수 | 아직 없음 (후속) | 지금은 `request/` 가 정적 | 자유 입력에 이름·학생 정보를 적지 말라는 안내 + 길이 제한 |
| 공지 | 아직 없음 (후속) | 연수 일정 변경 알림 | 읽기 전용 |

적용 방법: Supabase SQL Editor에서 `supabase/feedback.sql` 실행 → `shared/config.js`에 프로젝트 주소와 **anon 키**를 입력. **서비스 키는 저장소에 넣지 않는다.** 이 작업에서는 실제 Supabase 프로젝트를 만들거나 바꾸지 않았다.


## 움직임 2 · 새 쪽 내용 (polish/motion-2)

- **움직임 층**: `shared/app.css` 10번 구역 + `shared/motion.js`(글자 다이빙·초점 맞추기·찢어진 종이 선·단계 카드 펼침·복사 번쩍) + `shared/app.js`(토스트·끈끈이 목차). 동작 줄이기면 전부 꺼지고 토스트만 남는다. 애니메이션은 transform·opacity 만 쓴다(초점 맞추기는 흐림 막의 투명도만 바꾼다).
- **아이모두 완전 정복**: 저장소 안의 안내서·자료실·매뉴얼 정리에 있는 사실만 썼다. 모르는 것은 「확인 필요」 배지. 「어떤 일에 어떤 도구」 표는 `data/tasks.json` 에서 만든다.
- **AI 용어, 그림으로 보기**: `terms/anim/*.html` 여섯 편(한 장짜리, 소리 없음, 자막 항상). `tools/gen-terms.js` 가 만든다. 「내용 확인한 날」은 사람이 확인한 뒤 `data/terms.json` 의 `checked` 에 적는다(지금은 비어 있어 「확인 필요」).
- **AI는 어떻게 답을 만들까**: `how-ai-answers/` — 3D 는 `shared/vendor/three/`(three.js r128, MIT, LICENSE 포함, `?.`/`??` 문법 없음)로, 컴퓨터가 약하거나 동작 줄이기·WebGL 없음이면 2D SVG. 주소 뒤에 `?view=2d` / `?view=3d` 로 고정할 수 있다.
- **AI 활용 안내**: `data/ai-models.json` — 공식 소개 쪽에서 확인한 항목만 문장을 적었고(Gemini, Claude), 확인 못 한 것(ChatGPT 소개, 아이모두 포함 여부)은 「확인 필요」.

## 마감 층 (polish/premium)

- **토큰**: `shared/vendor/open-props/open-props.subset.css`(Open Props 1.7.23, MIT — sizes·shadows.light·easings·borders·durations 원본 그대로). `shared/premium.css` 가 그림자·둥근 정도·이징·간격을 여기에 맞추고 색은 원래 파스텔을 쓴다.
- **부품**: `shared/vendor/webawesome/`(Web Awesome 3.15.0 무료판, MIT) — 탭·펼침·말풍선·복사·진행 막대·대화 상자 8개만. ESM 을 `tools/vendor-webawesome.js`(node 만, 외부 패키지 없음)로 평범한 `<script>` 하나로 묶어 `file://` 에서도 돈다. Font Awesome CDN 아이콘은 끄고 내장 SVG 몇 개만 남겼다(Font Awesome Free, CC BY 4.0 — SVG 주석에 출처). `shared/app.js` 가 부품을 쓰는 쪽에서만, oklch·`:has()` 를 받쳐 주는 브라우저에서만 불러온다. 못 불러오면 `premium.css` 의 대체 모양.
- **안내 부품**(premium.css 5번): `.pm-head`(구역 머리) · `.pm-steps`(번호 단계) · `.pm-callout`(알림 상자) · `.pm-iconrow` · `.pm-compare`(비교 카드) · `.pm-chip` · `.pm-path`(경로 알약) · `.pm-empty`.
- **쪽별 CSS**: `iamodu/iamodu.css` · `ai/ai.css` · `terms/terms.css` · `how-ai-answers/how.css`. 용어 썸네일 `assets/terms/*.webp` 는 `terms/anim/<id>.html?poster=1` 화면을 찍은 것.

## 앱처럼 쓰는 목록 (Alpine.js)

- **무엇**: `shared/vendor/alpine/alpine.min.js` — Alpine.js 3.17.5(MIT, `LICENSE.md` 함께). npm 공식 `dist/cdn.min.js` 를 고치지 않고 넣었다. 빌드 없음.
- **언제 켜지나**: `shared/app.js` 가 `?.`·`??` 문법·Proxy·queueMicrotask 를 받쳐 주는 브라우저(크롬 80 이상)에서만 `<html class="alpine-ok">` 를 붙이고, `x-data` 가 있는 쪽에서만 불러온다. 못 불러오거나 5초 안에 안 켜지면 class 를 뗀다.
- **첫 화면이 하는 일**(`guide/home-alpine.js` + `guide/home-alpine.css`, 모양은 `index.html` 의 `x-…` 표시): 찾기(치는 대로 좁혀짐, Esc 로 지움) · 분류 칩 · 정렬(번호/빨리 끝나는/가나다) · 보기 탭 전체/찜/최근 본(쪽마다 기억) · 카드 ☆ 찜 · 최근 본 카드 줄 · 카드에서 바로 「지시서 복사」 + 그 카드 위 알림 · 폰에서는 아래서 올라오는 필터 서랍(Esc·바깥 누르면 닫힘, 초점 돌아옴).
- **기억하는 것**: 이 브라우저 `localStorage` 에 카드 번호만(`noan-favs`, `noan-recent`, `noan-ui:<쪽 주소>`). 이름·검색어·내용은 남기지 않는다. 저장이 막혀도 그대로 돈다.
- **자바스크립트가 안 될 때**: `index.html` 안의 「정적 목록」(25장 `<details>`, 사용법·지시서·주의 포함)이 보인다. `node tools/gen-home-static.js`(또는 `node tools/sync-data.js`)가 `data/tasks.json` 으로 다시 만든다. 카드 id 가 번호라 QR 주소 `#02` 로 들어와도 그 카드로 내려간다.
- **상세 쪽**(`guide/home.js`, 옛 문법 그대로): 열면 「최근 본」에 적히고, 머리에 「찜하기」 단추가 있다.
