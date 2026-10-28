-- Studio 18 — notificação no Telegram pra toda entrada nova na lista de
-- espera de reposição. A tabela é gravada direto pelo site (sem Edge
-- Function no meio), então o jeito de detectar isso é um trigger — mesmo
-- padrão usado em 107_notify_sale_status.sql. Rode no SQL Editor do
-- Supabase.
--
-- IMPORTANTE: troque SEU_PROJECT_REF e SUA_SERVICE_ROLE_KEY pelos valores
-- reais do seu projeto antes de rodar este bloco.

create extension if not exists pg_net with schema extensions;

create or replace function notify_new_waitlist_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/notify-new-waitlist-entry',
    headers := jsonb_build_object(
      'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('entryId', NEW.id)
  );
  return NEW;
end;
$$;

drop trigger if exists waitlist_notify_new_entry on restock_waitlist;
create trigger waitlist_notify_new_entry
  after insert on restock_waitlist
  for each row
  execute function notify_new_waitlist_entry();
