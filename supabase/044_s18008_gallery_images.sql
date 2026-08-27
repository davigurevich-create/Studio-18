-- Studio 18 — galeria de fotos do S18-008 (Lamborghini Centenario). Rode
-- no SQL Editor do Supabase depois de já ter rodado 043_fix_s18008_name.sql.

-- A capa (image_url) já estava correta; aqui só preenchemos a galeria
-- (image_urls) com os ângulos extras compostos no mesmo cenário (mesa de
-- madeira, poltronas de couro, estante ao fundo). Fotos de detalhe do
-- motor e do interior foram geradas mas reprovadas pelo usuário — não
-- fazem parte da galeria final.
update products
set image_urls = array[
  '/products/S18-008-lateral.jpg',
  '/products/S18-008-traseira.jpg',
  '/products/S18-008-aberto.jpg',
  '/products/S18-008-caixa.jpg'
]
where sku = 'S18-008';
