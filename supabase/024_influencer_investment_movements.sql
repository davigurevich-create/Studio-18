-- Studio 18 — motivo de saída de estoque para envio de produto a
-- influenciadores (parceria: produto em troca de conteúdo, não é venda).
-- Rode no SQL Editor do Supabase.

alter table inventory_movements add column if not exists reason text;
alter table inventory_movements add column if not exists influencer_name text;

alter table inventory_movements drop constraint if exists inventory_movements_reason_check;
alter table inventory_movements add constraint inventory_movements_reason_check
  check (reason is null or reason in ('investimento_influencer'));
