-- Studio 18 — ativa temporariamente a Zero Pulse (S18-019) por R$1,00 com
-- algumas unidades em estoque, pra testar cartão e PIX reais em produção
-- ao longo do dia sem precisar recadastrar toda vez. Rode o BLOCO 1 agora
-- (ou de novo, se quiser adicionar mais unidades depois), faça as compras
-- de teste no site, e no final do dia rode o BLOCO 2 pra voltar tudo como
-- estava (preço R$0, sem estoque — estado original de "placeholder", ver
-- 061_new_sku_placeholders.sql). Comprar não desconta estoque sozinho (isso
-- é sempre manual no painel), então as unidades ficam disponíveis pra
-- quantas compras de teste você quiser fazer hoje.

-- ===========================================================================
-- BLOCO 1 — rodar agora (pode rodar de novo mais tarde pra somar mais)
-- ===========================================================================
update products
set sale_price_brl = 1.00
where sku = 'S18-019';

insert into inventory_movements (product_id, type, quantity, notes)
select id, 'entrada', 5, 'Estoque temporário — testes de cartão/PIX reais em produção'
from products
where sku = 'S18-019';

-- ===========================================================================
-- BLOCO 2 — rodar no final, quando terminar todos os testes do dia
-- (zera o estoque de verdade, seja qual for o total acumulado até lá)
-- ===========================================================================
-- update products
-- set sale_price_brl = 0
-- where sku = 'S18-019';
--
-- insert into inventory_movements (product_id, type, quantity, notes)
-- select ps.product_id, 'saida', ps.quantity_in_stock, 'Reversão do estoque temporário de teste'
-- from product_stock ps
-- join products p on p.id = ps.product_id
-- where p.sku = 'S18-019' and ps.quantity_in_stock > 0;
