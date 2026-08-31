-- Studio 18 — galeria de fotos do S18-015 (Ferrari SF90 XX Stradale). Rode
-- no SQL Editor do Supabase depois de já ter rodado 054_s18014_gallery_images.sql.

-- A capa (image_url) já estava correta; aqui só preenchemos a galeria
-- (image_urls). Sem foto de caixa porque o material bruto não tinha essa
-- referência. A foto de frente foi refeita 1x (rodas dianteiras saíram
-- amarelas e ambas viradas pra dentro; corrigida pra cinza claro com
-- geometria de esterço realista, só uma roda virada).
update products
set image_urls = array[
  '/products/S18-015-frente.jpg',
  '/products/S18-015-lateral.jpg',
  '/products/S18-015-traseira.jpg',
  '/products/S18-015-aberto.jpg'
]
where sku = 'S18-015';
