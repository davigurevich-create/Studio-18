-- Novo SKU "placeholder" (AMG ONE) pra testar interesse antes de fechar a
-- importação no próximo container — mesmo mecanismo das migrations 061/096:
-- active = true, sale_price_brl = 0 (preço ainda não definido) e SEM
-- inventory_movements de entrada, então o produto aparece no site como
-- "Esgotado no lote atual" com o botão "Avise-me" (lista de espera).

insert into products (sku, name, category, brand_model, scale, piece_count, manufacturer, image_url, sale_price_brl, active)
values
  ('S18-023', 'AMG ONE', 'carro', 'Mercedes-AMG ONE', '1:8', 3295, 'CADA', '/products/S18-023.jpg', 0, true)
on conflict (sku) do nothing;
