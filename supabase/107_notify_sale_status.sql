-- Studio 18 — notificação no Telegram pra qualquer venda nova ou mudança de
-- status (pago, enviado, entregue, cancelado/recusado) — não só "pago",
-- pra dar visibilidade também de tentativas que não deram certo (cartão
-- recusado, Pix que nunca foi pago). Rode no SQL Editor do Supabase.
--
-- Usa um trigger em vez de mexer em cada Edge Function que já muda o
-- status (rede-create-payment, check-pix-status, rede-pix-webhook,
-- generate-shipping-label, refresh-delivery-status, e a edição manual no
-- painel) — um único ponto cobre todos os caminhos atuais e futuros, sem
-- precisar lembrar de adicionar a notificação em cada lugar novo.
--
-- IMPORTANTE: troque SEU_PROJECT_REF e SUA_SERVICE_ROLE_KEY pelos valores
-- reais do seu projeto antes de rodar este bloco. Nunca cometa esses
-- valores reais de volta no repositório Git.

create extension if not exists pg_net with schema extensions;

create or replace function notify_sale_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' or (TG_OP = 'UPDATE' and OLD.status is distinct from NEW.status) then
    perform net.http_post(
      url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/notify-sale-status',
      headers := jsonb_build_object(
        'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'saleId', NEW.id,
        'status', NEW.status,
        'previousStatus', case when TG_OP = 'INSERT' then null else OLD.status end,
        'isNew', TG_OP = 'INSERT'
      )
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists sales_notify_status_change on sales;
create trigger sales_notify_status_change
  after insert or update of status on sales
  for each row
  execute function notify_sale_status_change();
