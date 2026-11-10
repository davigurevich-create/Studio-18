-- ---------------------------------------------------------------------------
-- Detalha a origem dos pontos do cliente logado (sets vs. depoimento) pra
-- ficar claro no card "Pontuação acumulada" da conta. Postgres não deixa
-- CREATE OR REPLACE mudar as colunas de retorno de uma função existente —
-- precisa apagar antes (mesma situação de 114/116).
-- ---------------------------------------------------------------------------
drop function if exists get_my_points();

create function get_my_points()
returns table (
  total_points bigint,
  rank_position bigint,
  total_collectors bigint,
  sets_points bigint,
  testimonial_points bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select customer_email, total_points,
      rank() over (order by total_points desc) as rank_position
    from customer_total_points
  ),
  my_sets as (
    select
      coalesce(sum(si.quantity * coalesce(p.piece_count, 0)), 0)
      + coalesce((
          select sum(motor_si.quantity * 500)
          from sale_items motor_si
          join sales motor_s on motor_s.id = motor_si.sale_id and motor_s.status = 'pago'
          join products motor_p on motor_p.id = motor_si.product_id
          where motor_p.category = 'motor' and motor_s.customer_contact = auth.jwt() ->> 'email'
        ), 0) as pts
    from sale_items si
    join sales s on s.id = si.sale_id and s.status = 'pago'
    join products p on p.id = si.product_id and p.category <> 'motor'
    where s.customer_contact = auth.jwt() ->> 'email'
  ),
  my_ledger as (
    select coalesce(sum(points), 0) as pts
    from customer_points_ledger
    where customer_email = auth.jwt() ->> 'email'
  )
  select
    coalesce((select total_points from ranked where customer_email = auth.jwt() ->> 'email'), 0)::bigint,
    (select rank_position from ranked where customer_email = auth.jwt() ->> 'email'),
    (select count(*) from customer_total_points)::bigint,
    (select pts from my_sets)::bigint,
    (select pts from my_ledger)::bigint;
$$;

grant execute on function get_my_points() to authenticated;
