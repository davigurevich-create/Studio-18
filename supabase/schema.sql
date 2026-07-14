-- Studio 18 — schema de estoque, vendas e financeiro
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase
-- (o mesmo projeto Supabase que o Lovable usa, se voce quiser compartilhar os dados com o site)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PRODUTOS (SKUs de sets de blocos de montar)
-- ---------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  category text not null check (category in ('carro', 'moto', 'motor')),
  brand_model text,
  scale text default '1:8',
  piece_count integer,
  cost_price_brl numeric(12, 2) not null default 0,
  sale_price_brl numeric(12, 2) not null default 0,
  min_stock_alert integer not null default 3,
  image_url text,
  image_urls text[] not null default '{}',
  manufacturer text,
  collection_tag text,
  automotive_history text,
  dimensions text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CONTAINERS / REMESSAS (o navio vindo da China, e futuros)
-- ---------------------------------------------------------------------------
create table if not exists containers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  origin text default 'China',
  status text not null default 'em_transito'
    check (status in ('em_transito', 'chegou', 'liberado')),
  eta_date date,
  arrival_date date,
  freight_cost_brl numeric(12, 2) default 0,
  customs_cost_brl numeric(12, 2) default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- MOVIMENTACOES DE ESTOQUE (entradas e saidas)
-- ---------------------------------------------------------------------------
create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  type text not null check (type in ('entrada', 'saida', 'ajuste')),
  quantity integer not null check (quantity > 0),
  unit_cost_brl numeric(12, 2),
  container_id uuid references containers(id) on delete set null,
  sale_id uuid,
  notes text,
  moved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- VENDAS
-- ---------------------------------------------------------------------------
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  sale_date timestamptz not null default now(),
  channel text not null default 'site'
    check (channel in ('site', 'whatsapp', 'instagram', 'feira', 'outro')),
  customer_name text,
  customer_contact text,
  payment_method text check (payment_method in ('pix', 'cartao', 'boleto', 'dinheiro', 'outro')),
  status text not null default 'pendente'
    check (status in ('pendente', 'pago', 'enviado', 'entregue', 'cancelado')),
  shipping_cost_brl numeric(12, 2) default 0,
  discount_brl numeric(12, 2) default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null check (quantity > 0),
  unit_price_brl numeric(12, 2) not null,
  unit_cost_brl numeric(12, 2) not null default 0
);

alter table inventory_movements
  add constraint inventory_movements_sale_id_fkey
  foreign key (sale_id) references sales(id) on delete set null;

-- ---------------------------------------------------------------------------
-- FINANCEIRO (despesas gerais: marketing, operacional, importacao, taxas...)
-- ---------------------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category text not null
    check (category in ('importacao', 'marketing', 'operacional', 'frete', 'taxas', 'outros')),
  description text not null,
  amount_brl numeric(12, 2) not null,
  container_id uuid references containers(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- VIEW: estoque atual por produto
-- ---------------------------------------------------------------------------
create or replace view product_stock as
select
  p.id as product_id,
  p.sku,
  p.name,
  p.category,
  p.min_stock_alert,
  p.cost_price_brl,
  p.sale_price_brl,
  coalesce(sum(case when m.type = 'entrada' then m.quantity
                     when m.type = 'ajuste' then m.quantity
                     else 0 end), 0)
  - coalesce(sum(case when m.type = 'saida' then m.quantity else 0 end), 0)
    as quantity_in_stock
from products p
left join inventory_movements m on m.product_id = p.id
group by p.id, p.sku, p.name, p.category, p.min_stock_alert, p.cost_price_brl, p.sale_price_brl;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Acesso total para usuarios autenticados (equipe interna do dashboard).
-- Se o site do Lovable precisar LER produtos/estoque publicamente (ex: para
-- mostrar disponibilidade), adicione uma policy extra de select para "anon"
-- na tabela products / product_stock.
-- ---------------------------------------------------------------------------
alter table products enable row level security;
alter table containers enable row level security;
alter table inventory_movements enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table expenses enable row level security;

create policy "authenticated full access" on products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on containers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on inventory_movements
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on sales
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on sale_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on expenses
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- VIEW publica para o site do Lovable consumir (catalogo + disponibilidade),
-- sem expor custo de importacao nem dados internos de vendas/financeiro.
-- ---------------------------------------------------------------------------
drop view if exists public_catalog;

create view public_catalog as
select
  p.id,
  p.sku,
  p.name,
  p.category,
  p.brand_model,
  p.manufacturer,
  p.collection_tag,
  p.scale,
  p.piece_count,
  p.sale_price_brl,
  p.image_url,
  p.image_urls,
  p.automotive_history,
  p.dimensions,
  greatest(coalesce(s.quantity_in_stock, 0), 0) as quantity_available
from products p
left join product_stock s on s.product_id = p.id
where p.active = true;

grant select on public_catalog to anon, authenticated;

create policy "public read active products for catalog view" on products
  for select using (active = true);

-- ---------------------------------------------------------------------------
-- Permite que o site publico crie pedidos (vendas pendentes) sem login.
-- O checkout do site so consegue INSERIR uma venda com status "pendente" e
-- canal "site" — nao consegue ler, alterar nem cancelar vendas existentes
-- (isso continua exigindo login no painel de gestao).
-- ---------------------------------------------------------------------------
create policy "public can create pending site orders" on sales
  for insert
  with check (channel = 'site' and status = 'pendente');

create policy "public can add items to a site order" on sale_items
  for insert
  with check (
    exists (
      select 1 from sales s
      where s.id = sale_id and s.channel = 'site' and s.status = 'pendente'
    )
  );
