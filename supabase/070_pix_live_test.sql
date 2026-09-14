-- Studio 18 — reativa a Zero Pulse (S18-019) por R$1 só pra testar o PIX de
-- verdade em produção (webhook corrigido + "Verify JWT" desligado). Produto
-- de teste, invisível pra clientes reais — não corre o risco de alguém
-- comprar um produto de catálogo de verdade por R$1 durante o teste.
-- Rode no SQL Editor do Supabase.

-- ===========================================================================
-- BLOCO 1 — rodar agora, antes do teste
-- ===========================================================================
update products
set active = true,
    sale_price_brl = 1.00
where sku = 'S18-019';

insert into inventory_movements (product_id, type, quantity, notes)
select id, 'entrada', 1, 'Estoque temporário — teste real do PIX (webhook + Verify JWT corrigidos)'
from products
where sku = 'S18-019';

-- ===========================================================================
-- BLOCO 2 — rodar depois, assim que confirmar que o PIX funcionou sozinho
-- (desativa de novo, zera preço e estoque, e apaga a venda de teste)
-- ===========================================================================
-- update products
-- set active = false,
--     sale_price_brl = 0
-- where sku = 'S18-019';
--
-- insert into inventory_movements (product_id, type, quantity, notes)
-- select ps.product_id, 'saida', ps.quantity_in_stock, 'Reversão do estoque temporário — teste do PIX concluído'
-- from product_stock ps
-- join products p on p.id = ps.product_id
-- where p.sku = 'S18-019' and ps.quantity_in_stock > 0;
--
-- delete from sales
-- where id in (
--   select s.id from sales s
--   join sale_items si on si.sale_id = s.id
--   join products p on p.id = si.product_id
--   where p.sku = 'S18-019'
-- );
