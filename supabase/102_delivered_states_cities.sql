-- Studio 18 — expande get_delivered_states() pra também trazer as cidades
-- de cada estado (usado no card de hover do mapa de entregas na home).
-- Continua só expondo estado + cidade, nunca nome de cliente ou endereço
-- completo.
-- Rode no SQL Editor do Supabase.

-- Postgres não deixa mudar o formato de retorno (RETURNS TABLE) de uma
-- função com CREATE OR REPLACE — precisa apagar antes de recriar.
drop function if exists get_delivered_states();

create function get_delivered_states()
returns table (federal_unit text, cities text[])
language sql
security definer
stable
set search_path = public
as $$
  select
    upper(shipping_federal_unit) as federal_unit,
    array_agg(distinct shipping_city order by shipping_city) filter (where shipping_city is not null and shipping_city <> '') as cities
  from sales
  where status = 'entregue'
    and shipping_federal_unit is not null
    and shipping_federal_unit <> ''
  group by upper(shipping_federal_unit);
$$;

grant execute on function get_delivered_states() to anon;
