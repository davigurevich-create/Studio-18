-- Studio 18 — vídeo de produto do S18-014 (Ferrari Enzo). Rode no SQL
-- Editor do Supabase depois de já ter rodado 046_s18009_video.sql.
update products
set video_url = 'https://otlzxteecaxaolhmwmsc.supabase.co/storage/v1/object/public/product-videos/S18-014-video.mp4'
where sku = 'S18-014';
