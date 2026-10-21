# 노안중 AI교육 포털 구조

```mermaid
flowchart LR
  T[교사] --> H[업무별 안내서 /]
  T --> P[자료실·연수·활용 사례·수업 도구]
  H --> Q[검색·빠른 업무 카드]
  Q --> D[업무 상세와 복사 가능한 요청문]
  D --> J[아이모두 / JNE GPT 등 실제 도구]
  JSON[(data/*.json 원본)] --> H
  JSON --> P
  JSON --> S[sync-data.js]
  S --> JS[data/*.js 오프라인 대체]
  JS --> H
  JS --> P
  JSON --> B[guide-build.py]
  B --> PDF[인쇄용 안내서 PDF]
  P --> ST[studio/ 수업 도구]
```

## 데이터와 게시 흐름

- `data/tasks.json`이 업무 안내서의 원본이다. 번호와 ID가 유일하고, 제목·상황·검색어·단계·요청문·주의 사항을 담는다.
- `data/quicktasks.json`은 첫 화면 바로가기다. 각 `no`는 업무 안내서 번호와 연결한다.
- `data/showcase.json`은 동의를 확인한 학생 작품만 다룬다. 실제 개발된 수업 도구는 활용 사례에서 별도 섹션으로 소개한다.
- `tools/sync-data.js`는 `file://`에서도 읽을 수 있도록 JSON과 같은 내용의 JS 대체 파일을 만든다.
- `tools/guide-build.py`는 같은 업무 원본으로 인쇄용 HTML을 만든다. PDF는 이 HTML을 A4 가로로 인쇄한다.
- `tools/test-portal.js`는 업무 데이터, 캡처 파일, 바로가기, 도구 링크, 동의 필터와 공통 스타일 연결을 검사한다.

## 화면 동작

```mermaid
sequenceDiagram
  actor 교사
  participant 홈 as 안내서 홈
  participant 데이터 as tasks.json / tasks.js
  participant 도구 as 아이모두 등
  교사->>홈: 업무 검색 또는 빠른 카드 선택
  홈->>데이터: 안내서 목록 읽기
  데이터-->>홈: 일치하는 업무와 상세 단계
  홈-->>교사: 경로·단계·요청문·주의 사항 표시
  교사->>도구: 확인된 자료로 업무 실행
```

## 확인 명령

`node tools/sync-data.js --check` · `node --test tools/test-portal.js` · `git diff --check`

학생 작품·연수 일정·학교 실적은 실제 기록과 공개 동의를 확인한 뒤에만 추가한다. 업무 요청문은 초안이며 날짜·담당·성취기준·평가 규정은 교사가 원본에서 확인한다.
