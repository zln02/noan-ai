# 인수인계 — 노안중 AI교육 사이트

준비 중. 다음 사람이 이 저장소를 처음 열었을 때 읽는 문서다.
지금은 뼈대만 있고, 내용은 채워 나간다.

## 1. 먼저 읽을 것
1. `tools/CONTRACT.md` — 구현 계약. 토큰·클래스·내비·금지사항. 여기서 벗어나지 않는다.
2. `tools/copy-s1-a.txt` · `tools/copy-s1-b.txt` — 1회차 덱 원고. **연수 대본이므로 한 글자도 고치지 않는다.**
3. `README.md` — 구조와 원칙.

## 2. 저장소 구조
```
index.html            랜딩
404.html              없는 쪽 안내
training/index.html   회차 목록
training/s1.html      1회차 덱 (슬라이드 1~24)
training/s2.html      2회차 — 투표로 결정, 준비 중
class/index.html      학생 수업 — 준비 중
library/index.html    교육청 지원 도구 5 + 시작법
library/rules.html    안전 규칙 한 장 (인쇄 A4)
library/approval.html 도구 승인 현황 (approval.json 을 읽어 렌더)
library/approval.json 승인 현황 사본 — 원천은 노션 DB
request/index.html    요청하기 (노션 폼 자리)
about/index.html      코디네이터 소개
showcase/index.html   학생 작품 — 준비 중 (items.json, consent:true 만 렌더)
shared/               tokens.css site.css deck.css deck.js site.js icons.js
tools/                원고·계약·생성 스크립트 (사이트가 읽지 않음)
private/              (gitignore) 학교 실물 자료 — 절대 커밋하지 않는다
```

## 3. 발표 전 점검 (1회차 덱)
- `P` 를 눌러 프로젝터 모드로 바꾸고 뒷자리에서 읽히는지 본다.
- `N` 으로 발표자 노트, `Esc` 로 목차, `.` 또는 `B` 로 블랙아웃.
- 시연 영상은 `private/` 에 mp4 로 두고 `.demo` 의 `data-src` 에 경로를 넣는다. GIF 는 쓰지 않는다.
- 네트워크가 끊겨도 덱은 그대로 돈다. 외부 요청이 0건이기 때문이다.

## 4. 아직 비어 있는 것
- `data-form=""` 2곳 — `training/s1.html` 슬라이드 20, `request/index.html`. 노션 폼 공개 URL 이 정해지면 채운다.
- `assets/qr-site.svg` · `assets/qr-request.svg` — GitHub Pages 주소가 확정된 뒤 생성한다.
  ```bash
  pip install "qrcode[pil]"
  python -m qrcode "<사이트 주소>" --factory=svg-path --output=assets/qr-site.svg
  ```
  파일이 없으면 화면에서 자동으로 숨겨진다.
- `assets/shots/*.png` — 자료실 도구별 스크린샷 3장씩. 개인정보가 없는 화면만.
- `[확인 필요]` 표기 — ThinQ Sentinel 내용, CX 프로젝트명, 장비 수량·상태, 미리캔버스 인증 경로, 아이모두 접속 URL, 교육청 가이드라인 원문 링크.
- `showcase/items.json` — 학생 동의를 받은 작품만.

## 5. 스크린샷 자리
<!-- 사이트 각 쪽 스크린샷을 여기에 붙인다 (준비 중) -->
- 랜딩 —
- 1회차 덱 표지 —
- AI 전체 지도 (줌 1) —
- 자료실 —
- 안전 규칙 인쇄 미리보기 —

## 6. 손대면 안 되는 것
- 외부 CDN · 웹폰트 · 프레임워크 · 빌드도구를 들이지 않는다.
- 트래킹 · 애널리틱스를 넣지 않는다.
- `shared/*` 의 기존 토큰·클래스·로직은 고치지 않는다. 필요하면 **아래에 덧붙인다.**
- 학생 이름 · 사진 · 성적이 들어간 예시를 넣지 않는다.
