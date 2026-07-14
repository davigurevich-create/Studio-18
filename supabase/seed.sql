-- Dados de exemplo (opcional) para testar o dashboard antes do container chegar.
-- Rode depois de schema.sql, no SQL Editor do Supabase.

insert into containers (code, origin, status, eta_date, freight_cost_brl, customs_cost_brl, notes)
values
  ('CONT-2026-01', 'China', 'em_transito', current_date + interval '20 days', 18000.00, 6500.00, 'Primeiro container - abertura da Studio 18')
on conflict (code) do nothing;
