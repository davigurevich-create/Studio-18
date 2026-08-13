-- Studio 18 — vídeo de produto hospedado no Supabase Storage (em vez de
-- comitar arquivos grandes no repositório do site). Rode no SQL Editor do
-- Supabase, depois de já ter rodado 025_customer_accounts.sql (usa is_staff()).

-- 1. Coluna para guardar a URL pública do vídeo de cada produto (opcional).
alter table products add column if not exists video_url text;

-- 2. Expõe a nova coluna na view pública que o site consome. O Postgres só
-- deixa "create or replace view" ADICIONAR coluna no final da lista (senão
-- ele acha que você está tentando renomear uma coluna existente) — por isso
-- video_url vai depois de width_cm, não junto das outras colunas de imagem.
create or replace view public_catalog as
select
  p.id,
  p.sku,
  p.name,
  p.category,
  p.brand_model,
  p.manufacturer,
  p.collection_tag,
  p.scale,
  p.piece_count,
  p.sale_price_brl,
  p.image_url,
  p.image_urls,
  p.automotive_history,
  p.dimensions,
  p.spec_highlights,
  greatest(coalesce(s.quantity_in_stock, 0), 0) as quantity_available,
  p.length_cm,
  p.height_cm,
  p.width_cm,
  p.video_url
from products p
left join product_stock s on s.product_id = p.id
where p.active = true;

grant select on public_catalog to anon, authenticated;

-- 3. Bucket público para os vídeos — leitura pública (o site precisa
-- reproduzir o vídeo direto via URL), upload restrito à equipe.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-videos',
  'product-videos',
  true,
  524288000, -- 500MB por arquivo — se o upload falhar por limite, confira
             -- também o limite global em Project Settings → Storage.
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "staff can upload product videos" on storage.objects
  for insert
  with check (bucket_id = 'product-videos' and is_staff());

create policy "staff can delete product videos" on storage.objects
  for delete
  using (bucket_id = 'product-videos' and is_staff());

create policy "public can read product videos" on storage.objects
  for select
  using (bucket_id = 'product-videos');

-- ---------------------------------------------------------------------------
-- PASSO MANUAL — depois de subir o vídeo pelo painel do Supabase (Storage →
-- product-videos → upload), copie a URL pública gerada e rode (trocando o
-- SKU e a URL):
-- ---------------------------------------------------------------------------
-- update products set video_url = 'https://.../product-videos/S18-016/terraforce-v8.mp4'
-- where sku = 'S18-016';
