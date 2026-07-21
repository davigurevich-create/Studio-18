-- Campo interno (nao exposto no site) com uma sugestao de prompt para gerar
-- a imagem de capa do artigo em qualquer gerador de imagem por IA (Midjourney,
-- DALL-E, etc). Preenchido automaticamente pelo generate-blog-post e tambem
-- editavel a mao no painel de gestao.
alter table blog_posts add column if not exists cover_image_prompt text;
