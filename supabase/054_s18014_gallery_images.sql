-- Studio 18 — galeria de fotos do S18-014 (Ferrari Enzo). Rode
-- no SQL Editor do Supabase depois de já ter rodado 053_s18005_gallery_images.sql.

-- A capa (image_url) já estava correta; aqui só preenchemos a galeria
-- (image_urls). Só 3 fotos porque o material bruto disponível não tinha
-- referência de traseira/lateral (só ângulo frontal com porta aberta,
-- chassi desmontado e caixa) — vídeo de produto já cadastrado (migration
-- 047).
update products
set image_urls = array[
  '/products/S18-014-aberto.jpg',
  '/products/S18-014-motor.jpg',
  '/products/S18-014-caixa.jpg'
]
where sku = 'S18-014';
