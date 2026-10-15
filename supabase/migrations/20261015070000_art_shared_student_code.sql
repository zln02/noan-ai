-- One easy shared code for a whole class; usage is counted per device per day in the edge function.
alter table public.art_access_codes add column if not exists shared boolean not null default false;
alter table public.art_jobs add column if not exists student_no integer;

update public.art_sessions
set max_images = 5, max_videos = 2, max_total_images = 100, max_total_videos = 50
where code = 'NOAN-ART';
-- The shared student code and the teacher code are inserted as hashes directly (not stored in the repo).
