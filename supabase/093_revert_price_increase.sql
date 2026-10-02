-- Studio 18 — reverte o reajuste de 5% da migration 092 (decisão revista
-- com os sócios). Só mexe em category <> 'motor', mesmo escopo da 092.
--
-- OBS: como 092 arredondou pra 2 casas decimais na hora de aumentar, dividir
-- de volta por 1,05 pode ficar com 1 centavo de diferença do valor original
-- em alguns produtos (erro de arredondamento, não dá pra evitar sem ter
-- guardado o valor exato de antes) — na prática é centavos, sem impacto.
-- Rode no SQL Editor do Supabase.

-- Bloco 1 — confere os valores antes/depois antes de aplicar.
select sku, name, category, sale_price_brl as preco_atual, round(sale_price_brl / 1.05, 2) as preco_revertido
from products
where category <> 'motor'
order by name;

-- Bloco 2 — aplica a reversão.
update products
set sale_price_brl = round(sale_price_brl / 1.05, 2)
where category <> 'motor';
