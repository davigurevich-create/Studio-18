-- Studio 18 — apaga todos os registros de vendas (tentativas de compra) de
-- teste feitas até 11/09/2026, pra deixar o painel de Vendas limpo pro
-- lançamento oficial.
-- Rode no SQL Editor do Supabase.
--
-- Cobre TODOS os status (pendente, pago, enviado, entregue, cancelado) —
-- ou seja, qualquer tentativa de compra, não só as que deram certo.
--
-- O que é apagado automaticamente junto (por causa das foreign keys):
--   - sale_items dessas vendas (on delete cascade)
-- O que é preservado, só desvinculado (não é apagado, vira NULL):
--   - inventory_movements.sale_id (on delete set null) — não tem efeito
--     prático aqui, porque o checkout do site nunca cria movimentação de
--     estoque sozinho (isso é sempre manual, feito por você no painel de
--     Estoque), então nenhuma venda de teste deveria ter mexido no estoque.
--   - part_requests.order_id (on delete set null) — só no caso raro de
--     alguma solicitação de peça de teste ter sido vinculada a um desses
--     pedidos.
--
-- BLOCO 1 — rode primeiro só pra conferir quantos registros serão
-- apagados, antes de rodar o DELETE de verdade.
select count(*) as vendas_a_apagar
from sales
where sale_date < '2026-09-12 00:00:00-03:00'::timestamptz;

-- BLOCO 2 — apaga de fato. Rode só depois de conferir o número acima.
begin;

delete from sales
where sale_date < '2026-09-12 00:00:00-03:00'::timestamptz;

commit;
