-- Studio 18 — guarda o motivo quando a IA classifica uma notícia como
-- crítica pro negócio (ver function fetch-partner-news, que agora chama a
-- Anthropic pra julgar isso em vez de só palavra-chave). Rode no SQL
-- Editor do Supabase.

alter table partner_news add column if not exists critical_reason text;
