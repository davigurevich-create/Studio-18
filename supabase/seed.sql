-- Dados de exemplo (opcional) para testar o dashboard antes do container chegar.
-- Rode depois de schema.sql, no SQL Editor do Supabase.

insert into products (sku, name, category, brand_model, scale, piece_count, cost_price_brl, sale_price_brl, min_stock_alert)
values
  ('S18-CAR-001', 'Ferrari F40 Premium Kit', 'carro', 'Ferrari F40', '1:8', 850, 420.00, 899.90, 5),
  ('S18-CAR-002', 'Porsche 911 GT3 Kit', 'carro', 'Porsche 911 GT3', '1:8', 780, 390.00, 849.90, 5),
  ('S18-MOTO-001', 'Harley-Davidson Fat Boy Kit', 'moto', 'Harley-Davidson Fat Boy', '1:8', 620, 310.00, 699.90, 5),
  ('S18-MOT-001', 'V8 Engine Block Kit', 'motor', 'V8 Small Block', '1:8', 450, 260.00, 599.90, 5)
on conflict (sku) do nothing;

insert into containers (code, origin, status, eta_date, freight_cost_brl, customs_cost_brl, notes)
values
  ('CONT-2026-01', 'China', 'em_transito', current_date + interval '20 days', 18000.00, 6500.00, 'Primeiro container - abertura da Studio 18')
on conflict (code) do nothing;
