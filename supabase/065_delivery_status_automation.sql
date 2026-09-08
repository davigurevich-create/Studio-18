-- Studio 18 — atualiza sozinho o status do pedido pra "entregue" quando a
-- Melhor Envio confirma a entrega, chamando periodicamente a function
-- refresh-delivery-status.
--
-- Requer as extensões pg_cron e pg_net habilitadas no projeto (Database >
-- Extensions no painel do Supabase) — provavelmente já estão, se você rodou
-- a 008_blog_automation.sql antes.
--
-- IMPORTANTE: troque SEU_PROJECT_REF e SUA_SERVICE_ROLE_KEY pelos valores
-- reais do seu projeto antes de rodar este SQL. Nunca cometa esses valores
-- reais de volta no repositório Git — preencha só aqui, direto no SQL
-- Editor do Supabase.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- A cada 6 horas — entrega não é algo que muda minuto a minuto, então não
-- precisa consultar com mais frequência que isso.
select cron.schedule(
  'refresh-delivery-status-every-6h',
  '0 */6 * * *',
  $$
  select net.http_post(
    url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/refresh-delivery-status',
    headers := jsonb_build_object(
      'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
