-- art_usage.client_id 길이 상한 80 → 120
-- 기록용: 이 변경은 운영 DB(Supabase)에 이미 적용돼 있어요. 이 파일을 커밋해도 DB는 바뀌지 않아요.
-- (다시 실행해도 같은 제약으로 바뀌어 결과는 같아요. 처음 제약: 202610120001_art_motion.sql 의 between 8 and 80)
alter table public.art_usage drop constraint art_usage_client_id_check;
alter table public.art_usage add constraint art_usage_client_id_check check (char_length(client_id) between 8 and 120);
