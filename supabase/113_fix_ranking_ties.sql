-- Studio 18 — corrige posições duplicadas no ranking (ex: dois 6º lugares,
-- pulando o 7º): rank() empata pontuações iguais e pula a posição
-- seguinte, que é o comportamento certo pra uma "colocação" tipo prova,
-- mas errado pra um ranking de 1 posição por pessoa. Troca por
-- row_number() com desempate determinístico (e-mail) pra cada cliente
-- ocupar sempre uma posição única e sequencial. Rode no SQL Editor do
-- Supabase, depois de já ter rodado 111 e 112.

create or replace function get_my_points()
returns table (total_points bigint, rank_position bigint, total_collectors bigint)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select customer_email, total_points,
      row_number() over (order by total_points desc, customer_email) as rank_position
    from customer_total_points
  )
  select
    coalesce((select total_points from ranked where customer_email = auth.jwt() ->> 'email'), 0)::bigint,
    (select rank_position from ranked where customer_email = auth.jwt() ->> 'email'),
    (select count(*) from customer_total_points)::bigint;
$$;

create or replace function get_leaderboard(p_limit integer default 10)
returns table (rank_position bigint, display_name text, total_points bigint, is_you boolean)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select customer_email, total_points,
      row_number() over (order by total_points desc, customer_email) as rank_position
    from customer_total_points
  ),
  top as (
    select r.rank_position, get_display_name(r.customer_email) as display_name, r.total_points,
      (r.customer_email = auth.jwt() ->> 'email') as is_you
    from ranked r
    order by r.rank_position
    limit p_limit
  ),
  me as (
    select r.rank_position, get_display_name(r.customer_email) as display_name, r.total_points, true as is_you
    from ranked r
    where r.customer_email = auth.jwt() ->> 'email' and r.rank_position > p_limit
  )
  select * from top
  union all
  select * from me
  order by rank_position;
$$;
