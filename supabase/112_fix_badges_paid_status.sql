-- Studio 18 — corrige 111_badges_points_clubs.sql: pontos/selos/stats só
-- contavam sales.status = 'pago', mas esse status é um ciclo único
-- (pendente -> pago -> enviado -> entregue), não dois campos separados —
-- assim que o pedido avança pra "enviado" ou "entregue" ele deixa de bater
-- com 'pago' e sumia das contas (resto do painel, ex: Vendas.tsx, já trata
-- pago/enviado/entregue como "pagamento confirmado"). Rode no SQL Editor
-- do Supabase, depois de já ter rodado o 111.

create or replace view customer_total_points as
with purchase_points as (
  select s.customer_contact as customer_email, sum(si.quantity * coalesce(p.piece_count, 0)) as pts
  from sale_items si
  join sales s on s.id = si.sale_id and s.status in ('pago', 'enviado', 'entregue')
  join products p on p.id = si.product_id
  where s.customer_contact is not null
  group by s.customer_contact
),
motor_points as (
  select s.customer_contact as customer_email, sum(si.quantity * 500) as pts
  from sale_items si
  join sales s on s.id = si.sale_id and s.status in ('pago', 'enviado', 'entregue')
  join products p on p.id = si.product_id
  where p.category = 'motor' and s.customer_contact is not null
  group by s.customer_contact
),
ledger_points as (
  select customer_email, sum(points) as pts
  from customer_points_ledger
  group by customer_email
)
select
  coalesce(pp.customer_email, mp.customer_email, lp.customer_email) as customer_email,
  (coalesce(pp.pts, 0) + coalesce(mp.pts, 0) + coalesce(lp.pts, 0))::bigint as total_points
from purchase_points pp
full outer join motor_points mp using (customer_email)
full outer join ledger_points lp using (customer_email);

create or replace function get_badges_public_stats()
returns table (total_pieces bigint, total_badges bigint, total_collectors bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((
      select sum(si.quantity * coalesce(p.piece_count, 0))
      from sale_items si
      join sales s on s.id = si.sale_id and s.status in ('pago', 'enviado', 'entregue')
      join products p on p.id = si.product_id
    ), 0)::bigint as total_pieces,
    coalesce((
      select count(distinct (s.customer_contact, si.product_id))
      from sale_items si
      join sales s on s.id = si.sale_id and s.status in ('pago', 'enviado', 'entregue')
      join products p on p.id = si.product_id
      where p.category <> 'motor' and s.customer_contact is not null
    ), 0)::bigint as total_badges,
    coalesce((
      select count(distinct s.customer_contact)
      from sales s
      where s.status in ('pago', 'enviado', 'entregue') and s.customer_contact is not null
    ), 0)::bigint as total_collectors;
$$;

create or replace function get_my_badges()
returns table (sku text, name text, points bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.sku,
    p.name,
    sum(si.quantity * coalesce(p.piece_count, 0) + coalesce(motor_si.quantity, 0) * 500)::bigint as points
  from sale_items si
  join sales s on s.id = si.sale_id and s.status in ('pago', 'enviado', 'entregue')
  join products p on p.id = si.product_id and p.category <> 'motor'
  left join sale_items motor_si
    on motor_si.sale_id = si.sale_id and motor_si.product_id = p.motor_product_id
  where s.customer_contact = auth.jwt() ->> 'email'
  group by p.sku, p.name
  order by points desc;
$$;
