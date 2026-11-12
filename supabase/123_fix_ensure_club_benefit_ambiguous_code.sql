-- ---------------------------------------------------------------------------
-- Corrige "column reference code is ambiguous" em ensure_club_benefit().
-- Mesma causa da 115 (total_points) e da 118/119 — a função declara
-- returns table(code text, ...), então "code" vira uma variável implícita
-- dentro do corpo inteiro, e colide com a coluna code de coupons quando
-- referenciada sem alias. Só afeta quem JÁ tinha um cupom de clube
-- pendente (uses_count = 0) de antes — é o update, não o insert, que tinha
-- a referência ambígua, por isso só quebrava pra clientes nesse caso
-- específico (não pra quem está ganhando o primeiro cupom de clube).
-- ---------------------------------------------------------------------------
create or replace function ensure_club_benefit()
returns table (code text, discount_pct numeric, club_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points bigint;
  v_pct numeric;
  v_club text;
  v_code text;
begin
  select total_points into v_points from customer_total_points where customer_email = auth.jwt() ->> 'email';
  v_points := coalesce(v_points, 0);

  v_club := case
    when v_points >= 100000 then 'Clube 100K'
    when v_points >= 75000 then 'Clube 75K'
    when v_points >= 50000 then 'Clube 50K'
    when v_points >= 25000 then 'Clube 25K'
    when v_points >= 10000 then 'Clube 10K'
    else null
  end;
  v_pct := case
    when v_points >= 100000 then 50
    when v_points >= 75000 then 35
    when v_points >= 50000 then 20
    when v_points >= 25000 then 10
    when v_points >= 10000 then 5
    else null
  end;

  if v_club is null then
    return;
  end if;

  if exists (
    select 1 from coupons c
    where c.owner_user_id = auth.uid() and c.kind = 'club_reward'
      and c.uses_count > 0 and c.discount_pct >= v_pct
  ) then
    return;
  end if;

  select c.code into v_code from coupons c
    where c.owner_user_id = auth.uid() and c.kind = 'club_reward' and c.uses_count = 0
    limit 1;

  if v_code is null then
    loop
      v_code := 'CLUBE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      begin
        insert into coupons (code, discount_pct, active, max_uses, kind, owner_user_id)
        values (v_code, v_pct, true, 1, 'club_reward', auth.uid());
        exit;
      exception when unique_violation then
        -- código colidiu com um já existente (raríssimo) — gera outro
      end;
    end loop;
  else
    -- já existia um pendente (ex: subiu de clube antes de usar o anterior)
    -- — atualiza pro desconto do clube atual em vez de deixar desatualizado.
    update coupons c set discount_pct = v_pct where c.code = v_code;
  end if;

  return query select v_code, v_pct, v_club;
end;
$$;

grant execute on function ensure_club_benefit() to authenticated;
