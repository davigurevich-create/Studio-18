-- Studio 18 — capa corrigida e galeria de fotos do S18-007 (Mazda 787B).
-- Rode no SQL Editor do Supabase depois de já ter rodado
-- 041_s18006_gallery_images.sql.

-- A capa original não mostrava a marca "mazda" (licenciada oficial,
-- presente nas fotos brutas do fabricante) — foi corrigida. A galeria tem
-- 4 fotos (lateral, traseira, aberto, caixa); uma quinta foto de detalhe
-- do motor (traseira aberta) foi gerada mas não aprovada pelo usuário.
update products
set image_url = '/products/S18-007.jpg',
    image_urls = array[
      '/products/S18-007-lateral.jpg',
      '/products/S18-007-traseira.jpg',
      '/products/S18-007-aberto.jpg',
      '/products/S18-007-caixa.jpg'
    ]
where sku = 'S18-007';
