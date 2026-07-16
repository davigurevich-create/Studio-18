-- Studio 18 — dimensões (comprimento, altura, largura, em cm) editáveis por
-- SKU na aba Estoque do painel de gestão.
-- Rode no SQL Editor do Supabase.

alter table products
  add column if not exists length_cm numeric,
  add column if not exists height_cm numeric,
  add column if not exists width_cm numeric;

-- product_stock precisa ser recriada para expor as novas colunas (mesmo
-- motivo da migração anterior: CASCADE porque public_catalog depende dela).
drop view if exists product_stock cascade;

create view product_stock as
select
  p.id as product_id,
  p.sku,
  p.name,
  p.category,
  p.manufacturer,
  p.min_stock_alert,
  p.cost_price_brl,
  p.sale_price_brl,
  p.length_cm,
  p.height_cm,
  p.width_cm,
  coalesce(sum(case when m.type = 'entrada' then m.quantity
                     when m.type = 'ajuste' then m.quantity
                     else 0 end), 0)
  - coalesce(sum(case when m.type = 'saida' then m.quantity else 0 end), 0)
    as quantity_in_stock
from products p
left join inventory_movements m on m.product_id = p.id
group by p.id, p.sku, p.name, p.category, p.manufacturer, p.min_stock_alert, p.cost_price_brl, p.sale_price_brl,
  p.length_cm, p.height_cm, p.width_cm;

create view public_catalog as
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
  greatest(coalesce(s.quantity_in_stock, 0), 0) as quantity_available
from products p
left join product_stock s on s.product_id = p.id
where p.active = true;

grant select on public_catalog to anon, authenticated;
