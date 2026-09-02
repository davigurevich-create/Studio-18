-- 4 novos SKUs "placeholder" para teste de interesse antes do próximo container.
-- active = true, sale_price_brl = 0 (preço ainda não definido) e SEM inventory_movements
-- de entrada, então o produto aparece no site como "Esgotado no lote atual" com o
-- botão "Avise-me" (lista de espera) — mecanismo já existente pra medir demanda.

insert into products (sku, name, category, brand_model, scale, manufacturer, image_url, sale_price_brl, active)
values
  ('S18-018', 'Audi RS6 Avant', 'carro', 'Audi RS6 Avant', '1:8', 'CADA', '/products/S18-018.jpg', 0, true),
  ('S18-019', 'Zero Pulse', 'moto', 'Zero Pulse', '1:8', 'GULY', '/products/S18-019.jpg', 0, true),
  ('S18-020', 'McLaren Senna GTR', 'carro', 'McLaren Senna GTR', '1:8', 'GULY', '/products/S18-020.jpg', 0, true),
  ('S18-021', 'Aston Martin Valour', 'carro', 'Aston Martin Valour', '1:8', 'NIFELIZ', '/products/S18-021.jpg', 0, true)
on conflict (sku) do nothing;
