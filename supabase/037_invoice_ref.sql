-- Studio 18 — guarda a referência exata usada em cada tentativa de emissão
-- de nota. Rode no SQL Editor do Supabase depois de já ter rodado 036.
--
-- O Focus NFe reaproveita o XML já gerado quando reenviamos a mesma "ref"
-- (mesmo com o payload corrigido) — por isso agora cada tentativa nova usa
-- uma ref única, e guardamos ela aqui pra saber qual consultar quando o
-- status ainda estiver "processando".
alter table sales add column if not exists invoice_ref text;
