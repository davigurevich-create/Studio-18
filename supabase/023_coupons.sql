-- Studio 18 — cupons de desconto para parcerias com influenciadores.
-- Rode no SQL Editor do Supabase.

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_pct numeric not null check (discount_pct > 0 and discount_pct <= 100),
  influencer_name text,
  active boolean not null default true,
  max_uses integer,
  uses_count integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table coupons enable row level security;

create policy "authenticated full access" on coupons
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Rastreabilidade: qual cupom (se algum) foi usado em cada venda.
alter table sales add column if not exists coupon_code text;

-- Validação pública do cupom no checkout do site — não expõe a tabela
-- inteira (lista de códigos/influenciadores), só se o código informado é
-- válido no momento e qual o desconto. A cobrança real recalcula tudo de
-- novo no servidor (Edge Function mp-create-payment), então esta função é
-- só para feedback imediato na tela.
create or replace function validate_coupon(coupon_code text)
returns table (valid boolean, discount_pct numeric)
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
    ) as discount_pct;
$$;

grant execute on function validate_coupon(text) to anon;
