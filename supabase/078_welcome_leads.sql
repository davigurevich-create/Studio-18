-- Studio 18 — captura de e-mails de leads (pop-up de boas-vindas, cupom de
-- 10% na primeira compra) e o cupom evergreen correspondente. Rode no SQL
-- Editor do Supabase.

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'popup_boas_vindas',
  created_at timestamptz not null default now(),
  unique (email)
);

alter table leads enable row level security;

-- Mesmo padrão do restock_waitlist: qualquer visitante pode se cadastrar
-- (formulário público, sem login), mas só a equipe autenticada consegue ver
-- a lista.
drop policy if exists "public can join leads" on leads;
create policy "public can join leads" on leads
  for insert
  with check (true);

drop policy if exists "authenticated can view leads" on leads;
create policy "authenticated can view leads" on leads
  for select
  using (auth.role() = 'authenticated');

-- Cupom de boas-vindas — 10%, sem data de validade nem limite de usos
-- (evergreen). Sempre igual ou abaixo dos cupons de influencer, pra não
-- desvalorizar as parcerias.
insert into coupons (code, discount_pct, influencer_name, active)
values ('S18BEM10', 10, null, true)
on conflict (code) do nothing;
