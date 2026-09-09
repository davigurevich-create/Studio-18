-- Studio 18 — ativa temporariamente a Zero Pulse (S18-019) por R$1,00 com
-- 1 unidade em estoque, só pra testar uma compra real com cartão em
-- produção. Rode o BLOCO 1 agora, faça a compra de teste no site, e depois
-- rode o BLOCO 2 pra voltar tudo como estava (preço R$0, sem estoque —
-- exatamente o estado original de "placeholder", ver 061_new_sku_placeholders.sql).

-- ===========================================================================
-- BLOCO 1 — rodar agora, antes do teste
-- ===========================================================================
update products
set sale_price_brl = 1.00
where sku = 'S18-019';

insert into inventory_movements (product_id, type, quantity, notes)
select id, 'entrada', 1, 'Estoque temporário — teste de cartão real em produção'
from products
where sku = 'S18-019';

-- ===========================================================================
-- BLOCO 2 — rodar depois, assim que terminar o teste de compra
-- ===========================================================================
-- update products
-- set sale_price_brl = 0
-- where sku = 'S18-019';
--
-- insert into inventory_movements (product_id, type, quantity, notes)
-- select id, 'saida', 1, 'Reversão do estoque temporário de teste'
-- from products
-- where sku = 'S18-019';
