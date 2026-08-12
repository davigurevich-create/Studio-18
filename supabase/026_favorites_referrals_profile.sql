-- Studio 18 — Favoritos, Indicação de amigos, Meus dados e Preferências de
-- notificação (área logada do cliente no site). Rode no SQL Editor do
-- Supabase, depois de já ter rodado 025_customer_accounts.sql.
--
-- Todas as tabelas novas seguem o mesmo padrão de segurança de
-- 025_customer_accounts.sql: cada cliente só acessa as próprias linhas
-- (using/with check por auth.uid()), e a equipe (is_staff()) já criada
-- naquele arquivo não precisa de nada extra aqui — nenhuma dessas tabelas
-- tem dado sensível de negócio que a equipe precise gerenciar via policy
-- própria, exceto a extensão de `coupons`, que já é staff-only por padrão.

-- ---------------------------------------------------------------------------
-- 1. Favoritos
-- ---------------------------------------------------------------------------
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table favorites enable row level security;

create policy "customers manage own favorites" on favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. Indicação de amigos — reaproveita a tabela `coupons` já existente
-- (parcerias com influenciadores). `kind` distingue os cupons de sempre
-- (staff) dos novos tipos: o código pessoal e permanente de cada cliente
-- (referral_code, usado pelo AMIGO indicado no checkout) e o cupom de
-- recompensa de uso único que o INDICADOR ganha quando o amigo compra.
-- ---------------------------------------------------------------------------
alter table coupons add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
alter table coupons add column if not exists kind text not null default 'staff' check (kind in ('staff', 'referral_code', 'referral_reward'));
alter table coupons add column if not exists source_referral_code text;

-- A policy "authenticated full access" de coupons (025) já cobre is_staff().
-- Esta é a permissão adicional: o cliente pode VER (não editar) os próprios
-- cupons — nem o código pessoal, nem as recompensas ganhas, são segredo dele.
create policy "customers can view own coupons" on coupons
  for select using (owner_user_id = auth.uid());

-- Cria (na primeira vez) ou retorna o código de indicação permanente do
-- cliente logado. security definer porque o cliente comum não tem INSERT
-- em `coupons` (só staff, via policy acima) — só esta função, controlada,
-- pode criar o código pessoal dele.
create or replace function get_or_create_referral_code()
returns table (code text, discount_pct numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_pct numeric := 5;
begin
  select c.code into v_code from coupons c
    where c.owner_user_id = auth.uid() and c.kind = 'referral_code'
    limit 1;

  if v_code is null then
    loop
      v_code := 'AMIGO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      begin
        insert into coupons (code, discount_pct, active, max_uses, kind, owner_user_id)
        values (v_code, v_pct, true, null, 'referral_code', auth.uid());
        exit;
      exception when unique_violation then
        -- código colidiu com um já existente (raríssimo) — gera outro
      end;
    end loop;
  end if;

  return query select v_code, v_pct;
end;
$$;

grant execute on function get_or_create_referral_code() to authenticated;

create or replace function get_my_reward_coupons()
returns table (
  id uuid,
  code text,
  discount_pct numeric,
  active boolean,
  uses_count integer,
  max_uses integer,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select c.id, c.code, c.discount_pct, c.active, c.uses_count, c.max_uses, c.created_at
  from coupons c
  where c.owner_user_id = auth.uid() and c.kind = 'referral_reward'
  order by c.created_at desc;
$$;

grant execute on function get_my_reward_coupons() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Meus dados — perfil (nome/CPF) e endereços salvos
-- ---------------------------------------------------------------------------
create table if not exists customer_profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  full_name text,
  cpf text,
  updated_at timestamptz not null default now()
);

alter table customer_profiles enable row level security;

create policy "customers manage own profile" on customer_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text,
  zip_code text not null,
  street_name text not null,
  street_number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  federal_unit text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table customer_addresses enable row level security;

create policy "customers manage own addresses" on customer_addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. Preferências de notificação — só a tela e o armazenamento da escolha.
-- O envio automático de e-mail (reposição de estoque, novidades) ainda não
-- existe em nenhum lugar do sistema hoje; fica para uma etapa futura.
-- E-mails transacionais (confirmação de pedido, pagamento) continuam
-- sempre ativos, independente destas preferências.
-- ---------------------------------------------------------------------------
create table if not exists notification_preferences (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  restock_alerts boolean not null default true,
  news_updates boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table notification_preferences enable row level security;

create policy "customers manage own notification preferences" on notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
