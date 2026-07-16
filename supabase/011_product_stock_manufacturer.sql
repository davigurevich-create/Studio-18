-- Studio 18 — expõe o fabricante na view product_stock, usada pela aba
-- Estoque do painel de gestão.
-- Rode no SQL Editor do Supabase.
--
-- Precisa de DROP + CREATE (em vez de CREATE OR REPLACE) porque o Postgres
-- não permite inserir uma coluna no meio da lista de colunas de uma view
-- já existente — só no final.
--
-- E precisa de CASCADE porque a view public_catalog (usada pelo site)
-- depende de product_stock — o cascade derruba as duas juntas, e este
-- script recria as duas na sequência certa logo em seguida.

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
  coalesce(sum(case when m.type = 'entrada' then m.quantity
                     when m.type = 'ajuste' then m.quantity
                     else 0 end), 0)
  - coalesce(sum(case when m.type = 'saida' then m.quantity else 0 end), 0)
    as quantity_in_stock
from products p
left join inventory_movements m on m.product_id = p.id
group by p.id, p.sku, p.name, p.category, p.manufacturer, p.min_stock_alert, p.cost_price_brl, p.sale_price_brl;

-- Recriando public_catalog exatamente como estava (o cascade acima a apagou
-- junto, por depender de product_stock).
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
