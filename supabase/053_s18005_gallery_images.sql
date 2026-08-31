-- Studio 18 — galeria de fotos do S18-005 (Pagani Utopia). Rode
-- no SQL Editor do Supabase depois de já ter rodado 052_s18013_gallery_images.sql.

-- A capa (image_url) já estava correta; aqui só preenchemos a galeria
-- (image_urls). Fotos geradas a partir de material novo enviado pelo
-- usuário (S18-005-1new a 5new), corrigindo a traseira anterior que tinha
-- saído com o topo/cockpit bege em vez de preto.
update products
set image_urls = array[
  '/products/S18-005-lateral.jpg',
  '/products/S18-005-traseira.jpg',
  '/products/S18-005-aberto.jpg',
  '/products/S18-005-interior.jpg',
  '/products/S18-005-caixa.jpg'
]
where sku = 'S18-005';
