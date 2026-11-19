# Alpine.js 3.17.5 (MIT)

- 파일: `alpine.min.js` = npm `alpinejs@3.17.5` 의 `dist/cdn.min.js` 를 고치지 않고 그대로 넣었다.
- 라이선스: `LICENSE.md` (MIT, Copyright © 2019-2025 Caleb Porzio and contributors, github.com/alpinejs/alpine).
- 외부 요청 없음. `shared/app.js` 가 받쳐 주는 브라우저(크롬 80 이상 — `?.`·`??` 문법, Proxy, queueMicrotask)에서만
  `<html class="alpine-ok">` 를 붙이고 이 파일을 불러온다. 아니면 쪽마다 있는 「자바스크립트 없이도 보이는 목록」이 그대로 쓰인다.
- 판을 바꿀 때: 새 `cdn.min.js` 로 바꾸고 이 글의 판 번호와 `sw.js` 의 `CACHE_VERSION` 을 올린다.
