-- ---------------------------------------------------------------------------
-- Segunda campanha de Black Friday (lembrete de reta final) — coluna
-- própria, separada de blackfriday_email_sent_at (122), pra poder mandar
-- as duas campanhas pra mesma pessoa sem duplicar nenhuma delas.
-- ---------------------------------------------------------------------------
alter table leads add column if not exists blackfriday_lastdays_email_sent_at timestamptz;
