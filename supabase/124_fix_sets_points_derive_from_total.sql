-- ---------------------------------------------------------------------------
-- Troca o jeito de calcular sets_points em get_my_points(). As duas
-- tentativas anteriores (118, 119) recalculavam a soma de peças/motor do
-- zero, replicando a lógica de customer_total_points — e erraram de duas
-- formas diferentes pra clientes distintos (118: filtro de categoria;
-- 119: filtro de status; e o print do Rubens pai mostrou que ainda dava
-- errado de um jeito não diagnosticado depois da 119). Em vez de arriscar
-- um terceiro jeito de recalcular errado, sets_points agora é só
-- "total_points - testimonial_points" — usa o total_points que já é a
-- fonte confiável (mesmo valor do ranking e do clube), então as duas
-- partes SEMPRE somam certo, não importa o que mude em sales/sale_items.
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
  my_ledger as (
    select coalesce(sum(points), 0) as pts
    from customer_points_ledger
    where customer_email = auth.jwt() ->> 'email'
  ),
  my_total as (
    select coalesce((select total_points from ranked where customer_email = auth.jwt() ->> 'email'), 0)::bigint as pts
  )
  select
    (select pts from my_total)::bigint,
    (select rank_position from ranked where customer_email = auth.jwt() ->> 'email'),
    (select count(*) from customer_total_points)::bigint,
    greatest((select pts from my_total) - (select pts from my_ledger), 0)::bigint,
    (select pts from my_ledger)::bigint;
$$;

grant execute on function get_my_points() to authenticated;
