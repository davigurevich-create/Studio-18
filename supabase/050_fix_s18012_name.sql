-- Studio 18 — corrige o nome do S18-012: estava cadastrado como
-- "Lamborghini Carro Conceito" / "Lamborghini Concept", mas o produto real
-- é o Lamborghini Temerario. Rode no SQL Editor do Supabase depois de já
-- ter rodado 049_s18010_gallery_images.sql.
update products
set name = 'Lamborghini Temerario',
    brand_model = 'Lamborghini Temerario'
where sku = 'S18-012';
