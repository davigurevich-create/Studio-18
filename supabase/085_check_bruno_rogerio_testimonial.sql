-- Studio 18 — só consulta (não altera nada), pra conferir se o pedido do
-- Bruno e do Rogério já tem delivered_at preenchido e se o e-mail de
-- pedido de depoimento já foi disparado pra eles.
select
  id,
  customer_name,
  customer_contact,
  status,
  delivered_at,
  testimonial_requested_at,
  case
    when delivered_at is null then 'delivered_at vazio — e-mail nunca vai disparar até isso ser preenchido'
    when testimonial_requested_at is not null then 'e-mail já foi enviado'
    when delivered_at <= now() - interval '5 days' then 'elegível — deveria já ter recebido, ou vai receber no próximo cron das 10h'
    else 'ainda não completou 5 dias desde a entrega'
  end as diagnostico
from sales
where customer_name ilike '%bruno%' or customer_name ilike '%rogerio%' or customer_name ilike '%rogério%'
order by sale_date desc;
