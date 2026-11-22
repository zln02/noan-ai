# deck-v3 출처 · 라이선스

`deck-v3.html`(메인 연수 덱 21장)은 `deck-v2`와 같은 엔진 · 사진 · 3D 모델 · 글꼴을 써요.
코드 라이선스, CC0 사진·텍스처·모델, 글꼴(Pretendard 부분 글꼴 「TS Deck Sans」, Noto Sans KR), 아이콘(Lucide), 상표 문구, 식당 A·B·C 대응표는
모두 [deck-v2-NOTICE.md](deck-v2-NOTICE.md)와 같아요.

v3에서 더한 것
- **장면 그림** (`deck-v3-src/illust/*.jpg`: cover-a/b/c · restaurants · kitchen-backdrop · open-kitchen · life · work · class 등):
  연수를 위해 이번에 새로 그린 그림이에요(이미지 생성 모델로 만들고 사람이 골랐어요). 글자 · 실제 회사 로고 · 알려진 캐릭터 · 실제 사람 얼굴은 넣지 않았어요.
  빌드 때 1600px · JPEG(250 KB 이하)로 줄여 넣어요. 3D 장면 뒤에는 어둡게 한 판을 써요.
- **움직임 코드** (`deck-v3-src/motion.js` · `motion2.js` · `motion.css` · `motion2.css`): 이 저장소에서 새로 쓴 코드. anime.js 4.5.0(MIT)을 시계로만 써요.
- **13장 로봇 요리사**: 코드로 만든 3D 로봇 `deck-v3-src/robot.js`(RobotChef, 이 저장소에서 새로 씀, 그림 파일 없음)가 주인공이에요.
  예전 RobotExpressive.glb(CC0)는 v3에서 더 넣지 않아요(v2는 그대로). 진짜 그래픽 칩이 없는 PC에서는 종이 인형 로봇(`deck-v3-src/puppet/*.webp`, 이번에 새로 그린 그림 조각)으로 자동으로 바뀌어요.
- AI 커닝 이야기는 메인 덱에서 뺐어요: [ai-cheating/](ai-cheating/) (같은 엔진으로 따로 만듦).

## deck-e 바탕 · 그림 (2026-11-22)
- `deck-v3-src/illust-e/*.jpg` 6장 (바탕 e-bg-a · e-bg-b · e-bg-c, 그림 spot-wall · spot-plates · spot-tools): 이 저장소 작업 중 Codex CLI 그림 만들기(`codex exec`)로 새로 만든 그림이에요.
  글자 · 상표 · 실제 인물 없음. 로봇 요리사는 이 덱의 그림 조각(puppet/)을 참고로 줬어요. 프롬프트와 쓰는 장은 `deck-v3-src/illust-e/manifest.json`.
  바탕 3장은 공통 색(먹 · 주홍 · 코발트)으로 같은 색 보정 · 같은 흐림 · 같은 낟알을 넣었어요 (scratchpad post.py와 같은 값).
