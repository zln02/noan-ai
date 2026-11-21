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
| Evening Road 01 (HDRI) | https://polyhaven.com/a/evening_road_01 | CC0 | 4k .hdr → 반사용 1024×512(`env_road`), 흐린 배경(`bd_road`, `hb_road`): 표지·하네스·마무리 장면, HTML 장 배경(만들 때 색을 빼서 먹빛으로: `build.py`의 `INK`) |
| School Hall (HDRI) | https://polyhaven.com/a/school_hall | CC0 | 4k .hdr → `env_hall`, `bd_hall`, `hb_hall`: AI 커닝 구간(시험장) |
| Blinds (HDRI, 실제 부엌) | https://polyhaven.com/a/blinds | CC0 | 4k .hdr → `env_kitchen`, `bd_kitchen`: 김치볶음밥 부엌 |
| Asphalt 02 | https://polyhaven.com/a/asphalt_02 | CC0 | 1k 색·노멀·거칠기 → 「하네스」 등장 장면 바닥 |
| Wood Table 001 | https://polyhaven.com/a/wood_table_001 | CC0 | 1k → 책상·바닥·수레·웍 손잡이 |
| Marble 01 | https://polyhaven.com/a/marble_01 | CC0 | 1k → 부엌 조리대 |
| Paper 003 | https://ambientcg.com/view?id=Paper003 | CC0 | 1K-JPG zip 안 `Paper003_1K-JPG_Color.jpg` 하나만 → 시험지·레시피 종이 |
| RobotExpressive (모델, 뼈대·애니메이션) | https://github.com/mrdoob/three.js/tree/r128/examples/models/gltf/RobotExpressive (원작 Tomás Laulhé, 수정 Don McCurdy) | CC0 1.0 (폴더 README.md 「CC0 1.0」 직접 확인) | .glb 그대로 `assets/m_robot.glb`: 김치볶음밥 그림책의 로봇 주인공(걷기·뛰기·도리도리·끄덕·엄지척). 재질만 덱의 툰 재질로 바꿈. 사람·캐릭터 저작물이 아닌 범용 로봇이라 골랐어요 |
| Round Spectacles (모델) | https://polyhaven.com/a/round_spectacles | CC0 | glTF 1k → `assets/m_specs.gltf`: AI 커닝 구간의 모든 안경(테는 모델 그대로, 렌즈는 덱의 유리 재질, 작은 카메라·렌즈 화면은 덱에서 덧붙임) |

## 사진 (하네스의 유래 장)

| 자산 | 출처 URL | 만든 사람 | 라이선스 | 받은 것 → 덱에서 |
|---|---|---|---|---|
| 「Three horse power.」 (목걸이 · 하메 · 끄는 줄을 채우고 밭을 가는 클라이즈데일 세 마리, 2010-04-18 촬영) | https://commons.wikimedia.org/wiki/File:Three_horse_power._(9408119676).jpg (원래 올린 곳: https://www.flickr.com/photos/volvob12b/9408119676/) | Bernard Spragg. NZ (뉴질랜드 크라이스트처치) | **CC0 1.0** (퍼블릭 도메인 기증, 출처 표시 의무 없음). 2026-11-20에 파일 쪽을 직접 열어 확인: 라이선스 틀 `{{cc-zero}}`, Flickr 검토 봇 `FlickreviewR 2`가 2021-05-09에 `cc-zero`로 통과 표시 | 1920×1321 JPEG (Commons가 만든 1920px 판) → 왼쪽 차를 잘라 16:9로, 1920×1080 JPEG `deck-v2-src/assets/p_horse.jpg`. 다시 저장하면서 EXIF(위치 정보)는 버렸어요. 색은 덱에서 CSS로 가라앉혀요(채도 0.74) |

사진 속 사람은 멀리 작게 보이는 한 명뿐이라 누구인지 알아볼 수 없어요(얼굴이 또렷한 다른 후보 사진은 그래서 쓰지 않았어요). 예전의 Poly Haven 말 조각상 모델(`horse_statue_01`)은 뺐어요.

## 상표 · 로고 (「AI 회사들도 하네스로 경쟁해요」 장)

> **2026-11-21 바뀜:** 이 장(지금 7장 「식당들도 하네스로 경쟁해요」)은 이제 회사·앱 이름과 로고를 쓰지 않아요. AI를 모르는 선생님께 이름이 어려워서 요리 비유로 바꿨어요(회사 = 식당, 앱 = 주방, AI = 요리사, 기능 = 레시피 책·도구). 색도 브랜드 색 대신 덱 색이에요. OpenAI 로고 파일은 덱에 넣지 않아요(`assets/`에 남아 있지만 build.py가 읽지 않음). 발표자용 대응표: **식당 A = ChatGPT(OpenAI) · 식당 B = Claude(Anthropic) · 식당 C = Gemini(Google)**. 몇몇 기능 이름은 쉬운 말로 바꿨어요(예: ChatGPT Work · Gemini Spark → 「대신 일하기」, ChatGPT 이미지 → 「그림 만들기」, Nano Banana · Gemini Omni → 「그림 · 영상」, Deep Research → 「딥 리서치」, Google 검색 → 「검색」). 아래 표는 확인한 원래 이름 기록이에요. 실제 앱 이름은 실습 16~17장에서만 작게 한 번씩 써요(눌러야 할 앱을 가리키려고).

