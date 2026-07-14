-- Studio 18 — os 17 modelos confirmados do primeiro container
-- Rode no SQL Editor do Supabase depois de schema.sql + migrations/002_site_catalog_fields.sql
--
-- Observacoes:
--   * sale_price_brl = valor de "investimento" informado (preco de venda ao cliente)
--   * cost_price_brl fica em 0 por enquanto — atualize no painel (Estoque) quando
--     souber o custo real de importacao rateado por unidade
--   * automotive_history e dimensions ficam vazios — preencha depois pelo Supabase
--     ou peca para eu adicionar via painel quando tiver o texto/medidas de cada set
--   * quantidade em estoque comeca em 0 — registre a entrada real em Estoque
--     quando o container chegar

insert into products (sku, name, category, manufacturer, collection_tag, scale, piece_count, cost_price_brl, sale_price_brl, min_stock_alert)
values
  ('S18-001', 'Lamborghini LP5000', 'carro', 'GULY', 'Vintage', '1:8', 3970, 0, 1564.40, 3),
  ('S18-002', 'BMW R1300GS', 'moto', 'GULY', 'Motocicleta', '1:5', 2489, 0, 1827.44, 3),
  ('S18-003', '963 (Edição Limitada Cromada)', 'carro', 'GULY', 'Lemans', '1:8', 3069, 0, 1287.52, 3),
  ('S18-004', 'BMW M4 GT4', 'carro', 'CBOX', 'Série GT', '1:8', 4556, 0, 1739.36, 3),
  ('S18-005', 'Pagani Utopia', 'carro', 'CBOX', 'Supercarro', '1:8', 4688, 0, 1353.66, 3),
  ('S18-006', 'Lotus Exige Cup 430', 'carro', 'CADA', 'Supercarro', '1:8', 3730, 0, 707.60, 3),
  ('S18-007', 'Mazda Le Mans Rally 787B', 'carro', 'CADA', 'Lemans', '1:8', 1797, 0, 642.99, 3),
  ('S18-008', '770-4 Touro Furioso', 'carro', 'CADA', 'Supercarro', '1:8', 3842, 0, 1127.54, 3),
  ('S18-009', 'Maserati Gran Turismo', 'carro', 'REOBRIX', 'Supercarro', '1:8', 5480, 0, 836.81, 3),
  ('S18-010', 'Fórmula 1 Edição Especial', 'carro', 'REOBRIX', 'Fórmula', '1:8', 3470, 0, 916.80, 3),
  ('S18-011', 'Bugatti Tourbillon', 'carro', 'GULY', 'Supercarro', '1:8', 3719, 0, 1518.25, 3),
  ('S18-012', 'Lamborghini Carro Conceito', 'carro', 'GULY', 'Conceito', '1:8', 3601, 0, 1748.99, 3),
  ('S18-013', 'Nissan GTR Liberty Walk', 'carro', 'GULY', 'Supercarro', '1:8', 3939, 0, 1656.70, 3),
  ('S18-014', 'Ferrari Enzo', 'carro', 'KBOX', 'Supercarro', '1:8', 4301, 0, 1656.70, 3),
  ('S18-015', 'Ferrari SF90 XX Stradale', 'carro', 'GULY', 'Supercarro', '1:8', 3639, 0, 1564.40, 3),
  ('S18-016', 'Land Rover Discovery', 'carro', 'GULY', 'Off Road', '1:8', 4817, 0, 2072.00, 3),
  ('S18-017', 'Lamborghini Aventador SVJ', 'carro', 'KBOX', 'Supercarro', '1:8', 3811, 0, 1656.70, 3)
on conflict (sku) do nothing;
