create table if not exists public.art_sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (char_length(code) between 4 and 20),
  active boolean not null default true,
  max_images integer not null default 1 check (max_images between 0 and 10),
  max_videos integer not null default 1 check (max_videos between 0 and 5),
  max_total_images integer not null default 20 check (max_total_images between 0 and 100),
  max_total_videos integer not null default 20 check (max_total_videos between 0 and 100),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.art_usage (
  session_id uuid not null references public.art_sessions(id) on delete cascade,
  client_id text not null check (char_length(client_id) between 8 and 80),
  images_used integer not null default 0,
  videos_used integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (session_id, client_id)
);

create table if not exists public.art_jobs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.art_sessions(id) on delete cascade,
  client_id text not null,
  kind text not null check (kind in ('image','video')),
  provider_id uuid unique not null,
  state text not null default 'queued',
  result_url text,
  created_at timestamptz not null default now()
);

alter table public.art_sessions enable row level security;
alter table public.art_usage enable row level security;
alter table public.art_jobs enable row level security;

create or replace function public.reserve_art_quota(p_session_id uuid, p_client_id text, p_kind text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare s public.art_sessions; u public.art_usage; total_used integer;
begin
  select * into s from public.art_sessions where id=p_session_id and active=true and (expires_at is null or expires_at >= now()) for update;
  if not found then return jsonb_build_object('allowed',false); end if;
  insert into public.art_usage(session_id,client_id) values(p_session_id,p_client_id) on conflict do nothing;
  select * into u from public.art_usage where session_id=p_session_id and client_id=p_client_id for update;
  if p_kind='image' then select coalesce(sum(images_used),0) into total_used from public.art_usage where session_id=p_session_id;
  else select coalesce(sum(videos_used),0) into total_used from public.art_usage where session_id=p_session_id; end if;
  if p_kind='image' and u.images_used < s.max_images and total_used < s.max_total_images then
    update public.art_usage set images_used=images_used+1,updated_at=now() where session_id=p_session_id and client_id=p_client_id;
    return jsonb_build_object('allowed',true);
  elsif p_kind='video' and u.videos_used < s.max_videos and total_used < s.max_total_videos then
    update public.art_usage set videos_used=videos_used+1,updated_at=now() where session_id=p_session_id and client_id=p_client_id;
    return jsonb_build_object('allowed',true);
  end if;
  return jsonb_build_object('allowed',false);
end $$;

revoke all on public.art_sessions, public.art_usage, public.art_jobs from anon, authenticated;
revoke all on function public.reserve_art_quota(uuid,text,text) from public, anon, authenticated;

create or replace function public.release_art_quota(p_session_id uuid, p_client_id text, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind='image' then
    update public.art_usage set images_used=greatest(0,images_used-1),updated_at=now()
      where session_id=p_session_id and client_id=p_client_id;
  elsif p_kind='video' then
    update public.art_usage set videos_used=greatest(0,videos_used-1),updated_at=now()
      where session_id=p_session_id and client_id=p_client_id;
  end if;
end $$;

revoke all on function public.release_art_quota(uuid,text,text) from public, anon, authenticated;

-- 배포 전 수업 코드와 만료 시각을 바꿔 한 줄만 실행한다.
-- insert into public.art_sessions(code,expires_at,max_total_images,max_total_videos) values ('NOAN-ART', '2026-12-31 18:00+09',20,20);
