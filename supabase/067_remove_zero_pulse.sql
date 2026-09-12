-- Studio 18 — remove a Zero Pulse (S18-019) do site.
-- Rode no SQL Editor do Supabase.
--
-- Desativa o produto (active = false) em vez de apagar a linha, pra não
-- quebrar nenhuma referência antiga (ex.: se algum pedido de teste já
-- citou esse produto). A view public_catalog só mostra produtos com
-- active = true, então isso já é suficiente pra sumir do site.
-- Também desfaz o preço de teste de R$1 e zera o estoque de teste criado
-- em 066_zero_pulse_test_toggle.sql (BLOCO 2 daquele arquivo, que não
-- tinha sido rodado ainda).

update products
set active = false,
    sale_price_brl = 0
where sku = 'S18-019';

insert into inventory_movements (product_id, type, quantity, notes)
select ps.product_id, 'saida', ps.quantity_in_stock, 'Reversão do estoque temporário de teste — produto removido do site'
from product_stock ps
join products p on p.id = ps.product_id
where p.sku = 'S18-019' and ps.quantity_in_stock > 0;
