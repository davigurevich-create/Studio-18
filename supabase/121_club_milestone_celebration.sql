-- ---------------------------------------------------------------------------
-- Celebração de entrada em clube: e-mail automático de parabéns + confete no
-- primeiro login depois de atingir a pontuação de algum clube. Como
-- total_points é sempre calculado ao vivo (nunca "credita" nada), não existe
-- um evento de banco pra disparar isso sozinho — por isso o controle de "já
-- celebrou esse nível?" fica numa coluna em customer_profiles, e o
-- front-end chama check_new_club_milestone() a cada carregamento da conta/
-- checkout (mesmo padrão do ensure_club_benefit, 120). A função é
-- idempotente e à prova de disparo duplicado: o UPDATE só "pega" (e só
-- retorna is_new = true) na primeira chamada depois de cruzar o nível —
-- chamadas seguintes (ou simultâneas) encontram a coluna já atualizada e
-- não disparam de novo.
-- ---------------------------------------------------------------------------
alter table customer_profiles add column if not exists highest_club_level_notified integer not null default 0;

create or replace function check_new_club_milestone()
returns table (is_new boolean, club_name text, discount_pct numeric, customer_email text, display_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_points bigint;
  v_threshold integer;
  v_club text;
  v_pct numeric;
  v_flipped boolean;
begin
  v_email := auth.jwt() ->> 'email';
  select total_points into v_points from customer_total_points where customer_email = v_email;
  v_points := coalesce(v_points, 0);

  v_threshold := case
    when v_points >= 100000 then 100000
    when v_points >= 75000 then 75000
    when v_points >= 50000 then 50000
    when v_points >= 25000 then 25000
    when v_points >= 10000 then 10000
    else 0
  end;
  v_club := case v_threshold
    when 100000 then 'Clube 100K' when 75000 then 'Clube 75K' when 50000 then 'Clube 50K'
    when 25000 then 'Clube 25K' when 10000 then 'Clube 10K' else null
  end;
  v_pct := case v_threshold
    when 100000 then 50 when 75000 then 35 when 50000 then 20 when 25000 then 10 when 10000 then 5 else null
  end;

  if v_threshold = 0 then
    return query select false, null::text, null::numeric, null::text, null::text;
    return;
  end if;

  insert into customer_profiles (user_id, highest_club_level_notified)
  values (auth.uid(), v_threshold)
  on conflict (user_id) do update
    set highest_club_level_notified = excluded.highest_club_level_notified
  where customer_profiles.highest_club_level_notified < excluded.highest_club_level_notified
  returning true into v_flipped;

  if v_flipped then
    return query select true, v_club, v_pct, v_email, get_display_name(v_email);
  else
    return query select false, null::text, null::numeric, null::text, null::text;
  end if;
end;
$$;

grant execute on function check_new_club_milestone() to authenticated;
