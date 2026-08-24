-- Studio 18 — galeria de fotos do S18-003 (Porsche 963). Rode no SQL
-- Editor do Supabase depois de já ter rodado 031_s18001_gallery_images.sql.

-- A capa (image_url) já estava correta; aqui só preenchemos a galeria
-- (image_urls) com os ângulos extras compostos no mesmo cenário (mesa de
-- madeira, poltronas de couro, estante ao fundo).
update products
set image_urls = array[
  '/products/S18-003-frente.jpg',
  '/products/S18-003-lateral.jpg',
  '/products/S18-003-traseira.jpg',
  '/products/S18-003-aberto.jpg',
  '/products/S18-003-caixa.jpg'
]
where sku = 'S18-003';
