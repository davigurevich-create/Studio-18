-- Studio 18 — opcional de motor detalhado, com estoque próprio, pros 9
-- modelos que possuem essa opção. Rode no SQL Editor do Supabase.

-- 1. Liga cada carro ao "produto" do motor correspondente (quando existir).
alter table products add column if not exists motor_product_id uuid references products(id);

-- 2. Cria o produto do motor de cada modelo — reaproveita toda a
-- infraestrutura de estoque/vendas que já existe pros carros (entrada/saída
-- em Estoque, linha própria em sale_items). Fica com active = false pra não
-- aparecer como um item comprável separado na Coleção do site — só existe
-- como opcional vinculado ao carro.
insert into products (sku, name, category, manufacturer, sale_price_brl, image_url, active)
select p.sku || '-MOTOR', 'Motor detalhado — ' || p.name, 'motor', p.manufacturer, m.motor_price, p.image_url, false
from (values
  ('S18-001', 387.64),
  ('S18-003', 246.12),
  ('S18-011', 301.50),
  ('S18-012', 470.70),
  ('S18-013', 461.48),
  ('S18-014', 221.51),
  ('S18-015', 467.63),
  ('S18-016', 323.03),
  ('S18-017', 206.13)
) as m(sku, motor_price)
join products p on p.sku = m.sku
on conflict (sku) do nothing;

-- 3. Vincula cada carro ao motor que acabou de ser criado.
update products p
set motor_product_id = mp.id
from products mp
where mp.sku = p.sku || '-MOTOR'
  and p.sku in ('S18-001', 'S18-003', 'S18-011', 'S18-012', 'S18-013', 'S18-014', 'S18-015', 'S18-016', 'S18-017');

-- 4. Expõe o motor (nome, preço, estoque disponível) na view pública do
-- site — coluna nova sempre no final, mesma regra de sempre pro
-- "create or replace view" só permitir adicionar no fim da lista.
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
  p.weight_kg,
  p.motor_product_id,
  mp.name as motor_name,
  mp.sale_price_brl as motor_price_brl,
  greatest(coalesce(ms.quantity_in_stock, 0), 0) as motor_quantity_available
from products p
left join product_stock s on s.product_id = p.id
left join products mp on mp.id = p.motor_product_id
left join product_stock ms on ms.product_id = mp.id
where p.active = true;

grant select on public_catalog to anon, authenticated;
