-- Studio 18 — expõe o fabricante na view product_stock, usada pela aba
-- Estoque do painel de gestão.
-- Rode no SQL Editor do Supabase.
--
-- Precisa de DROP + CREATE (em vez de CREATE OR REPLACE) porque o Postgres
-- não permite inserir uma coluna no meio da lista de colunas de uma view
-- já existente — só no final.

drop view if exists product_stock;

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
