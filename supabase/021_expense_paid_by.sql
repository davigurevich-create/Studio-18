-- Studio 18 — adiciona o responsável pelo pagamento de cada despesa, para
-- identificar quem (qual sócio) realizou cada pagamento. Rode no SQL Editor
-- do Supabase.
alter table expenses add column if not exists paid_by text;
