create table if not exists public.art_access_codes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.art_sessions(id) on delete cascade,
  code_hash text not null,
  label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(session_id,code_hash)
);

alter table public.art_access_codes enable row level security;
revoke all on public.art_access_codes from anon, authenticated;

update public.art_sessions set max_images=3,max_videos=1,max_total_images=60,max_total_videos=20 where code='NOAN-ART';

insert into public.art_access_codes(session_id,code_hash,label) select id,'4ca221f53581e1443e3f982e6ac076ab63171008800c8272a88ffc556c21384f','학생 01' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'3cae13c25ce2f9daf95ef8c552f476b74b3f282a297577ef2d641a8337dc6ad9','학생 02' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'bb675dcf2c8cb70f5ca6f4067a791de03a217ba51a9749462b343e651e9726e9','학생 03' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'8fb645d633c460d2477100986f686462fe707a4a4c99e8fec9c614e55fea5b04','학생 04' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'107b7b1cfdebad4863eb35298cd9539834dd6ee3cd28c503a8f3fc276bd75987','학생 05' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'53badc9a9ba81f949751b993c5146e4650642125274afa051bd70eb7ee3a70f5','학생 06' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'1f52207ea4f85b12164457dede96795ea76bafcdaf0c8edd5efcf689b0bd239c','학생 07' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'3e4e6e006635a4f11f198a3e4c34d2e2e6bd92c30bc9257e344285768997540f','학생 08' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'83c5c92927954ef220c4b863edf0d6c6122d50a717c2a4ae7e7bfed21f35e0a2','학생 09' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'4c591091a17396618f5455a129c407be58f0e604ae4be38a535c0796ad256743','학생 10' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'8f47b7eb99ccb0234eafc1b95a248ab14290cb4c21ddce433f4c20d76f9b046e','학생 11' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'0c7604d4a0feb828c36ac531e75e7acdb53efa923a7963745a8260b7197bb95f','학생 12' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'98902dca28e79105ea582197ccdbc7b1179c7dcc074831f08eb645e29ca319c5','학생 13' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'4803aea7bb8a70a0ea951151739b3eb0099e4d64481b21d4125b5ca7212d5791','학생 14' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'7cd9eefdea4e829ebf8403aeeef5bed699d9e4645a830cd73516f08840caf36e','학생 15' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'4e95991f68ebad7283ca8ef2390bc83d5638fe110122b581ed60ba41c1be852a','학생 16' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'1a1269dc6d2003b9f896c5783f66b12637c122f086987185a230287f00ae1771','학생 17' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'9a14ae7a96f30c4fbe5dbb7e7e4f22ba174237d277cc285db8ce384e2e772676','학생 18' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'c1d363017749cf92fa549be1a00b76f298eb9c3b890111c735fe924b04fd09dc','학생 19' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
insert into public.art_access_codes(session_id,code_hash,label) select id,'bd560a13ec412608a1e0f22a791849a4263ac880d3f38350085afb16246f051c','학생 20' from public.art_sessions where code='NOAN-ART' on conflict do nothing;
