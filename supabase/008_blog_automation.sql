-- Automacao do blog: fila de temas editoriais + marcacao de artigos gerados
-- por IA, para o painel de gestao sinalizar quando ha um rascunho aguardando
-- aprovacao.

alter table blog_posts add column if not exists ai_generated boolean not null default false;

-- ---------------------------------------------------------------------------
-- Fila de temas (calendario editorial) — a function generate-blog-post
-- consome na ordem, marcando cada um como usado apos gerar o rascunho.
-- Mistura temas centrais (sets tecnicos, montagem, colecionismo) com temas
-- adjacentes (engenharia, design automotivo, presentes, decoracao) para
-- ampliar o alcance de SEO sem fugir do publico da marca.
-- ---------------------------------------------------------------------------
create table if not exists blog_topics (
  id uuid primary key default gen_random_uuid(),
  position int not null unique,
  topic text not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

alter table blog_topics enable row level security;

drop policy if exists "authenticated full access" on blog_topics;
create policy "authenticated full access" on blog_topics
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into blog_topics (position, topic) values
  (1, 'Guia completo: como escolher seu primeiro carro de blocos de montar em escala 1:8'),
  (2, 'Os mecanismos reais por trás de um set técnico: suspensão, câmbio e diferencial explicados'),
  (3, 'Quanto custa importar um set técnico sozinho vs. comprar pronta entrega no Brasil'),
  (4, 'Como cuidar e limpar seu set de blocos de montar montado'),
  (5, 'Sets técnicos vs. miniaturas de metal (die-cast): qual escolher para colecionar'),
  (6, 'A história da engenharia automotiva contada através de sets de montar'),
  (7, 'Como organizar e exibir sua coleção de carros de blocos de montar em casa'),
  (8, 'Por que montar um set técnico é uma forma de meditação e redução de estresse'),
  (9, 'Os supercarros mais icônicos já recriados em blocos de montar técnicos'),
  (10, 'Guia de presente: como escolher um set técnico para um colecionador'),
  (11, 'Motos de blocos de montar: por que a escala 1:5 é a preferida'),
  (12, 'O que considerar antes de comprar um set técnico usado ou de segunda mão'),
  (13, 'Como a Fórmula 1 inspira os sets técnicos de blocos de montar'),
  (14, 'Sets técnicos como hobby em família: montando com filhos e netos'),
  (15, 'Motores de blocos de montar: como funcionam os pistões e cilindros móveis'),
  (16, 'Do design ao produto final: como um set técnico é desenvolvido'),
  (17, 'Erros comuns de quem está começando a montar sets técnicos'),
  (18, 'Carros off-road e utilitários em blocos de montar: guia de modelos'),
  (19, 'Como a escala 1:8 se compara a 1:10 e 1:5 na hora de colecionar'),
  (20, 'Investimento ou hobby? O valor de revenda de sets técnicos premium'),
  (21, 'Ferramentas e acessórios que facilitam a montagem de sets técnicos'),
  (22, 'A psicologia do colecionismo: por que gostamos de montar e exibir'),
  (23, 'Bugatti, Pagani e Lamborghini: os fabricantes mais replicados em blocos técnicos'),
  (24, 'Como transformar a montagem de sets técnicos em um ritual de fim de semana'),
  (25, 'Sets técnicos como decoração de escritório: minimalismo com personalidade'),
  (26, 'O que fazer quando falta uma peça no seu set de blocos de montar'),
  (27, 'Carros clássicos vs. supercarros modernos: qual estilo colecionar primeiro'),
  (28, 'Como identificar um set técnico de qualidade antes de comprar'),
  (29, 'A comunidade de colecionadores de sets técnicos no Brasil: onde encontrar'),
  (30, 'Tendências para os próximos lançamentos de carros de blocos de montar')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Agendamento — roda a cada ~10 dias (dias 1, 11 e 21 de cada mes), chamando
-- a function generate-blog-post. Requer as extensoes pg_cron e pg_net
-- habilitadas no projeto (Database > Extensions no painel do Supabase).
--
-- IMPORTANTE: troque SEU_PROJECT_REF e SUA_SERVICE_ROLE_KEY pelos valores
-- reais do seu projeto antes de rodar este SQL. Nunca cometa esses valores
-- reais de volta no repositorio Git — preencha so aqui, direto no SQL
-- Editor do Supabase.
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'generate-blog-post-every-10-days',
  '0 9 1,11,21 * *',
  $$
  select net.http_post(
    url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/generate-blog-post',
    headers := jsonb_build_object(
      'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
