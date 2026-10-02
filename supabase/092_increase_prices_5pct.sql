-- Studio 18 — reajuste de 5% no preço de venda de todos os produtos
-- (sale_price_brl). Não mexe no preço do motor funcional opcional
-- (motor_price_brl), nem em custo (cost_price_brl).
-- Rode no SQL Editor do Supabase.

-- Bloco 1 — confere os valores antes/depois antes de aplicar.
select sku, name, sale_price_brl as preco_atual, round(sale_price_brl * 1.05, 2) as preco_novo
from products
order by name;

-- Bloco 2 — aplica o reajuste.
update products
set sale_price_brl = round(sale_price_brl * 1.05, 2);
