-- Studio 18 — vídeo de produto do S18-017 (Lamborghini Aventador SVJ). Rode
-- no SQL Editor do Supabase depois de já ter rodado 047_s18014_video.sql.
update products
set video_url = 'https://otlzxteecaxaolhmwmsc.supabase.co/storage/v1/object/public/product-videos/S18-017-video.mp4'
where sku = 'S18-017';
