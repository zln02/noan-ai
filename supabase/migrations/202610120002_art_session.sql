insert into public.art_sessions (
  code, active, max_images, max_videos, max_total_images, max_total_videos, expires_at
) values (
  'NOAN-ART', true, 1, 1, 20, 20, null
)
on conflict (code) do update set
  active = excluded.active,
  max_images = excluded.max_images,
  max_videos = excluded.max_videos,
  max_total_images = excluded.max_total_images,
  max_total_videos = excluded.max_total_videos;
