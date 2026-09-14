-- Studio 18 — reverte o teste real do PIX (Bloco 2 de 070_pix_live_test.sql):
-- desativa a Zero Pulse de novo, zera preço/estoque, e apaga as vendas de
-- teste geradas nesse processo (incluindo a de R$0,90 que tinha o bug do
-- desconto contado em dobro).
-- Rode no SQL Editor do Supabase.

update products
set active = false,
    sale_price_brl = 0
where sku = 'S18-019';

insert into inventory_movements (product_id, type, quantity, notes)
select ps.product_id, 'saida', ps.quantity_in_stock, 'Reversão do estoque temporário — teste do PIX concluído'
from product_stock ps
join products p on p.id = ps.product_id
where p.sku = 'S18-019' and ps.quantity_in_stock > 0;

delete from sales
where id in (
  select s.id from sales s
  join sale_items si on si.sale_id = s.id
  join products p on p.id = si.product_id
  where p.sku = 'S18-019'
);
