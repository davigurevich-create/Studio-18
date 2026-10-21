-- Studio 18 — primeiro e-mail da sequência de nutrição de leads: a
-- mensagem pessoal do Rubens (não o cupom automático, que já é enviado na
-- hora pelo submit-lead). Marca quando cada lead recebeu essa mensagem,
-- pra function send-lead-welcome-email não mandar duas vezes.
-- Rode no SQL Editor do Supabase.

alter table leads add column if not exists welcome_personal_email_sent_at timestamptz;

-- Agendamento — chama a function send-lead-welcome-email 1x por dia. Ela
-- manda a mensagem pessoal pros leads com 1+ dia desde o cadastro que ainda
-- não a receberam (inclui de uma vez só o backlog de leads antigos, já que
-- é a primeira vez que essa function roda).
--
-- IMPORTANTE: troque SEU_PROJECT_REF e SUA_SERVICE_ROLE_KEY pelos valores
-- reais do seu projeto antes de rodar este bloco. Nunca cometa esses
-- valores reais de volta no repositório Git.
select cron.schedule(
  'send-lead-welcome-email-daily',
  '0 14 * * *',
  $$
  select net.http_post(
    url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/send-lead-welcome-email',
    headers := jsonb_build_object(
      'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
