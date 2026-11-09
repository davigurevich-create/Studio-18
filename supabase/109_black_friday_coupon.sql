-- Studio 18 — cupom da Black Friday (BLACKFRIDAY25). Por decisão explícita
-- do usuário, esse cupom empilha ADITIVAMENTE com o desconto do Pix nessa
-- campanha (25% do cupom + 5% do Pix = 30% no Pix), em vez do
-- empilhamento multiplicativo padrão do resto do site (que daria ~28,75%).
-- Rode no SQL Editor do Supabase.

alter table coupons add column if not exists additive_with_pix boolean not null default false;

-- Expira sozinho às 00:00 de 28/11/2026 (horário de Brasília) — depois
-- disso o cupom simplesmente para de validar, sem precisar desativar nada
-- manualmente (mesma data de corte usada no site, em
-- site/src/lib/blackFriday.ts).
insert into coupons (code, discount_pct, free_shipping, additive_with_pix, kind, active, expires_at)
values ('BLACKFRIDAY25', 25, false, true, 'staff', true, '2026-11-28T00:00:00-03:00')
on conflict (code) do update set
  discount_pct = 25,
  additive_with_pix = true,
  active = true,
  expires_at = '2026-11-28T00:00:00-03:00';

-- validate_coupon precisa do formato de retorno trocado (agora inclui
-- additive_with_pix) — Postgres não deixa mudar isso com CREATE OR
-- REPLACE, precisa apagar antes de recriar.
drop function if exists validate_coupon(text);

create function validate_coupon(coupon_code text)
returns table (valid boolean, discount_pct numeric, free_shipping boolean, additive_with_pix boolean)
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
    ), false) as free_shipping,
    coalesce((
      select c.additive_with_pix from coupons c
      where lower(c.code) = lower(coupon_code)
        and c.active
        and (c.expires_at is null or c.expires_at > now())
        and (c.max_uses is null or c.uses_count < c.max_uses)
    ), false) as additive_with_pix;
$$;

grant execute on function validate_coupon(text) to anon;
