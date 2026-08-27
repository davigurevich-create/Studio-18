-- Studio 18 — galeria de fotos do S18-006 (Lotus Exige Cup 430). Rode no
-- SQL Editor do Supabase depois de já ter rodado 040_reset_test_invoice.sql.

-- A capa (image_url) já estava correta; aqui só preenchemos a galeria
-- (image_urls) com os ângulos extras compostos no mesmo cenário (mesa de
-- madeira, poltronas de couro, estante ao fundo). O selo real da Lotus foi
-- preservado (marca licenciada presente nas fotos brutas do fabricante).
update products
set image_urls = array[
  '/products/S18-006-frente.jpg',
  '/products/S18-006-lateral.jpg',
  '/products/S18-006-traseira.jpg',
  '/products/S18-006-aberto.jpg',
  '/products/S18-006-motor.jpg',
  '/products/S18-006-caixa.jpg'
]
where sku = 'S18-006';
