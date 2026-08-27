-- Studio 18 — vídeo de produto do S18-009 (Maserati Gran Turismo). Rode no
-- SQL Editor do Supabase depois de já ter rodado 045_s18009_gallery_images.sql.
update products
set video_url = 'https://otlzxteecaxaolhmwmsc.supabase.co/storage/v1/object/public/product-videos/S18-009-video.mp4'
where sku = 'S18-009';
