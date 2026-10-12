-- 독도 기억력 게임 랭킹 (노안남초 × 노안중 × 독도)
create table public.dokdo_scores (
  id          bigint generated always as identity primary key,
  client_id   text        not null unique check (char_length(client_id) between 4 and 40),
  season      text        not null default '2026 독도의 날' check (char_length(season) between 1 and 30),
  name        text        not null check (char_length(btrim(name)) between 1 and 8),
  org         text        not null default '' check (char_length(org) <= 10),
  ms          integer     not null check (ms between 1500 and 3600000),
  miss        integer     not null default 0 check (miss between 0 and 999),
  pairs       smallint    not null check (pairs between 5 and 8),
  mode        text        not null check (mode in ('same', 'qa')),
  created_at  timestamptz not null default now()
);

comment on table public.dokdo_scores is '독도 기억력 게임 기록. 페이지(anon)는 추가·조회만 가능.';

create index dokdo_scores_rank_idx on public.dokdo_scores (season, pairs, mode, ms, created_at);

alter table public.dokdo_scores enable row level security;

-- 누구나 랭킹을 볼 수 있음
create policy "anyone can read scores" on public.dokdo_scores
  for select to anon, authenticated using (true);

-- 누구나 기록을 추가할 수 있음 (값 범위는 위 check 제약이 막음)
create policy "anyone can add a score" on public.dokdo_scores
  for insert to anon, authenticated with check (true);

-- 수정·삭제 정책은 만들지 않음 → 페이지에서는 불가능. 지우기는 대시보드에서만.
-- 열 단위 권한: 기록 시각(created_at)·id 는 서버가 정함
revoke all on public.dokdo_scores from anon, authenticated;
grant select on public.dokdo_scores to anon, authenticated;
grant insert (client_id, season, name, org, ms, miss, pairs, mode) on public.dokdo_scores to anon, authenticated;
;
