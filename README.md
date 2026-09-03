# 노안중 AI교육

노안중학교 AI교육 코디네이터 운영 사이트. 교원 연수 덱과 자료실을 담는다.
빌드 도구 없는 순수 HTML/CSS/JS. 파일을 열어 글자를 고치고 저장하면 그대로 반영된다.

## 원칙
- 외부 요청 0건. CDN·웹폰트·외부 이미지·WebGL 금지. `file://` 로 열어도 네트워크 요청이 없어야 한다.
- 트래킹·애널리틱스 금지.
- **학생 이름·사진·성적이 들어간 자료는 `private/` 에만 둔다.** `private/` 는 git 에 올라가지 않는다.
- 문구는 연수 대본이다. `tools/copy-*.txt` 가 원본이며 임의로 다듬지 않는다.

## 구조
```
index.html            랜딩
404.html              없는 쪽 안내
training/index.html   회차 목록
training/s1.html      1회차 덱 (슬라이드 1~24)
training/s2.html      2회차 — 투표로 결정, 준비 중
class/index.html      학생 수업 — 준비 중
library/index.html    교육청 지원 도구 5 + 시작법 + 스크린샷 자리
library/rules.html    안전 규칙 한 장 (인쇄하면 A4 한 장)
library/approval.html 도구 승인 현황 (approval.json 을 읽어 렌더)
request/index.html    요청하기 (노션 폼 자리)
about/index.html      코디네이터 소개
showcase/index.html   학생 작품 — 준비 중 (items.json, consent:true 만 렌더)
docs/handover.md      인수인계 (뼈대)
shared/               tokens.css site.css deck.css deck.js site.js icons.js
tools/                원고·계약·생성 스크립트 (사이트가 읽지 않음)
assets/               QR·스크린샷 (3단계에서 생성. 없으면 화면에서 자동으로 숨김)
private/              (gitignore) 학교 실물 자료
```

## 덱 조작 (training/s1.html)
| 키 | 동작 |
|---|---|
| `→` `Space` `Enter` `PageDown` | 다음 |
| `←` `Backspace` `PageUp` | 이전 |
| `F` `F5` | 전체화면 |
| `.` `B` | 블랙아웃 (질문 받을 때) |
| `N` | 발표자 노트 |
| `Esc` | 목차 |
| `Z` | 지도 줌 0→1→2 |
| `P` | 프로젝터 모드 (강당용 고대비·큰 글자) |

발표 전에 `P` 를 한 번 누르고 뒷자리에서 가독성을 확인한다.
터치 기기에서는 좌우 스와이프로 넘긴다.

## 시연 영상 변환
GIF 는 쓰지 않는다. `private/` 안에 mp4 로 두고 `.demo` 의 `data-src` 에 경로를 넣는다.
```bash
ffmpeg -i in.mov -vf "scale=1280:-2,fps=24" -c:v libx264 -crf 28 -an out.mp4
```

## 아이콘
`shared/icons.js` 는 simple-icons(CC0) 에서 추출한 path 와 텍스트 배지 사전이다.
재생성:
```bash
cd tools && npm install simple-icons && node gen-icons.js > icons-raw.json && node build-icons.js
```
OpenAI·Adobe·Microsoft·Canva·CapCut·Copilot 은 simple-icons 에서 삭제된 브랜드라 텍스트 배지로 렌더된다.

## 진행 상황
- [x] 1단계 — shared/ 전부, 랜딩, 덱 슬라이드 1~9(표지 ~ AI 전체 지도)
- [x] 2단계 — 덱 슬라이드 10~24, 나머지 페이지(404/training/class/library/request/about/showcase/docs), 추가 요구사항 A·B·D, C1 도구 승인 현황
- [ ] 3단계 — GitHub Pages 활성화, QR 생성(`assets/qr-*.svg`), 스크린샷·시연 영상 채우기, 노션 폼 URL 연결

2단계에서 `shared/*.css` 에는 규칙을 **덧붙이기만** 했다(기존 줄 삭제 0). `shared/*.js` 와 `index.html` 은 손대지 않았다.

## 채워야 할 것
- `data-form=""` 2곳 — 덱 투표 슬라이드, `request/index.html` (노션 폼 공개 URL)
- `[확인 필요]` 표기 — ThinQ Sentinel 내용, CX 프로젝트명, 장비 수량, 미리캔버스 인증 경로, 아이모두 접속 URL, 교육청 가이드라인 원문 링크
