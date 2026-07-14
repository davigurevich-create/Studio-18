-- Studio 18 — campos para o site (vitrine 3D) + checkout público
-- Rode isso no SQL Editor do seu projeto Supabase DEPOIS do schema.sql original.

-- ---------------------------------------------------------------------------
-- Novos campos de produto para a pagina de detalhe do site
-- ---------------------------------------------------------------------------
alter table products add column if not exists manufacturer text;
alter table products add column if not exists collection_tag text;
alter table products add column if not exists automotive_history text;
alter table products add column if not exists dimensions text;
alter table products add column if not exists image_urls text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- Atualiza a view publica do catalogo com os novos campos
-- ---------------------------------------------------------------------------
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
  greatest(coalesce(s.quantity_in_stock, 0), 0) as quantity_available
from products p
left join product_stock s on s.product_id = p.id
where p.active = true;

grant select on public_catalog to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Permite que o site publico crie pedidos (vendas pendentes) sem login.
-- O checkout do site so consegue INSERIR uma venda com status "pendente" e
-- canal "site" — nao consegue ler, alterar nem cancelar vendas existentes
-- (isso continua exigindo login no painel de gestao).
-- ---------------------------------------------------------------------------
create policy "public can create pending site orders" on sales
  for insert
  with check (channel = 'site' and status = 'pendente');

create policy "public can add items to a site order" on sale_items
  for insert
  with check (
    exists (
      select 1 from sales s
      where s.id = sale_id and s.channel = 'site' and s.status = 'pendente'
    )
  );
