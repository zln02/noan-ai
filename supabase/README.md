# 미술 수업용 생성 서버

`studio/art-motion/`의 유료 생성 요청만 처리한다. 브라우저에는 Luma 키를 넣지 않는다.

## 배포 순서

1. Supabase SQL Editor에서 `migrations/202610120001_art_motion.sql` 실행
2. 마지막 주석의 `insert into art_sessions...`를 수업 코드·종료 시각에 맞춰 실행. 기본값은 20명, 1인당 이미지 1회·540p 영상 1회다.
3. Edge Function Secrets에 `LUMA_AGENTS_API_KEY` 저장
4. `supabase functions deploy art-motion --project-ref dovpodhwmredayldjrvb --no-verify-jwt`
5. `studio/art-motion/index.html`에서 수업 코드로 실제 그림 1장만 시험

학생 이름은 받지 않는다. 그림은 Supabase Storage에 저장하지 않으며 Luma에 인라인으로 전달한다. 생성 결과 URL은 내려받기용으로만 보여 준다.
