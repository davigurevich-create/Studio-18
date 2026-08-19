-- Studio 18 — cálculo de frete (Melhor Envio). Rode no SQL Editor do Supabase,
-- depois de já ter rodado 027_product_videos.sql.

-- 1. Peso de cada produto — obrigatório para cotar frete. Estimado a partir
-- da proporção peça/peso de duas caixas pesadas de verdade (Ferrari Enzo:
-- 4301 peças = 5,5kg; Lamborghini LP5000: 3970 peças = 5kg, ~1,27g/peça).
-- Ajuste com update products set weight_kg = X where sku = 'S18-0XX' assim
-- que pesar mais caixas de verdade.
alter table products add column if not exists weight_kg numeric;

update products set weight_kg = 5.00 where sku = 'S18-001';
update products set weight_kg = 3.16 where sku = 'S18-002';
update products set weight_kg = 3.89 where sku = 'S18-003';
update products set weight_kg = 5.78 where sku = 'S18-004';
update products set weight_kg = 5.95 where sku = 'S18-005';
update products set weight_kg = 4.73 where sku = 'S18-006';
update products set weight_kg = 2.28 where sku = 'S18-007';
update products set weight_kg = 4.88 where sku = 'S18-008';
update products set weight_kg = 6.95 where sku = 'S18-009';
update products set weight_kg = 4.40 where sku = 'S18-010';
update products set weight_kg = 4.72 where sku = 'S18-011';
update products set weight_kg = 4.57 where sku = 'S18-012';
update products set weight_kg = 5.00 where sku = 'S18-013';
update products set weight_kg = 5.50 where sku = 'S18-014';
update products set weight_kg = 4.62 where sku = 'S18-015';
update products set weight_kg = 6.11 where sku = 'S18-016';
update products set weight_kg = 4.84 where sku = 'S18-017';

-- 2. Expõe o peso na view pública — vai no final da lista de colunas (o
-- Postgres só deixa "create or replace view" ADICIONAR coluna no final).
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
  p.video_url,
  p.weight_kg
from products p
left join product_stock s on s.product_id = p.id
where p.active = true;

grant select on public_catalog to anon, authenticated;

-- 3. Frete escolhido no checkout, salvo junto do pedido — pra aparecer no
-- rastreio e na área da conta.
alter table sales add column if not exists shipping_service text;
alter table sales add column if not exists shipping_cost_brl numeric;
alter table sales add column if not exists shipping_days text;
