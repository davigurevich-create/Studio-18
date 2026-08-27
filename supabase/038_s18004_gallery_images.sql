-- Studio 18 — galeria de fotos do S18-004 (BMW M4 GT4). Rode no SQL
-- Editor do Supabase depois de já ter rodado 037_invoice_ref.sql.

-- A capa (image_url) já estava correta; aqui só preenchemos a galeria
-- (image_urls) com os ângulos extras compostos no mesmo cenário (mesa de
-- madeira, poltronas de couro, estante ao fundo). A foto "interior" usou a
-- técnica de troca de fundo (preserva o close-up original, só substitui o
-- fundo de quarto pelo bokeh do cenário padrão).
update products
set image_urls = array[
  '/products/S18-004-frente.jpg',
  '/products/S18-004-traseira.jpg',
  '/products/S18-004-aberto.jpg',
  '/products/S18-004-motor.jpg',
  '/products/S18-004-interior.jpg',
  '/products/S18-004-caixa.jpg'
]
where sku = 'S18-004';
