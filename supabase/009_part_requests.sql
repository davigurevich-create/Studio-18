-- Studio 18 — solicitações de reposição de peças faltantes
-- Rode no SQL Editor do Supabase.
--
-- O cliente escolhe entre:
--   'impressao_3d'        — peça provisória impressa em 3D pela Studio 18, enviada em até 2 dias úteis
--   'original_fabricante'  — peça original pedida ao fabricante, prazo maior de envio
-- Ambas as opções são sempre gratuitas para o cliente.
--
-- O INSERT sempre acontece pela Edge Function submit-part-request (usando a
-- service role key), então não é necessária nenhuma policy de INSERT para
-- "anon" aqui — só a leitura/gestão pela equipe autenticada no painel.

create table if not exists part_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  customer_email text not null,
  order_reference text not null,
  product_model text not null,
  part_description text not null,
  replacement_type text not null check (replacement_type in ('impressao_3d', 'original_fabricante')),
  status text not null default 'pendente' check (status in ('pendente', 'em_producao', 'enviado', 'concluido')),
  admin_notes text
);

alter table part_requests enable row level security;

create policy "authenticated full access" on part_requests
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
