-- Studio 18 — capa + galeria de fotos do S18-017 (Lamborghini Aventador
-- SVJ). Rode no SQL Editor do Supabase depois de já ter rodado
-- 055_s18015_gallery_images.sql.

-- Capa substituída pela nova foto de frente (usuário aprovou só
-- frente/traseira/motor das 5 geradas; a lateral e a caixa, gerada a
-- partir de foto bruta 220x220, foram descartadas). O arquivo
-- /products/S18-017.jpg foi sobrescrito no repo com o mesmo nome, então
-- só a galeria muda aqui.
update products
set image_urls = array[
  '/products/S18-017-traseira.jpg',
  '/products/S18-017-motor.jpg'
]
where sku = 'S18-017';
