-- Studio 18 — emissão forçada (extraordinária) de selos: concessões manuais
-- de selo de set, sem passar por uma venda. Primeiro uso: Rubens Gurevich
-- (fundador do Studio 18), que montou 11 sets sem tê-los comprado pelo site.
-- Rode no SQL Editor do Supabase, depois de já ter rodado 111–116.
--
-- DESIGN: continua valendo a regra de 111 — nada é "creditado" à mão. A
-- concessão registra só (e-mail, produto); os pontos saem sempre de
-- products.piece_count, igual numa compra (1 peça = 1 ponto). Não cria
-- venda falsa, então não mexe em faturamento, estoque nem relatórios.
-- A imagem do selo é a mesma de sempre: /selos/<SKU>.png.
--
-- Obs.: a concessão não inclui o bônus de +500 de motor funcional (ele só
-- vale pra quem comprou o motor). Se o Rubens também tiver montado algum
-- set COM motor, dá pra somar +500 por set via customer_points_ledger.

-- ---------------------------------------------------------------------------
-- 1. Tabela de concessões (1 selo por cliente × set, nunca duplica)
-- ---------------------------------------------------------------------------
create table if not exists customer_badge_grants (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  product_id uuid not null references products(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (customer_email, product_id)
);

alter table customer_badge_grants enable row level security;

drop policy if exists "staff can view badge grants" on customer_badge_grants;
create policy "staff can view badge grants" on customer_badge_grants
  for select using (is_staff());
-- Sem policy de insert/update/delete: só o SQL Editor (service role) escreve.

-- ---------------------------------------------------------------------------
-- 2. Pontos totais: compras + concessões + ledger
-- ---------------------------------------------------------------------------
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
grant_points as (
  select g.customer_email, sum(coalesce(p.piece_count, 0)) as pts
  from customer_badge_grants g
  join products p on p.id = g.product_id
  group by g.customer_email
),
ledger_points as (
  select customer_email, sum(points) as pts
  from customer_points_ledger
  group by customer_email
),
emails as (
  select customer_email from purchase_points
  union select customer_email from motor_points
  union select customer_email from grant_points
  union select customer_email from ledger_points
)
select
  e.customer_email,
  (coalesce(pp.pts, 0) + coalesce(mp.pts, 0) + coalesce(gp.pts, 0) + coalesce(lp.pts, 0))::bigint as total_points
from emails e
left join purchase_points pp on pp.customer_email = e.customer_email
left join motor_points mp on mp.customer_email = e.customer_email
left join grant_points gp on gp.customer_email = e.customer_email
left join ledger_points lp on lp.customer_email = e.customer_email;

-- ---------------------------------------------------------------------------
-- 3. Selos do cliente logado: compras + concessões (1 por SKU)
-- ---------------------------------------------------------------------------
create or replace function get_my_badges()
returns table (sku text, name text, points bigint, product_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  with earned as (
    select p.id as pid, p.sku, p.name,
      sum(si.quantity * coalesce(p.piece_count, 0) + coalesce(motor_si.quantity, 0) * 500)::bigint as pts
    from sale_items si
    join sales s on s.id = si.sale_id and s.status in ('pago', 'enviado', 'entregue')
    join products p on p.id = si.product_id and p.category <> 'motor'
    left join sale_items motor_si
      on motor_si.sale_id = si.sale_id and motor_si.product_id = p.motor_product_id
    where s.customer_contact = auth.jwt() ->> 'email'
    group by p.id, p.sku, p.name
    union all
    select p.id, p.sku, p.name, coalesce(p.piece_count, 0)::bigint
    from customer_badge_grants g
    join products p on p.id = g.product_id
    where g.customer_email = auth.jwt() ->> 'email'
  )
  select e.sku, e.name, sum(e.pts)::bigint as points, e.pid as product_id
  from earned e
  group by e.pid, e.sku, e.name
  order by points desc;
$$;

grant execute on function get_my_badges() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Mesmo critério no perfil público
-- ---------------------------------------------------------------------------
create or replace function get_public_profile_badges(p_user_id uuid)
returns table (sku text, name text, points bigint)
language sql
stable
security definer
set search_path = public
as $$
  with target as (
    select email from auth.users u
    where u.id = p_user_id
      and exists (select 1 from customer_profiles cp where cp.user_id = p_user_id and cp.public_profile)
  ),
  earned as (
    select p.id as pid, p.sku, p.name,
      sum(si.quantity * coalesce(p.piece_count, 0) + coalesce(motor_si.quantity, 0) * 500)::bigint as pts
    from sale_items si
    join sales s on s.id = si.sale_id and s.status in ('pago', 'enviado', 'entregue')
    join products p on p.id = si.product_id and p.category <> 'motor'
    left join sale_items motor_si
      on motor_si.sale_id = si.sale_id and motor_si.product_id = p.motor_product_id
    where s.customer_contact = (select email from target)
    group by p.id, p.sku, p.name
    union all
    select p.id, p.sku, p.name, coalesce(p.piece_count, 0)::bigint
    from customer_badge_grants g
    join products p on p.id = g.product_id
    where g.customer_email = (select email from target)
  )
  select e.sku, e.name, sum(e.pts)::bigint as points
  from earned e
  group by e.pid, e.sku, e.name
  order by points desc;
$$;

grant execute on function get_public_profile_badges(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Estatísticas públicas contam as concessões também
-- ---------------------------------------------------------------------------
create or replace function get_badges_public_stats()
returns table (total_pieces bigint, total_badges bigint, total_collectors bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (
      coalesce((
        select sum(si.quantity * coalesce(p.piece_count, 0))
        from sale_items si
        join sales s on s.id = si.sale_id and s.status in ('pago', 'enviado', 'entregue')
        join products p on p.id = si.product_id
      ), 0)
      + coalesce((
        select sum(coalesce(p.piece_count, 0))
        from customer_badge_grants g join products p on p.id = g.product_id
      ), 0)
    )::bigint as total_pieces,
    (
      select count(*) from (
        select s.customer_contact as email, si.product_id
        from sale_items si
        join sales s on s.id = si.sale_id and s.status in ('pago', 'enviado', 'entregue')
        join products p on p.id = si.product_id
        where p.category <> 'motor' and s.customer_contact is not null
        union
        select g.customer_email, g.product_id from customer_badge_grants g
      ) b
    )::bigint as total_badges,
    (
      select count(*) from (
        select s.customer_contact as email from sales s
        where s.status in ('pago', 'enviado', 'entregue') and s.customer_contact is not null
        union
        select customer_email from customer_badge_grants
      ) c
    )::bigint as total_collectors;
$$;

grant execute on function get_badges_public_stats() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. EMISSÃO FORÇADA — Rubens Gurevich (fundador), 11 sets montados
--   S18-001 Lamborghini Countach      S18-009 Maserati Gran Turismo
--   S18-002 BMW R1300GS               S18-010 Fórmula 1
--   S18-003 Porsche 963               S18-012 Lamborghini Temerario
--   S18-004 BMW M4 GT4                S18-014 Ferrari Enzo
--   S18-008 Lamborghini Centenario    S18-017 Lamborghini Aventador SVJ
--   S18-022 AMG GT3
-- Idempotente: pode rodar de novo sem duplicar.
-- ---------------------------------------------------------------------------
insert into customer_badge_grants (customer_email, product_id, reason)
select 'rubens@peexbrasl.com.br', p.id,
  'Emissão extraordinária — fundador do Studio 18, set montado sem compra pelo site'
from products p
where p.sku in (
  'S18-001', 'S18-002', 'S18-003', 'S18-004', 'S18-008', 'S18-009',
  'S18-010', 'S18-012', 'S18-014', 'S18-017', 'S18-022'
)
on conflict (customer_email, product_id) do nothing;

-- Conferência — deve listar 11 linhas e o total de pontos:
select p.sku, p.name, p.piece_count
from customer_badge_grants g join products p on p.id = g.product_id
where g.customer_email = 'rubens@peexbrasl.com.br'
order by p.sku;

select * from customer_total_points where customer_email = 'rubens@peexbrasl.com.br';
