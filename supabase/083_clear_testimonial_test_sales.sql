-- Studio 18 — limpeza dos pedidos de teste criados durante os testes do
-- e-mail de pedido de depoimento (migrations 081 e 082). Identifica pelos
-- marcadores únicos desses pedidos de teste: cliente "Davi Gurevich",
-- contato davi@studio18bricks.com.br, frete e desconto zerados (nenhuma
-- venda real tem essa combinação).

-- Bloco 1 — confere o que vai ser apagado antes de rodar o delete.
select id, sale_date, customer_name, customer_contact, status, delivered_at, testimonial_requested_at
from sales
where customer_name = 'Davi Gurevich'
  and customer_contact = 'davi@studio18bricks.com.br'
  and shipping_cost_brl = 0
  and discount_brl = 0;

-- Bloco 2 — apaga todos esses pedidos de teste (sale_items vai junto, é cascade).
delete from sales
where customer_name = 'Davi Gurevich'
  and customer_contact = 'davi@studio18bricks.com.br'
  and shipping_cost_brl = 0
  and discount_brl = 0;
