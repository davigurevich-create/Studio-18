-- Studio 18 — galeria de fotos do S18-001 (Lamborghini LP5000). Rode no
-- SQL Editor do Supabase depois de já ter rodado 030_s18016_gallery_images.sql.

-- A capa (image_url) já estava correta; aqui só preenchemos a galeria
-- (image_urls) com os ângulos extras compostos no mesmo cenário (mesa de
-- madeira, poltronas de couro, estante ao fundo).
update products
set image_urls = array[
  '/products/S18-001-frente.jpg',
  '/products/S18-001-lateral.jpg',
  '/products/S18-001-traseira.jpg',
  '/products/S18-001-caixa.jpg'
]
where sku = 'S18-001';
