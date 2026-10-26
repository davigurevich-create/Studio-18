-- Studio 18 — cupom com frete grátis embutido (caso de uso: FUNDADORES40,
-- cupom exclusivo dos founders). Rode no SQL Editor do Supabase.

alter table coupons add column if not exists free_shipping boolean not null default false;

-- Marca o FUNDADORES40 como frete grátis. Se o cupom já existir (criado
-- antes, pela aba Cupons do painel), só liga a flag sem mexer no desconto
-- já configurado; se ainda não existir, cria com 40% de desconto.
insert into coupons (code, discount_pct, free_shipping, kind, active)
values ('FUNDADORES40', 40, true, 'staff', true)
on conflict (code) do update set free_shipping = true;

-- validate_coupon precisa do formato de retorno trocado (agora inclui
-- free_shipping) — Postgres não deixa mudar isso com CREATE OR REPLACE,
-- precisa apagar antes de recriar.
drop function if exists validate_coupon(text);

create function validate_coupon(coupon_code text)
returns table (valid boolean, discount_pct numeric, free_shipping boolean)
language sql
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from coupons c
      where lower(c.code) = lower(coupon_code)
        and c.active
        and (c.expires_at is null or c.expires_at > now())
        and (c.max_uses is null or c.uses_count < c.max_uses)
    ) as valid,
    (
      select c.discount_pct from coupons c
      where lower(c.code) = lower(coupon_code)
        and c.active
        and (c.expires_at is null or c.expires_at > now())
        and (c.max_uses is null or c.uses_count < c.max_uses)
    ) as discount_pct,
    coalesce((
      select c.free_shipping from coupons c
      where lower(c.code) = lower(coupon_code)
        and c.active
        and (c.expires_at is null or c.expires_at > now())
        and (c.max_uses is null or c.uses_count < c.max_uses)
    ), false) as free_shipping;
$$;

grant execute on function validate_coupon(text) to anon;
