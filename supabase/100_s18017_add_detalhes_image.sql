-- Studio 18 — adiciona a nova foto de detalhe (super close-up) na galeria
-- do S18-017 (Lamborghini Aventador SVJ). Rode no SQL Editor do Supabase.
update products
set image_urls = array_append(image_urls, '/products/S18-017-detalhes.jpg')
where sku = 'S18-017'
  and not ('/products/S18-017-detalhes.jpg' = any(image_urls));
