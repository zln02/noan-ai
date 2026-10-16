-- 독도 생물 합치기 랭킹 (노안초 × 노안남초 × 노안중 · 독도의 날)
-- score 상한 130000: 5분 판을 쿨다운 한계 속도(0.433초마다 1개, 693개)로 넘침 판정 없이 끝까지 두고
-- 원하는 생물(1~5단계)을 골라 떨어뜨리는 '완벽한' 시뮬레이션 최고점 42,954점의 약 3배.
-- (실제 규칙 시뮬레이션 최고점은 7,662점. 관리 화면 7분 설정이어도 약 6만 점 이하)
-- ms 상한 450000: 관리 화면 최대 7분(420초) + 여유 30초. 시간 제한 없는 판은 온라인에 올리지 않음.
create table public.dokdo_merge_scores (
  id          bigint generated always as identity primary key,
  client_id   text        not null unique check (char_length(client_id) between 4 and 40),
  season      text        not null default '2026 독도의 날' check (char_length(season) between 1 and 30),
  name        text        not null check (char_length(btrim(name)) between 1 and 8),
  org         text        not null default '' check (char_length(org) <= 10),
  score       integer     not null check (score between 0 and 130000),
  max_level   smallint    not null check (max_level between 1 and 11),
  ms          integer     not null check (ms between 1000 and 450000),
  created_at  timestamptz not null default now()
);

comment on table public.dokdo_merge_scores is '독도 생물 합치기 기록. 페이지(anon)는 추가·조회만 가능.';

create index dokdo_merge_scores_rank_idx on public.dokdo_merge_scores (season, score desc, created_at);

alter table public.dokdo_merge_scores enable row level security;

-- 누구나 랭킹을 볼 수 있음
create policy "anyone can read merge scores" on public.dokdo_merge_scores
  for select to anon, authenticated using (true);

-- 누구나 기록을 추가할 수 있음 (값 범위는 위 check 제약이 막음)
create policy "anyone can add a merge score" on public.dokdo_merge_scores
  for insert to anon, authenticated with check (true);

-- 수정·삭제 정책은 만들지 않음 → 페이지에서는 불가능. 지우기는 대시보드에서만.
-- 열 단위 권한: 기록 시각(created_at)·id 는 서버가 정함
revoke all on public.dokdo_merge_scores from anon, authenticated;
grant select on public.dokdo_merge_scores to anon, authenticated;
grant insert (client_id, season, name, org, score, max_level, ms) on public.dokdo_merge_scores to anon, authenticated;
