-- ---------------------------------------------------------------------------
-- Clube: ativação automática (sem clique) + benefício cumulável com outro
-- cupom. Antes: o cliente precisava clicar em "Ativar benefício" na conta, e
-- o cupom gerado ocupava o único slot de cupom do checkout, impedindo usar
-- qualquer outro cupom na mesma compra. Agora: o cupom do clube vive numa
-- coluna própria (club_coupon_code), separada do cupom "normal"
-- (coupon_code), e o front-end ativa/busca ele sozinho a cada carregamento —
-- os dois descontos somam no checkout.
-- ---------------------------------------------------------------------------

-- 1. Coluna própria pro cupom de clube na venda, em paralelo à já existente
-- coupon_code (que continua só pro cupom "normal"/manual).
alter table sales add column if not exists club_coupon_code text;

-- ---------------------------------------------------------------------------
-- 2. Versão silenciosa de activate_club_benefit(): nunca lança exceção (nem
-- por "sem clube ainda" nem por "benefício já usado nesse nível") — só
-- retorna null nesses casos, pra poder ser chamada sozinha, sem interação do
-- usuário, toda vez que a conta/checkout carregam.
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

  -- já usou o benefício deste nível (ou de um nível igual/maior): não cria
  -- outro, só não retorna nada (fica pra quando subir de clube de novo).
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
    update coupons set discount_pct = v_pct where code = v_code;
  end if;

  return query select v_code, v_pct, v_club;
end;
$$;

grant execute on function ensure_club_benefit() to authenticated;
