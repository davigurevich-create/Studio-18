-- Studio 18 — galeria de fotos do S18-022 (Mercedes-AMG GT3). Rode no SQL
-- Editor do Supabase depois de já ter rodado 098_amg_gt3_available.sql.
update products
set image_urls = array[
  '/products/S18-022-lateral.jpg',
  '/products/S18-022-traseira.jpg',
  '/products/S18-022-acima.jpg',
  '/products/S18-022-interior.jpg'
]
where sku = 'S18-022';
