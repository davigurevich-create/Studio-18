-- Studio 18 — galeria de fotos do S18-010 (Fórmula 1). Rode no SQL Editor
-- do Supabase depois de já ter rodado 048_s18017_video.sql.

-- A capa (image_url) já estava correta; aqui só preenchemos a galeria
-- (image_urls). Só havia 3 fotos brutas (frente, caixa, caixa-ângulo), por
-- isso a galeria tem apenas 2 fotos extras (frente, caixa).
update products
set image_urls = array[
  '/products/S18-010-frente.jpg',
  '/products/S18-010-caixa.jpg'
]
where sku = 'S18-010';
