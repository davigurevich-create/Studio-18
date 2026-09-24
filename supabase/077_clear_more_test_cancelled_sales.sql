-- Studio 18 — pega o resto das vendas canceladas de teste que sobraram da
-- 076 (aconteceram mais tarde no mesmo dia 14/09, depois da compra real do
-- Bruno Levi, então a data-limite anterior não cobria). Rode no SQL Editor.
--
-- O filtro por status = 'cancelado' já garante que a venda do Bruno (status
-- 'entregue') nunca é tocada, mesmo estendendo a data até o dia seguinte.

-- Bloco 1 — conferir antes de apagar
select id, sale_date, customer_name, customer_contact, status, shipping_cost_brl
from sales
where status = 'cancelado'
  and sale_date < '2026-09-15'
order by sale_date;

-- Bloco 2 — depois de conferir a lista acima, rode este delete
delete from sales
where status = 'cancelado'
  and sale_date < '2026-09-15';
