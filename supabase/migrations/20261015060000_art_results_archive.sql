-- Keep AI results permanently (Luma links expire after 1 hour) and record prompts.
alter table public.art_jobs add column if not exists storage_path text;
alter table public.art_jobs add column if not exists prompt text;
alter table public.art_jobs add column if not exists polished_prompt text;

insert into storage.buckets (id, name, public)
values ('art-results', 'art-results', false)
on conflict (id) do nothing;

-- Admin tokens (hashed) for the one-off "archive" recovery action.
create table if not exists public.art_admin_tokens (
  token_hash text primary key,
  label text not null,
  created_at timestamptz not null default now()
);
alter table public.art_admin_tokens enable row level security;
revoke all on public.art_admin_tokens from anon, authenticated;

create extension if not exists pg_net;
