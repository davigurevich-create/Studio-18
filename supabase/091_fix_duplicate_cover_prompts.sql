-- Studio 18 — os 2 artigos pendentes de publicação tinham o prompt de
-- capa genérico, repetido entre eles. Troca pelo prompt personalizado de
-- cada um, já seguindo a identidade visual (estúdio, luz dramática quente,
-- paleta preto/carbono com dourado, sets técnicos em escala 1:8, 16:9).
-- Rode no SQL Editor do Supabase.

update blog_posts
set cover_image_prompt = 'Macro studio still-life of a premium 1:8 scale technical brick car model displayed inside a glass showcase, next to a sealed pristine retail box positioned like a trophy, warm dramatic studio lighting, black carbon-fiber background with subtle gold rim light, composition evoking a collector''s vault and long-term value, shallow depth of field, cinematic automotive photography, 16:9 aspect ratio'
where slug = 'sets-tecnicos-investimento-modelos-valorizam';

update blog_posts
set cover_image_prompt = 'Split studio still-life comparison: a large detailed 1:8 scale technical brick car model on the left side, a small die-cast metal miniature car model on the right side, symmetrical composition with a soft dividing shadow between them, warm dramatic studio lighting, black carbon-fiber background with gold accent rim light, premium automotive photography aesthetic, shallow depth of field, 16:9 aspect ratio'
where slug = 'sets-tecnicos-vs-miniaturas-die-cast';
