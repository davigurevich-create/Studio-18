-- Studio 18 — reajuste de 5% no preço de venda só dos sets (categoria
-- 'carro'/'moto'). Não mexe em: motores funcionais vendidos separadamente
-- (categoria 'motor' — são linhas próprias na tabela products, com seu
-- próprio sale_price_brl), no preço do motor como opcional de um set
-- (motor_price_brl), nem em custo (cost_price_brl).
-- Rode no SQL Editor do Supabase.

-- Bloco 1 — confere os valores antes/depois antes de aplicar.
select sku, name, category, sale_price_brl as preco_atual, round(sale_price_brl * 1.05, 2) as preco_novo
from products
where category <> 'motor'
order by name;

-- Bloco 2 — aplica o reajuste.
update products
set sale_price_brl = round(sale_price_brl * 1.05, 2)
where category <> 'motor';
