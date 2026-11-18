-- 안내서 「이 지시서 도움 됐어요」 (선택 기능). 소유자가 Supabase SQL Editor 에서 직접 실행한다.
-- 저장소에는 anon(공개) 키만 shared/config.js 에 넣는다. 서비스 키는 절대 넣지 않는다.
-- 이름·학교·IP·기기 정보를 받지 않는다. 카드 번호와 도움 여부뿐이다.

create table if not exists public.prompt_feedback (
  id         bigint generated always as identity primary key,
  task_id    text not null check (task_id ~ '^[0-9]{2}[a-z]?$'),   -- 안내서 카드 번호 (예: 04, 01b)
  helpful    boolean not null,
  created_at timestamptz not null default now()
);

alter table public.prompt_feedback enable row level security;

-- 누구나(anon) 한 줄 추가만 가능. 읽기·수정·삭제는 anon 에게 열지 않는다.
drop policy if exists "anon insert feedback" on public.prompt_feedback;
create policy "anon insert feedback" on public.prompt_feedback
  for insert to anon with check (true);

revoke all on public.prompt_feedback from anon;
grant insert on public.prompt_feedback to anon;

-- 집계는 소유자만 본다 (SQL Editor):
--   select task_id, count(*) filter (where helpful) as good, count(*) as total
--   from prompt_feedback group by 1 order by good desc;
-- 선택 기능으로 공지·요청 접수도 같은 방식(insert-only RLS)으로 붙일 수 있다.
