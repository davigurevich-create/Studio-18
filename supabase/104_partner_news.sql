-- Studio 18 — aba "Notícias para os sócios": feed de notícias sobre
-- importação/exportação (tarifas, câmbio, protecionismo, eleição etc.),
-- capturado automaticamente, com espaço pros sócios (Davi, Rubens, Iwan)
-- registrarem insights. Restrito a staff — nunca aparece pro cliente.
-- Rode no SQL Editor do Supabase.

-- ---------------------------------------------------------------------------
-- 1. Notícias capturadas (automaticamente via cron + manualmente pelos sócios)
-- ---------------------------------------------------------------------------
create table if not exists partner_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null unique,
  source text,
  summary text,
  published_at timestamptz,
  topics text[] not null default '{}',
  is_critical boolean not null default false,
  added_by text, -- null = capturado pelo robô; e-mail do sócio quando adicionado manualmente
  created_at timestamptz not null default now()
);

alter table partner_news enable row level security;

create policy "staff full access to partner_news" on partner_news
  for all using (is_staff()) with check (is_staff());

-- A function de captura roda com a service role (sem um usuário staff
-- autenticado por trás) — sem policy extra pra ela, porque service role
-- sempre ignora RLS.

create index if not exists partner_news_published_at_idx on partner_news (published_at desc);

-- ---------------------------------------------------------------------------
-- 2. Insights dos sócios em cada notícia (thread simples)
-- ---------------------------------------------------------------------------
create table if not exists partner_news_comments (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null references partner_news(id) on delete cascade,
  author_email text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table partner_news_comments enable row level security;

create policy "staff full access to partner_news_comments" on partner_news_comments
  for all using (is_staff()) with check (is_staff());

create index if not exists partner_news_comments_news_id_idx on partner_news_comments (news_id);

-- ---------------------------------------------------------------------------
-- 3. Agendamento — chama a function fetch-partner-news 3x por dia (8h, 13h,
-- 19h), que varre o Google News RSS por buscas genéricas de comércio
-- exterior/importação/exportação e grava as notícias novas (sem duplicar).
-- Requer pg_cron/pg_net já habilitados (mesma extensão usada em
-- 065_delivery_status_automation.sql).
--
-- IMPORTANTE: troque SEU_PROJECT_REF e SUA_SERVICE_ROLE_KEY pelos valores
-- reais do seu projeto antes de rodar este bloco. Nunca cometa esses
-- valores reais de volta no repositório Git.
select cron.schedule(
  'fetch-partner-news-3x-daily',
  '0 8,13,19 * * *',
  $$
  select net.http_post(
    url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/fetch-partner-news',
    headers := jsonb_build_object(
      'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ---------------------------------------------------------------------------
-- 4. Cotações (dólar, yuan, petróleo Brent) — uma única linha sempre
-- sobrescrita com o valor mais recente. O painel lê essa tabela (rápido,
-- sem limite de requisição), e quem busca de verdade nas fontes externas é
-- a function refresh-market-rates, agendada à parte.
-- ---------------------------------------------------------------------------
create table if not exists market_rates_snapshot (
  id text primary key default 'latest',
  usd_brl numeric,
  cny_brl numeric,
  brent_usd numeric,
  updated_at timestamptz not null default now()
);

alter table market_rates_snapshot enable row level security;

create policy "staff can view market_rates_snapshot" on market_rates_snapshot
  for select using (is_staff());

-- Sem policy de insert/update pra staff — só a service role (dentro da
-- function refresh-market-rates) escreve aqui.

insert into market_rates_snapshot (id) values ('latest') on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Agendamento — chama refresh-market-rates a cada 15 minutos.
--
-- IMPORTANTE: troque SEU_PROJECT_REF e SUA_SERVICE_ROLE_KEY pelos valores
-- reais do seu projeto antes de rodar este bloco.
-- ---------------------------------------------------------------------------
select cron.schedule(
  'refresh-market-rates-15min',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/refresh-market-rates',
    headers := jsonb_build_object(
      'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
