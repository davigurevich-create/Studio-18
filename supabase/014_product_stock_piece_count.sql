-- Studio 18 — expõe a quantidade de peças (piece_count) na view
-- product_stock, para poder editá-la na tabela da aba Estoque.
-- Rode no SQL Editor do Supabase.
--
-- CREATE OR REPLACE funciona aqui sem precisar de DROP porque piece_count
-- vai depois de quantity_in_stock, que já é a última coluna da view — não
-- muda a posição de nenhuma coluna existente.

create or replace view product_stock as
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
    as quantity_in_stock,
  p.piece_count
from products p
left join inventory_movements m on m.product_id = p.id
group by p.id, p.sku, p.name, p.category, p.manufacturer, p.min_stock_alert, p.cost_price_brl, p.sale_price_brl,
  p.length_cm, p.height_cm, p.width_cm, p.piece_count;
