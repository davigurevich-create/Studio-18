-- Novo SKU "placeholder" (AMG GT3) pra testar interesse antes de fechar a
-- importação no próximo container — mesmo mecanismo da migration 061:
-- active = true, sale_price_brl = 0 (preço ainda não definido) e SEM
-- inventory_movements de entrada, então o produto aparece no site como
-- "Esgotado no lote atual" com o botão "Avise-me" (lista de espera).

insert into products (sku, name, category, brand_model, scale, piece_count, manufacturer, image_url, sale_price_brl, active)
values
  ('S18-022', 'AMG GT3', 'carro', 'Mercedes-AMG GT3', '1:8', 5466, 'CADA', '/products/S18-022.jpg', 0, true)
on conflict (sku) do nothing;
