-- ---------------------------------------------------------------------------
-- Adiciona a posição no ranking ao perfil público do colecionador.
-- Postgres não deixa CREATE OR REPLACE mudar as colunas de retorno de uma
-- função existente — precisa apagar antes (mesma situação de 114).
-- ---------------------------------------------------------------------------
drop function if exists get_public_profile(uuid);

create function get_public_profile(p_user_id uuid)
returns table (
  display_name text,
  total_points bigint,
  is_public boolean,
  rank_position bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text;
  v_public boolean;
begin
  select email into v_email from auth.users where id = p_user_id;
  select coalesce(cp.public_profile, false) into v_public from customer_profiles cp where cp.user_id = p_user_id;

  if v_email is null or not coalesce(v_public, false) then
    return query select null::text, 0::bigint, false, null::bigint;
    return;
  end if;

  return query
    with ranked as (
      select ctp.customer_email, ctp.total_points,
        row_number() over (order by ctp.total_points desc, ctp.customer_email) as rank_position
      from customer_total_points ctp
    )
    select
      get_display_name(v_email),
      coalesce((select r.total_points from ranked r where r.customer_email = v_email), 0)::bigint,
      true,
      (select r.rank_position from ranked r where r.customer_email = v_email);
end;
$$;

grant execute on function get_public_profile(uuid) to authenticated;
