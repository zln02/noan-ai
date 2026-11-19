# deck-v2.html: 함께 들어간 남의 코드·글꼴

`deck-v2.html`은 인터넷 없이 열리도록 아래 코드를 파일 안에 그대로 넣었습니다. 외부 요청은 0개입니다.

| 이름 | 버전 | 라이선스 | 어디서 | 메모 |
|---|---|---|---|---|
| three.js | r128 (`three@0.128.0`, `build/three.min.js`) | MIT, Copyright © 2010-2021 three.js authors | `npm pack three@0.128.0 --ignore-scripts` 뒤 패키지 안 `LICENSE`를 직접 읽음 | sha256 `9274bbce…2c1ce2`. 3D 장면 6개. ES5 UMD 빌드라 오래된 크롬에서도 돌아감 (`?.`처럼 보이는 곳은 삼항 연산자 `?.07`) |
| anime.js | 4.5.0 | MIT, Copyright (c) 2025 Julian Garnier | 저장소 `shared/vendor/animejs` (읽기만) | 빌드·글자 움직임 |
| Lucide icons | 1.75.0 (스프라이트에서 쓰는 기호만) | ISC, Copyright (c) 2026 Lucide Icons and Contributors | `shared/vendor/lucide` (읽기만) | |
| Noto Sans KR · Noto Serif KR | KS X 1001 부분 글꼴 | SIL Open Font License 1.1 | `shared/fonts` 임베더 (읽기만) | 덱에 쓰인 글자만 잘라 넣음 |
| QR Code generator (Project Nayuki) | 저장소 동봉본 | MIT | `shared/vendor/qrcodegen` (만들 때 SVG로 그림) | 마지막 장 사이트 QR |
| three.js 후처리·모델 읽기 (examples/js) | r128: `EffectComposer` `RenderPass` `ShaderPass` `UnrealBloomPass` `CopyShader` `LuminosityHighPassShader` `GLTFLoader` | MIT, Copyright © 2010-2021 three.js authors | 같은 `npm pack three@0.128.0` 패키지의 `examples/js/` → `deck-v2-src/vendor/three-post/` (LICENSE 동봉) | 빛 번짐(블룸). 초점 흐림·비네트·그레인은 덱 안 셰이더(직접 작성) |

## CC0 사진·텍스처 (3D 장면 환경·재질, HTML 장 배경)

모두 CC0(퍼블릭 도메인, 출처 표시 의무 없음)입니다. 공식 사이트/API에서 받은 뒤 `deck-v2-src/prep_assets.py`로 줄이고 색을 맞춰 `deck-v2-src/assets/*.jpg`에 넣었습니다(받은 원본은 그림으로만 열었어요).

| 자산 | 출처 URL | 라이선스 | 받은 것 → 덱에서 |
|---|---|---|---|
| Evening Road 01 (HDRI) | https://polyhaven.com/a/evening_road_01 | CC0 | 4k .hdr → 반사용 1024×512(`env_road`), 흐린 배경(`bd_road`, `hb_road`): 표지·하네스·말 장면, 밝은 HTML 장 배경 |
| School Hall (HDRI) | https://polyhaven.com/a/school_hall | CC0 | 4k .hdr → `env_hall`, `bd_hall`, `hb_hall`: AI 커닝 구간(시험장) |
| Blinds (HDRI, 실제 부엌) | https://polyhaven.com/a/blinds | CC0 | 4k .hdr → `env_kitchen`, `bd_kitchen`: 김치볶음밥 부엌 |
| Asphalt 02 | https://polyhaven.com/a/asphalt_02 | CC0 | 1k 색·노멀·거칠기 → 「하네스」 등장 장면 바닥 |
| Aerial Grass Rock | https://polyhaven.com/a/aerial_grass_rock | CC0 | 1k → 말 장면 풀밭 |
| Wood Table 001 | https://polyhaven.com/a/wood_table_001 | CC0 | 1k → 책상·바닥·수레·웍 손잡이 |
| Marble 01 | https://polyhaven.com/a/marble_01 | CC0 | 1k → 부엌 조리대 |
| Paper 003 | https://ambientcg.com/view?id=Paper003 | CC0 | 1K-JPG zip 안 `Paper003_1K-JPG_Color.jpg` 하나만 → 시험지·레시피 종이 |
| Horse Statue 01 (모델) | https://polyhaven.com/a/horse_statue_01 | CC0 | glTF 1k → 텍스처 512로 줄여 한 파일(`assets/m_horse.gltf`): 「하네스의 원래 뜻」 말 조각상. 손으로 만든 말보다 훨씬 나아서 |
| RobotExpressive (모델, 뼈대·애니메이션) | https://github.com/mrdoob/three.js/tree/r128/examples/models/gltf/RobotExpressive (원작 Tomás Laulhé, 수정 Don McCurdy) | CC0 1.0 (폴더 README.md 「CC0 1.0」 직접 확인) | .glb 그대로 `assets/m_robot.glb`: 김치볶음밥 그림책의 로봇 주인공(걷기·뛰기·도리도리·끄덕·엄지척). 재질만 덱의 툰 재질로 바꿈. 사람·캐릭터 저작물이 아닌 범용 로봇이라 골랐어요 |
| Round Spectacles (모델) | https://polyhaven.com/a/round_spectacles | CC0 | glTF 1k → `assets/m_specs.gltf`: AI 커닝 구간의 모든 안경(테는 모델 그대로, 렌즈는 덱의 유리 재질, 작은 카메라·렌즈 화면은 덱에서 덧붙임) |

## 글꼴

| 이름 | 버전 | 라이선스 | 어디서 | 메모 |
|---|---|---|---|---|
| Pretendard (가변) | 1.3.9 | SIL OFL 1.1, Copyright (c) 2021 Kil Hyung-jin, Reserved Font Name 「Pretendard」 | `npm pack pretendard@1.3.9` → `dist/LICENSE.txt` 직접 읽음 → `deck-v2-src/vendor/pretendard/` | 제목·본문 글꼴. 만들 때 덱에 쓰인 글자만 잘라 넣고(약 120KB), OFL 예약 이름 규칙에 따라 잘라 낸 글꼴의 이름은 「TS Deck Sans」로 바꿈(저작권·라이선스 이름표는 남김) |

Noto Serif KR은 이제 넣지 않아요(쓰지 않아서). Noto Sans KR은 비상용으로만 남겼어요.

라이선스 확인: Poly Haven 「All assets are CC0」 (https://polyhaven.com/license), ambientCG 「CC0 1.0 Universal」 (https://docs.ambientcg.com/license/). 영상 텍스처는 쓰지 않았어요(움직임은 셰이더·텍스처 이동으로).

다시 만들기: `set PYTHONUTF8=1 && py docs/training/deck-v2-src/build.py`
(three.js는 이미 만든 `deck-v2.html` 안의 블록을 해시 확인 뒤 다시 씁니다. 처음부터 만들 때는 `--three <패키지>/build/three.min.js`.)

CC0 자산 다시 만들기: 위 URL에서 받은 파일을 새 빈 폴더에 두고 `set PYTHONUTF8=1 && py -I docs/training/deck-v2-src/prep_assets.py --src <그 폴더>`.
WebGL이 없을 때 보여 줄 장면 사진: `py docs/training/deck-v2-src/shoot.py --stills` → `deck-v2-src/stills/*.jpg` → build.py를 다시 돌리면 들어가요.

`docs/training/compare/` 화면(시연 결과 캡처)은 있으면 만들 때 JPEG data URI로 넣고, 없으면 「결과 화면 들어갈 자리」 틀을 보여 줍니다.
