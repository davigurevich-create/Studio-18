-- ---------------------------------------------------------------------------
-- Corrige "column reference total_points is ambiguous" em get_public_profile.
-- A função é plpgsql com returns table(..., total_points bigint, ...), então
-- o nome da coluna de saída conflita com a coluna total_points de
-- customer_total_points na subquery — precisa qualificar com alias.
-- ---------------------------------------------------------------------------
create or replace function get_public_profile(p_user_id uuid)
returns table (
  display_name text,
  total_points bigint,
  is_public boolean
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
    return query select null::text, 0::bigint, false;
    return;
  end if;

  return query
    select
      get_display_name(v_email),
      coalesce((select ctp.total_points from customer_total_points ctp where ctp.customer_email = v_email), 0)::bigint,
      true;
end;
$$;

grant execute on function get_public_profile(uuid) to authenticated;
