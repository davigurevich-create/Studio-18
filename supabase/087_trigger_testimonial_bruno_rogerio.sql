-- Studio 18 — dispara a function request-testimonials agora, pra mandar o
-- e-mail de pedido de depoimento pro Bruno e pro Rogério (já elegíveis
-- depois da migration 086), sem esperar o cron de amanhã às 10h.
-- IMPORTANTE: troque SEU_PROJECT_REF e SUA_SERVICE_ROLE_KEY pelos mesmos
-- valores reais que você já usou antes.
--
-- OBS: essa function processa TODOS os pedidos elegíveis de uma vez — se
-- houver algum outro pedido "entregue há 5+ dias" além desses dois, ele
-- também vai receber o e-mail agora (é o comportamento normal do cron).
select net.http_post(
  url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/request-testimonials',
  headers := jsonb_build_object(
    'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY',
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb
);
