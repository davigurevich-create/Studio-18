-- Studio 18 — desativa o cupom ROGERIOTOYS15 (parceria encerrada por
-- enquanto) e adiciona uma mensagem customizada pra quando alguém tentar
-- usar um cupom que existe mas não está mais ativo/expirou/esgotou — em
-- vez do genérico "cupom inválido", mostra algo específico (ex: "fique de
-- olho, vêm novidades da parceria").
-- Rode no SQL Editor do Supabase.

alter table coupons add column if not exists inactive_message text;

update coupons
set
  active = false,
  inactive_message = 'Esse cupom não está mais ativo — mas fique de olho: vêm novidades da parceria com o Rogério Toys em breve!'
where lower(code) = 'rogeriotoys15';

-- Postgres não deixa mudar o formato de retorno (RETURNS TABLE) de uma
-- função com CREATE OR REPLACE — precisa apagar antes de recriar.
drop function if exists validate_coupon(text);

create function validate_coupon(coupon_code text)
returns table (valid boolean, discount_pct numeric, message text)
language sql
security definer
set search_path = public
as $$
  with c as (
    select *
    from coupons
    where lower(code) = lower(coupon_code)
    limit 1
  ),
  validity as (
    select
      c.*,
      (c.active and (c.expires_at is null or c.expires_at > now()) and (c.max_uses is null or c.uses_count < c.max_uses)) as is_valid
    from c
  )
  select
    coalesce(v.is_valid, false) as valid,
    case when v.is_valid then v.discount_pct else null end as discount_pct,
    case when v.id is not null and not v.is_valid then v.inactive_message else null end as message
  from (select 1 as x) dummy
  left join validity v on true;
$$;

grant execute on function validate_coupon(text) to anon;
