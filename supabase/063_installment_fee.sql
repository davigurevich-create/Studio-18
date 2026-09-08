-- Studio 18 — acréscimo de parcelamento (cartão, 7x a 12x)
-- Rode no SQL Editor do Supabase.

alter table sales
  add column if not exists installments integer,
  add column if not exists installment_fee_brl numeric not null default 0;
