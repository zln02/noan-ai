-- 독도 OX 퀴즈 랭킹 (노안초 × 노안남초 × 노안중 · 독도의 날)
-- level: 'elem' = 초등 문제 판, 'mid' = 중학생 문제 판 (문제 난이도가 달라 랭킹을 따로 매김)
create table public.dokdo_ox_scores (
  id          bigint generated always as identity primary key,
  client_id   text        not null unique check (char_length(client_id) between 4 and 40),
  season      text        not null default '2026 독도의 날 OX' check (char_length(season) between 1 and 30),
  name        text        not null check (char_length(btrim(name)) between 1 and 8),
  org         text        not null default '' check (char_length(org) <= 10),
  level       text        not null default 'elem' check (level in ('elem', 'mid')),
  correct     smallint    not null check (correct between 0 and 15),
  total       smallint    not null check (total between 5 and 15),
  ms          integer     not null check (ms between 1000 and 3600000),
  created_at  timestamptz not null default now(),
  check (correct <= total)
);

comment on table public.dokdo_ox_scores is '독도 OX 퀴즈 기록. 페이지(anon)는 추가·조회만 가능.';

create index dokdo_ox_scores_rank_idx on public.dokdo_ox_scores (season, level, total, correct desc, ms, created_at);

alter table public.dokdo_ox_scores enable row level security;

-- 누구나 랭킹을 볼 수 있음
create policy "anyone can read ox scores" on public.dokdo_ox_scores
  for select to anon, authenticated using (true);

-- 누구나 기록을 추가할 수 있음 (값 범위는 위 check 제약이 막음)
create policy "anyone can add an ox score" on public.dokdo_ox_scores
  for insert to anon, authenticated with check (true);

-- 수정·삭제 정책은 만들지 않음 → 페이지에서는 불가능. 지우기는 대시보드에서만.
-- 열 단위 권한: 기록 시각(created_at)·id 는 서버가 정함
revoke all on public.dokdo_ox_scores from anon, authenticated;
grant select on public.dokdo_ox_scores to anon, authenticated;
grant insert (client_id, season, name, org, level, correct, total, ms) on public.dokdo_ox_scores to anon, authenticated;
