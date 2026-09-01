-- Studio 18 — corrige o nome do S18-016: era catalogado como "Land Rover
-- Discovery", mas o modelo real é o "Land Rover Defender". Rode no SQL
-- Editor do Supabase depois de já ter rodado 056_s18017_gallery_images.sql.
update products
set name = 'Land Rover Defender', brand_model = 'Land Rover Defender'
where sku = 'S18-016';