이 장은 세 앱을 **가리키려고만**(지명적 사용) 이름과 로고를 써요. 어느 회사와도 제휴·후원·보증 관계가 없고, 화면 아래에 「각 상표는 해당 회사의 소유입니다. 비교 설명용.」을 적었어요. 2026-11-20에 각 회사의 공식 쪽을 직접 열어 확인했어요.

| 상표 | 덱에서 쓴 것 | 확인한 공식 쪽 | 규칙 (요약) | 판단 |
|---|---|---|---|---|
| OpenAI · ChatGPT | **공식 로고 Blossom(흰색)** `deck-v2-src/assets/logo_openai_blossom_white.svg` + 이름 글자 「ChatGPT」 | https://openai.com/brand/ (한국어판 https://openai.com/ko-KR/brand/ ). 로고 파일: 그 쪽의 「로고 다운로드」 = https://cdn.openai.com/brand/openai-logos.zip (sha256 `c54e85ab…3222db`) 안 `SVGs/OAI_OpenAI-Blossom_White.svg` (sha256 `01d15876…ce87285`) | 가이드라인을 지키는 경우에만 쓸 수 있음(사용 약관). OpenAI 서비스와 직접 관련된 경우에만 · 제공된 대로 정확하게 · OpenAI 소유임을 표시 · 보증·후원·제휴를 암시하지 않기 · 내 것보다 더 눈에 띄게 쓰지 않기 · Blossom에 색을 넣지 않기 · 복잡한 그림 위에 두지 않기 · 충분한 여백 · 굿즈·판촉물 금지 · 수정 금지. OpenAI는 언제든 허락을 거둘 수 있음 | **로고 사용.** 파일을 바이트 그대로 넣음(색·비율·여백 손대지 않음. 여백은 파일의 716×716 틀에 들어 있는 그대로), 60px로 작게, 무광 단색 판 위, ChatGPT를 설명하는 자리에만. OpenAI 워드마크와 함께 쓰지 않음 |
| Anthropic · Claude | **이름 글자만** 「Claude」(브랜드 색 `#d97757`), 로고 없음 | https://www.anthropic.com/legal/trademark-guidelines (2024-08-01 시행) | 상표는 Anthropic이 따로 허락한 방식으로만, 그리고 미리 승인받은 자료에서만 쓸 수 있음(「only in materials we approve beforehand」). 변경 금지(색·글꼴·비율) · 주변 여백 · 후원·보증 암시 금지. 문의 marketing@anthropic.com | **로고 쓰지 않음**(사전 승인이 필요한데 받지 않았어요). 승인을 받으면 로고로 바꿀 수 있어요. 보도자료 묶음(https://www.anthropic.com/press-kit)은 받지 않았어요 |
| Google · Gemini | **이름 글자만** 「Gemini」(Google 파랑 `#4285f4`), 로고 없음 | https://about.google/brand-resource-center/guidance/ · https://partnermarketinghub.withgoogle.com/brands/google/branding-guidelines/how-to-show-googles-brand/ (Gemini 전용 가이드 https://partnermarketinghub.withgoogle.com/brands/google-gemini/brand-introduction/ 는 로그인·승인 계정이 있어야 열려요) | 허락 없이 되는 것: 정보 전달용 **글자 표기**, 교재용 **고치지 않은 화면 캡처**. 제품 아이콘은 Partner Marketing Hub 계정을 만들고 승인 양식으로 **허락을 받아야** 함. 보증·제휴 암시 금지, 흉내 금지 | **로고 쓰지 않음**(제품 아이콘은 승인이 필요하고, Gemini 가이드를 열어 볼 수 없었어요). 글자 표기는 허락 없이 가능 |

- 두 이름 글자의 색은 「어느 앱인지」 알아보게 하는 용도라, 덱의 「강조색은 둘」 규칙에서 이 장만 예외로 두었어요(이름 글자와 창 위 3px 줄뿐, 화면의 1% 안쪽).
- 앱 화면은 **캡처가 아니라 직접 그린 그림**이에요(창 틀 + 가운데 「AI 두뇌」 + 둘레 기능 이름). 실제 화면을 흉내 내지 않았어요. 로그인한 앱 화면은 찍지 않았어요.
- 이 덱을 책·굿즈·광고에 쓰거나 공개 배포 범위를 넓히면 위 규칙을 다시 확인해요.

### 둘레에 적은 기능 이름 (2026-11-20 공식 도움말 확인)

