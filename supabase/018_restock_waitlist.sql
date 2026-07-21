-- Studio 18 — lista de espera de reposição: quando um SKU zera o estoque, o
-- cliente pode deixar o e-mail para ser avisado quando chegar o próximo
-- container. Rode no SQL Editor do Supabase.

create table if not exists restock_waitlist (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  customer_name text,
  customer_email text not null,
  notified boolean not null default false,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (product_id, customer_email)
);

alter table restock_waitlist enable row level security;

-- Qualquer visitante do site pode entrar na lista (formulário público, sem
-- login) — mas só a equipe autenticada no painel consegue ver ou atualizar
-- os registros.
drop policy if exists "public can join waitlist" on restock_waitlist;
create policy "public can join waitlist" on restock_waitlist
  for insert
  with check (true);

drop policy if exists "authenticated can view waitlist" on restock_waitlist;
create policy "authenticated can view waitlist" on restock_waitlist
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "authenticated can update waitlist" on restock_waitlist;
create policy "authenticated can update waitlist" on restock_waitlist
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
