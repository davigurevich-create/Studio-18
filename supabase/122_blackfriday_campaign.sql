-- ---------------------------------------------------------------------------
-- Campanha de e-mail de Black Friday pra base de leads (pop-up de
-- boas-vindas). blackfriday_email_sent_at evita reenviar pra quem já
-- recebeu (idempotente — pode rodar o disparo de novo com segurança, só
-- manda pra quem ainda não recebeu); unsubscribed_at respeita quem clicar
-- em "descadastrar" no rodapé do e-mail.
-- ---------------------------------------------------------------------------
alter table leads add column if not exists blackfriday_email_sent_at timestamptz;
alter table leads add column if not exists unsubscribed_at timestamptz;
