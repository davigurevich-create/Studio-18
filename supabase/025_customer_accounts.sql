-- Studio 18 — área logada do cliente (login por código enviado ao e-mail,
-- via Supabase Auth nativo). Rode no SQL Editor do Supabase.
--
-- ATENÇÃO — leia antes de rodar:
-- Este projeto Supabase é compartilhado entre o painel de gestão (equipe) e
-- o site (clientes). Até agora, toda policy "authenticated full access"
-- confiava que só a equipe conseguia se autenticar. A partir do momento em
-- que um cliente comum faz login por código no site, ele TAMBÉM vira
-- "authenticated" — por isso este arquivo primeiro cria um jeito de
-- distinguir equipe de cliente (staff_members + is_staff()), e só depois
-- reescreve as policies antigas para usar is_staff() no lugar de
-- auth.role() = 'authenticated'.
--
-- PASSO OBRIGATÓRIO LOGO APÓS RODAR ESTE ARQUIVO: popular staff_members com
-- os e-mails da equipe (Davi, Rubens, Iwan) — veja o bloco comentado no
-- final deste arquivo. Sem isso a equipe fica temporariamente sem acesso
-- ao próprio painel.

-- ---------------------------------------------------------------------------
-- 1. Distinguir equipe (staff) de cliente comum
-- ---------------------------------------------------------------------------
create table if not exists staff_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table staff_members enable row level security;

-- Só quem já é staff consegue ver a própria lista de staff (evita expor
-- e-mails da equipe para clientes autenticados).
create policy "staff can view staff_members" on staff_members
  for select using (exists (select 1 from staff_members sm where sm.user_id = auth.uid()));

create or replace function is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from staff_members where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- 2. Reescreve as policies "authenticated full access" para is_staff()
-- ---------------------------------------------------------------------------
drop policy if exists "authenticated full access" on products;
create policy "authenticated full access" on products
  for all using (is_staff()) with check (is_staff());

drop policy if exists "authenticated full access" on containers;
create policy "authenticated full access" on containers
  for all using (is_staff()) with check (is_staff());

drop policy if exists "authenticated full access" on inventory_movements;
create policy "authenticated full access" on inventory_movements
  for all using (is_staff()) with check (is_staff());

drop policy if exists "authenticated full access" on sales;
create policy "authenticated full access" on sales
  for all using (is_staff()) with check (is_staff());

drop policy if exists "authenticated full access" on sale_items;
create policy "authenticated full access" on sale_items
  for all using (is_staff()) with check (is_staff());

drop policy if exists "authenticated full access" on expenses;
create policy "authenticated full access" on expenses
  for all using (is_staff()) with check (is_staff());

drop policy if exists "authenticated full access" on blog_posts;
create policy "authenticated full access" on blog_posts
  for all using (is_staff()) with check (is_staff());

drop policy if exists "authenticated full access" on blog_topics;
create policy "authenticated full access" on blog_topics
  for all using (is_staff()) with check (is_staff());

drop policy if exists "authenticated full access" on part_requests;
create policy "authenticated full access" on part_requests
  for all using (is_staff()) with check (is_staff());

drop policy if exists "authenticated can insert audit log" on audit_log;
create policy "authenticated can insert audit log" on audit_log
  for insert with check (is_staff());

drop policy if exists "authenticated can read audit log" on audit_log;
create policy "authenticated can read audit log" on audit_log
  for select using (is_staff());

drop policy if exists "authenticated can upload blog covers" on storage.objects;
create policy "authenticated can upload blog covers" on storage.objects
  for insert with check (bucket_id = 'blog-covers' and is_staff());

drop policy if exists "authenticated can view waitlist" on restock_waitlist;
create policy "authenticated can view waitlist" on restock_waitlist
  for select using (is_staff());

drop policy if exists "authenticated can update waitlist" on restock_waitlist;
create policy "authenticated can update waitlist" on restock_waitlist
  for update using (is_staff()) with check (is_staff());

