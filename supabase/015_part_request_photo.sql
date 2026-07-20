-- Studio 18 — permite anexar uma foto na solicitação de peça faltante,
-- visível depois no painel de gestão.
-- Rode no SQL Editor do Supabase.

alter table part_requests add column if not exists photo_url text;

-- Bucket público para as fotos anexadas pelo cliente no formulário do site.
-- Público só para leitura (a foto precisa aparecer direto via URL no painel
-- de gestão) — o upload em si é feito pelo próprio cliente anônimo, então a
-- policy de insert abaixo libera isso apenas para este bucket específico.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'part-request-photos',
  'part-request-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public can upload part request photos" on storage.objects
  for insert
  with check (bucket_id = 'part-request-photos');

create policy "public can read part request photos" on storage.objects
  for select
  using (bucket_id = 'part-request-photos');
