-- Studio 18 — corrige 117: as 11 concessões do Rubens Gurevich foram criadas
-- com o e-mail errado (rubens@peexbrasl.com.br, sem o "i"), o que fez
-- aparecer um colecionador fantasma "Colecionador" no ranking. O e-mail
-- correto é rubens@peexbrasil.com.br. Rode no SQL Editor do Supabase,
-- depois do 117. Idempotente.

delete from customer_badge_grants
where customer_email = 'rubens@peexbrasl.com.br';

insert into customer_badge_grants (customer_email, product_id, reason)
select 'rubens@peexbrasil.com.br', p.id,
  'Emissão extraordinária — fundador do Studio 18, set montado sem compra pelo site'
from products p
where p.sku in (
  'S18-001', 'S18-002', 'S18-003', 'S18-004', 'S18-008', 'S18-009',
  'S18-010', 'S18-012', 'S18-014', 'S18-017', 'S18-022'
)
on conflict (customer_email, product_id) do nothing;

-- Conferência: 11 selos no e-mail certo, e nenhuma sobra no errado (0 linhas).
select p.sku, p.name, p.piece_count
from customer_badge_grants g join products p on p.id = g.product_id
where g.customer_email = 'rubens@peexbrasil.com.br'
order by p.sku;

select count(*) as sobras_email_errado from customer_badge_grants
where customer_email = 'rubens@peexbrasl.com.br';

select * from customer_total_points
where customer_email in ('rubens@peexbrasil.com.br', 'rubens@peexbrasl.com.br');
