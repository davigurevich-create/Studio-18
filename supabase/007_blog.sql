-- Blog do site: artigos curtos, geridos pelo painel de gestao (equipe
-- interna autenticada), exibidos publicamente no site so quando publicados.
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  cover_image_url text,
  content text not null,
  author text not null default 'Studio 18',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table blog_posts enable row level security;

create policy "authenticated full access" on blog_posts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- VIEW publica para o site consumir apenas artigos publicados, sem expor
-- rascunhos nem campos internos.
-- ---------------------------------------------------------------------------
drop view if exists public_blog_posts;

create view public_blog_posts as
select
  id,
  slug,
  title,
  excerpt,
  cover_image_url,
  content,
  author,
  published_at
from blog_posts
where published = true
order by published_at desc nulls last;

grant select on public_blog_posts to anon, authenticated;