drop policy if exists "authenticated full access" on social_content_ideas;
create policy "authenticated full access" on social_content_ideas
  for all using (is_staff()) with check (is_staff());

drop policy if exists "authenticated full access" on coupons;
create policy "authenticated full access" on coupons
  for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------------
-- 3. Acesso do cliente comum aos próprios dados na lista de espera
-- (select/update acima ficou só para staff — isso aqui é a permissão
-- separada do cliente ver e remover as próprias entradas)
-- ---------------------------------------------------------------------------
create policy "customers can view own waitlist entries" on restock_waitlist
  for select using (lower(customer_email) = lower(auth.jwt() ->> 'email'));

create policy "customers can delete own waitlist entries" on restock_waitlist
  for delete using (lower(customer_email) = lower(auth.jwt() ->> 'email'));

-- ---------------------------------------------------------------------------
-- 4. Peças faltantes: vincular a um pedido real (order_id) em vez de um
-- texto livre digitado pelo cliente.
-- ---------------------------------------------------------------------------
alter table part_requests add column if not exists order_id uuid references sales(id) on delete set null;
alter table part_requests alter column order_reference drop not null;

-- ---------------------------------------------------------------------------
-- 5. Funções que o cliente logado usa para ver os próprios dados —
-- security definer, para não precisar dar acesso amplo às tabelas via RLS
-- (mesmo padrão já usado em get_order_status e validate_coupon).
-- ---------------------------------------------------------------------------
create or replace function get_my_orders()
returns table (
  id uuid,
  sale_date timestamptz,
  status text,
  payment_method text,
  shipping_city text,
  shipping_federal_unit text,
  shipping_zip_code text,
  shipping_street_name text,
  shipping_street_number text,
  shipping_complement text,
  shipping_neighborhood text,
  customer_name text,
  items jsonb
)
language sql
security definer
stable
set search_path = public
as $$
  select
    s.id,
    s.sale_date,
    s.status,
    s.payment_method,
    s.shipping_city,
    s.shipping_federal_unit,
    s.shipping_zip_code,
    s.shipping_street_name,
    s.shipping_street_number,
    s.shipping_complement,
    s.shipping_neighborhood,
    s.customer_name,
    coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'product_name', p.name,
          'quantity', si.quantity,
          'unit_price_brl', si.unit_price_brl
        ))
        from sale_items si
        join products p on p.id = si.product_id
        where si.sale_id = s.id
      ),
      '[]'::jsonb
    ) as items
  from sales s
  where lower(s.customer_contact) = lower(auth.jwt() ->> 'email')
  order by s.sale_date desc;
$$;

grant execute on function get_my_orders() to authenticated;

create or replace function get_my_part_requests()
returns table (
  id uuid,
  created_at timestamptz,
  product_model text,
  part_description text,
  replacement_type text,
  status text,
  photo_url text
)
language sql
security definer
stable
set search_path = public
as $$
  select pr.id, pr.created_at, pr.product_model, pr.part_description, pr.replacement_type, pr.status, pr.photo_url
  from part_requests pr
  where lower(pr.customer_email) = lower(auth.jwt() ->> 'email')
  order by pr.created_at desc;
$$;

grant execute on function get_my_part_requests() to authenticated;

-- ---------------------------------------------------------------------------
-- PASSO MANUAL — rode logo em seguida, trocando os e-mails abaixo pelos
-- e-mails reais de login do painel de gestão de cada sócio:
-- ---------------------------------------------------------------------------
-- insert into staff_members (user_id, email)
-- select id, email from auth.users where email = 'davi@exemplo.com'
-- on conflict (user_id) do nothing;
--
-- insert into staff_members (user_id, email)
-- select id, email from auth.users where email = 'rubens@exemplo.com'
-- on conflict (user_id) do nothing;
--
-- insert into staff_members (user_id, email)
-- select id, email from auth.users where email = 'iwan@exemplo.com'
-- on conflict (user_id) do nothing;
