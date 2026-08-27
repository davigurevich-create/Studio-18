-- Studio 18 — galeria de fotos do S18-009 (Maserati Gran Turismo). Rode no
-- SQL Editor do Supabase depois de já ter rodado 044_s18008_gallery_images.sql.

-- A capa (image_url) já estava correta; aqui só preenchemos a galeria
-- (image_urls) com os ângulos extras compostos no mesmo cenário (mesa de
-- madeira, poltronas de couro, estante ao fundo). O tridente real da
-- Maserati foi preservado (marca licenciada, aparece nas fotos brutas).
update products
set image_urls = array[
  '/products/S18-009-lateral.jpg',
  '/products/S18-009-traseira.jpg',
  '/products/S18-009-aberto.jpg',
  '/products/S18-009-interior.jpg',
  '/products/S18-009-caixa.jpg'
]
where sku = 'S18-009';
