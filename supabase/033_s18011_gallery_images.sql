-- Studio 18 — galeria de fotos do S18-011 (Bugatti Tourbillon). Rode no
-- SQL Editor do Supabase depois de já ter rodado 032_s18003_gallery_images.sql.

-- A capa (image_url) já estava correta; aqui só preenchemos a galeria
-- (image_urls) com os ângulos extras compostos no mesmo cenário (mesa de
-- madeira, poltronas de couro, estante ao fundo). A foto de detalhe do
-- motor usa a foto bruta original (macro já bem enquadrada, sem precisar
-- de composição de cenário).
update products
set image_urls = array[
  '/products/S18-011-frente.jpg',
  '/products/S18-011-acima.jpg',
  '/products/S18-011-traseira.jpg',
  '/products/S18-011-detalhe.jpg',
  '/products/S18-011-aberto.jpg',
  '/products/S18-011-caixa.jpg'
]
where sku = 'S18-011';
