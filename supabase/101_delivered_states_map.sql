-- Studio 18 — expõe, de forma pública e anônima, só a LISTA de estados (UF)
-- onde já houve entrega de verdade (status='entregue') — nunca endereço,
-- nome de cliente ou qualquer outro dado da venda. Usado pela seção
-- "Contribuindo com coleções em X estados do Brasil" no site: busca os
-- estados nessa function toda vez que a home carrega, então atualiza
-- sozinho (sem precisar de nova migration) assim que uma venda nova mudar
-- de status pra "entregue" num estado ainda não presente.
-- Rode no SQL Editor do Supabase.

create or replace function get_delivered_states()
returns table (federal_unit text)
language sql
security definer
stable
set search_path = public
as $$
  select distinct upper(shipping_federal_unit) as federal_unit
  from sales
  where status = 'entregue'
    and shipping_federal_unit is not null
    and shipping_federal_unit <> '';
$$;

grant execute on function get_delivered_states() to anon;
