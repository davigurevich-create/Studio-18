-- Studio 18 — suporte a pagamento real via Mercado Pago
-- Rode no SQL Editor do Supabase.

alter table sales
  add column if not exists payment_provider text,
  add column if not exists provider_payment_id text,
  add column if not exists provider_status text;

create unique index if not exists sales_provider_payment_id_idx
  on sales (provider_payment_id)
  where provider_payment_id is not null;
