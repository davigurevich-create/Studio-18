-- Studio 18 — galeria de fotos do S18-016 (Land Rover Discovery). Rode no
-- SQL Editor do Supabase depois de já ter rodado 029_shipping_labels.sql.

-- A capa (image_url) já foi recomposta com o carro correto e roda
-- prateada; aqui só preenchemos a galeria (image_urls) com os ângulos
-- extras compostos no mesmo cenário (mesa de madeira, poltronas de couro,
-- estante ao fundo).
update products
set image_urls = array[
  '/products/S18-016-frente.jpg',
  '/products/S18-016-lateral.jpg',
  '/products/S18-016-traseira.jpg',
  '/products/S18-016-detalhe.jpg',
  '/products/S18-016-caixa.jpg'
]
where sku = 'S18-016';
