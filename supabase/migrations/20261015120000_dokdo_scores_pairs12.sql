-- 독도 기억력 게임: 한 가지 모드(같은 그림 12쌍 = 카드 24장)로 바꾸면서 pairs 허용 범위를 5~12로 넓힘.
-- 원래 제약은 20261008054129_dokdo_scores.sql 의 열 제약 `check (pairs between 5 and 8)` (이름 없음 → 기본 이름 dokdo_scores_pairs_check).
-- 이름이 달라도 지워지도록 pairs 열에 걸린 check 제약을 찾아서 지운 뒤 다시 만든다.
do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
    where con.conrelid = 'public.dokdo_scores'::regclass
      and con.contype = 'c'
      and att.attname = 'pairs'
  loop
    execute format('alter table public.dokdo_scores drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.dokdo_scores
  add constraint dokdo_scores_pairs_check check (pairs between 5 and 12);
