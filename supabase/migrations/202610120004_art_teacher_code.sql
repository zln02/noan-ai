alter table public.art_access_codes add column if not exists unlimited boolean not null default false;

insert into public.art_access_codes(session_id,code_hash,label,unlimited)
select id,'0e0d4618ccaccb1837463085b1d06dd0ca32bbe0e12cf81e29c459dcafa28ae0','선생님 실험용',true
from public.art_sessions where code='NOAN-ART'
on conflict (session_id,code_hash) do update set active=true,unlimited=true,label=excluded.label;
