-- Studio 18 — apaga as vendas canceladas de teste, criadas antes da venda
-- de verdade pro Bruno Levi (14/09). Rode no SQL Editor do Supabase.
--
-- sale_items é apagado sozinho (on delete cascade); inventory_movements
-- ligados a essas vendas ficam (histórico de estoque preservado), só perdem
-- a referência ao sale_id (on delete set null).

-- Bloco 1 — rode primeiro só pra conferir o que vai ser apagado
select id, sale_date, customer_name, customer_contact, status, shipping_cost_brl
from sales
where status = 'cancelado'
  and sale_date < '2026-09-14'
order by sale_date;

-- Bloco 2 — depois de conferir a lista acima, rode este delete
delete from sales
where status = 'cancelado'
  and sale_date < '2026-09-14';
