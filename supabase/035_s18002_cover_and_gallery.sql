-- Studio 18 — capa corrigida + galeria de fotos do S18-002 (moto "BMW
-- R1300GS", GULY). Rode no SQL Editor do Supabase depois de já ter rodado
-- 034_add_staff_socios.sql.

-- A capa anterior mostrava uma moto errada (com logo real da BMW, que não
-- deveria aparecer neste produto genérico). image_url já foi substituído
-- pelo arquivo /products/S18-002.jpg recomposto com a moto correta.
-- Aqui preenchemos a galeria (image_urls) com os ângulos extras compostos
-- no mesmo cenário. A foto "frente" ainda não foi enviada — será
-- adicionada numa migration seguinte.
update products
set image_urls = array[
  '/products/S18-002-lateral.jpg',
  '/products/S18-002-traseira.jpg',
  '/products/S18-002-caixa.jpg'
]
where sku = 'S18-002';
