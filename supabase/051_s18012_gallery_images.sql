-- Studio 18 — galeria de fotos do S18-012 (Lamborghini Temerario). Rode no
-- SQL Editor do Supabase depois de já ter rodado 050_fix_s18012_name.sql.

-- A capa (image_url) já estava correta; aqui só preenchemos a galeria
-- (image_urls). Fotos de aberto/traseira/detalhe usaram referências brutas
-- em baixa resolução (220x220), exceto a de "detalhe" (traseira reta com
-- aerofólio) que usou uma foto nova em boa resolução.
update products
set image_urls = array[
  '/products/S18-012-frente.jpg',
  '/products/S18-012-traseira.jpg',
  '/products/S18-012-detalhe.jpg',
  '/products/S18-012-aberto.jpg',
  '/products/S18-012-caixa.jpg'
]
where sku = 'S18-012';
