-- Studio 18 — alerta de estoque baixo só a partir de 2 unidades.
-- Rode no SQL Editor do Supabase.
--
-- min_stock_alert era 3 (e o formulário de "novo produto" no painel
-- sugeria 5) — muda o padrão pra 2 (novos produtos) e atualiza todos os
-- produtos já cadastrados que ainda estavam no padrão antigo, sem mexer
-- em nenhum SKU que você já tenha ajustado manualmente pra um valor
-- diferente de 3 ou 5.

alter table products
  alter column min_stock_alert set default 2;

update products
set min_stock_alert = 2
where min_stock_alert in (3, 5);
