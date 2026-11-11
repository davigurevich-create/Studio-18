-- ---------------------------------------------------------------------------
-- Corrige get_my_points(): sets_points usava s.status = 'pago', mas a 112
-- já tinha ampliado o critério de "pagamento confirmado" pra
-- ('pago', 'enviado', 'entregue') em customer_total_points (pedido
-- enviado/entregue já teve o pagamento confirmado antes). Com o filtro
-- antigo, quem tinha pedido em "Enviado"/"Entregue" (sem nenhum 'pago'
-- literal) ficava com sets_points = 0 mesmo o total_points batendo certo.
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
          join sales motor_s on motor_s.id = motor_si.sale_id and motor_s.status in ('pago', 'enviado', 'entregue')
          join products motor_p on motor_p.id = motor_si.product_id
          where motor_p.category = 'motor' and motor_s.customer_contact = auth.jwt() ->> 'email'
        ), 0) as pts
    from sale_items si
    join sales s on s.id = si.sale_id and s.status in ('pago', 'enviado', 'entregue')
    join products p on p.id = si.product_id
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
