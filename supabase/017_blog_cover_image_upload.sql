-- Studio 18 — permite subir a imagem de capa do blog direto pelo painel de
-- gestão (sem precisar de um host externo). Rode no SQL Editor do Supabase.

-- Bucket público para as imagens de capa dos artigos — público só para
-- leitura (o site precisa exibir a imagem direto via URL), o upload em si
-- é feito apenas pela equipe autenticada no painel de gestão.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-covers',
  'blog-covers',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "authenticated can upload blog covers" on storage.objects
  for insert
  with check (bucket_id = 'blog-covers' and auth.role() = 'authenticated');

create policy "public can read blog covers" on storage.objects
  for select
  using (bucket_id = 'blog-covers');
