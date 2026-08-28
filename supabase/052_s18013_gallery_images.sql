-- Studio 18 — galeria de fotos do S18-013 (Nissan GT-R Liberty Walk). Rode
-- no SQL Editor do Supabase depois de já ter rodado 051_s18012_gallery_images.sql.

-- A capa (image_url) já estava correta; aqui só preenchemos a galeria
-- (image_urls). Marca real GULY preservada (aparece nas fotos brutas). A
-- foto de traseira teve que ser refeita 1x (rodas/lateral saíram
-- distantes do produto real; corrigida usando a lateral impressa na caixa
-- como referência extra).
update products
set image_urls = array[
  '/products/S18-013-frente.jpg',
  '/products/S18-013-traseira.jpg',
  '/products/S18-013-caixa.jpg'
]
where sku = 'S18-013';