| 범주 | ChatGPT | Claude | Gemini |
|---|---|---|---|
| 웹 검색 | 검색 | 웹 검색 | Google 검색 **＊확인 못 함**(도움말은 「출처 및 관련 콘텐츠 표시」까지만 확인. 기능 이름은 공식 문서에서 못 찾았어요) |
| 파일 읽기 | 파일 업로드 | 파일 업로드 (Upload files to Claude) | 파일 업로드 (Upload & analyze files) |
| 기억 | 메모리 | 메모리 (chat search and memory) | 메모리 (2026-03-26 「과거 채팅」에서 이름 바뀜) |
| 스킬 | 스킬 (2026-07-09 정식, 플러그인 디렉터리의 스킬 탭. Enterprise·Edu부터) | 스킬 (What are skills?) | 스킬 (2026-11부터 개인 계정의 Gems를 대신함) |
| 깊이 조사 | 심층 리서치 | 리서치 (Use research on Claude) | Deep Research |
| 앱 연결 | 플러그인 (2026-07-09 앱 디렉터리 → 플러그인 디렉터리. 스킬·앱을 묶음) | 커넥터 (Connectors) | 연결된 앱 |
| 대신 일하기 | ChatGPT Work (브라우저·데스크톱 앱·파일에서 작업) | 컴퓨터 사용 (Let Claude use your computer in Cowork. Pro·Max·Ultra, 데스크톱 앱) | Gemini Spark (2026-05-19, 개인 AI 에이전트로 소개) |
| 그림·영상 | ChatGPT 이미지 (2026-09-08 이미지 2.5). 영상 기능은 확인 못 해서 적지 않음 | **없음** (도움말: 사진·일러스트 같은 그림은 만들지 않는다고 적혀 있어요. 도표·아티팩트는 만들어요) | Nano Banana(그림) · Gemini Omni(영상, 2026-05-19) |

확인한 쪽: ChatGPT https://help.openai.com/ko-kr/articles/6825453-chatgpt-release-notes · https://help.openai.com/ko-kr/articles/9260256-chatgpt-capabilities-overview / Claude https://support.claude.com/en/collections/18031719-features-and-capabilities · https://support.claude.com/en/articles/9002504-can-claude-produce-images · https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork · https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context / Gemini https://gemini.google/release-notes/ · https://support.google.com/gemini/answer/18560919?hl=ko · https://support.google.com/gemini/answer/14903178

적지 않은 것: 「코드 실행」 범주(ChatGPT 「데이터 분석」, Claude 「파일 만들기」는 확인. Gemini 쪽 이름을 확인하지 못해 범주째 뺐어요). 기능은 요금제·기기·나라마다 다르고 자주 바뀌어요. Claude 한국어 화면의 이름은 영어 도움말 이름을 옮긴 것이라 실제 화면과 다를 수 있어요. 연수 전에 한 번 더 확인해요.

## 글꼴

| 이름 | 버전 | 라이선스 | 어디서 | 메모 |
|---|---|---|---|---|
| Pretendard (가변) | 1.3.9 | SIL OFL 1.1, Copyright (c) 2021 Kil Hyung-jin, Reserved Font Name 「Pretendard」 | `npm pack pretendard@1.3.9` → `dist/LICENSE.txt` 직접 읽음 → `deck-v2-src/vendor/pretendard/` | 제목·본문 글꼴. 만들 때 덱에 쓰인 글자만 잘라 넣고(약 120KB), OFL 예약 이름 규칙에 따라 잘라 낸 글꼴의 이름은 「TS Deck Sans」로 바꿈(저작권·라이선스 이름표는 남김) |

Noto Serif KR은 이제 넣지 않아요(쓰지 않아서). Noto Sans KR은 비상용으로만 남겼어요.

라이선스 확인: Poly Haven 「All assets are CC0」 (https://polyhaven.com/license), ambientCG 「CC0 1.0 Universal」 (https://docs.ambientcg.com/license/). 영상 텍스처는 쓰지 않았어요(움직임은 셰이더·텍스처 이동으로).

다시 만들기: `set PYTHONUTF8=1 && py docs/training/deck-v2-src/build.py`
(three.js는 이미 만든 `deck-v2.html` 안의 블록을 해시 확인 뒤 다시 씁니다. 처음부터 만들 때는 `--three <패키지>/build/three.min.js`.)

CC0 자산 다시 만들기: 위 URL에서 받은 파일을 새 빈 폴더에 두고 `set PYTHONUTF8=1 && py -I docs/training/deck-v2-src/prep_assets.py --src <그 폴더>`.
말 사진만 다시 만들기: `py -I docs/training/deck-v2-src/prep_assets.py --horse <받은 사진>`.
「그냥 AI」 비교 화면 다시 찍기: `py docs/training/deck-v2-src/recapture_bare.py` → `deck-v2-src/compare-bare/*.png` (원본 결과물은 `compare/raw/`, 내용은 그대로 두고 찍는 창 크기만 맞춰요).
WebGL이 없을 때 보여 줄 장면 사진: `py docs/training/deck-v2-src/shoot.py --stills` → `deck-v2-src/stills/*.jpg` → build.py를 다시 돌리면 들어가요.

`docs/training/compare/` 화면(시연 결과 캡처)은 있으면 만들 때 JPEG data URI로 넣고, 없으면 「결과 화면 들어갈 자리」 틀을 보여 줍니다.
