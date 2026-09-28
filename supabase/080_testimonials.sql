-- Studio 18 — depoimentos de clientes: coleta 5 dias depois da entrega,
-- com bônus de 1000 pontos por responder, moderação no painel antes de
-- publicar no site. Rode no SQL Editor do Supabase.

-- 1. Rastreia quando o pedido foi entregue de verdade (pra saber quando
-- completar os 5 dias) e se já pedimos o depoimento (pra nunca pedir duas
-- vezes).
alter table sales add column if not exists delivered_at timestamptz;
alter table sales add column if not exists testimonial_requested_at timestamptz;

-- 2. Depoimentos em si.
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade unique,
  product_id uuid references products(id),
  customer_name text not null,
  customer_email text not null,
  rating integer not null check (rating between 1 and 5),
  message text not null,
  photo_url text,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'rejeitado')),
  created_at timestamptz not null default now()
);

alter table testimonials enable row level security;

-- Qualquer visitante pode enviar (formulário público, vindo do link do
-- e-mail) — mas o unique(sale_id) acima já impede duplicar/farmar pontos
-- respondendo várias vezes pro mesmo pedido.
create policy "public can submit testimonial" on testimonials
  for insert
  with check (true);

-- O site só pode listar os já aprovados (seção "o que dizem" da home).
create policy "public can view approved testimonials" on testimonials
  for select
  using (status = 'aprovado');

-- A equipe vê e modera todos (aprovar/rejeitar) no painel.
create policy "authenticated can view testimonials" on testimonials
  for select
  using (auth.role() = 'authenticated');

create policy "authenticated can update testimonials" on testimonials
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Bucket público para a foto opcional do set montado.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'testimonial-photos',
  'testimonial-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public can upload testimonial photos" on storage.objects
  for insert
  with check (bucket_id = 'testimonial-photos');

create policy "public can read testimonial photos" on storage.objects
  for select
  using (bucket_id = 'testimonial-photos');

-- 3. Registro de pontos por cliente — hoje não existe controle nenhum de
-- pontos, isso aqui é só a base (um "extrato"), pra já existir um lugar
-- confiável guardando o bônus do depoimento. A aba do painel pra visualizar
-- o saldo de cada cliente fica pra depois, como o Davi pediu.
create table if not exists customer_points_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  points integer not null,
  reason text not null,
  sale_id uuid references sales(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table customer_points_ledger enable row level security;

create policy "authenticated can view points ledger" on customer_points_ledger
  for select
  using (auth.role() = 'authenticated');

-- Só a service role escreve aqui (dentro da Edge Function, ao aprovar um
-- depoimento) — sem policy de insert pra ninguém além dela.

-- 4. Agendamento — chama a function request-testimonials 1x por dia, que
-- manda o e-mail pra pedidos entregues há 5+ dias que ainda não foram
-- avisados. Requer pg_cron/pg_net já habilitados (mesma extensão usada em
-- 065_delivery_status_automation.sql).
--
-- IMPORTANTE: troque SEU_PROJECT_REF e SUA_SERVICE_ROLE_KEY pelos valores
-- reais do seu projeto antes de rodar este bloco. Nunca cometa esses
-- valores reais de volta no repositório Git.
select cron.schedule(
  'request-testimonials-daily',
  '0 13 * * *',
  $$
  select net.http_post(
    url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/request-testimonials',
    headers := jsonb_build_object(
      'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
