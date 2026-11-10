-- Studio 18 — corrige o estoque do motor funcional do Land Rover Defender
-- (S18-016-MOTOR), que ficou em -1 depois de uma venda de 2 unidades com
-- motor funcional quando só havia 1 motor em estoque (bug no carrinho/
-- checkout, corrigido no código nesta mesma sessão). O usuário já resolveu
-- a pendência fisicamente — reaproveitou um motor do estoque da Ferrari
-- SF90 (peças compatíveis) e já deu baixa manual no estoque do motor da
-- SF90 pra compensar. Essa migration só corrige o SALDO do motor do Land
-- Rover de volta a 0 (não estava refletindo essa compensação, já que o
-- motor usado veio de outro produto). Rode no SQL Editor do Supabase.

insert into inventory_movements (product_id, type, quantity, notes)
select id, 'ajuste', 1, 'Correção de estoque negativo (-1) — motor reaproveitado do estoque da Ferrari SF90 (peças compatíveis), já baixado separadamente'
from products
where sku = 'S18-016-MOTOR';
