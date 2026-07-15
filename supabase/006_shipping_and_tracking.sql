-- Studio 18 — endereço de entrega em todo pedido + consulta pública de rastreio
-- Rode no SQL Editor do Supabase.

alter table sales
  add column if not exists shipping_zip_code text,
  add column if not exists shipping_street_name text,
  add column if not exists shipping_street_number text,
  add column if not exists shipping_neighborhood text,
  add column if not exists shipping_city text,
  add column if not exists shipping_federal_unit text,
  add column if not exists shipping_complement text;

-- Consulta pública de status de pedido: o cliente informa o número do
-- pedido (id) + e-mail usado na compra: só assim ele descobre o status.
-- Não expõe nenhuma outra venda nem dado de custo/estoque.
create or replace function get_order_status(order_id uuid, buyer_email text)
returns table (
  id uuid,
  sale_date timestamptz,
  status text,
  shipping_city text,
  shipping_federal_unit text,
  product_names text[]
)
language sql
security definer
set search_path = public
as $$
  select
    s.id,
    s.sale_date,
    s.status,
    s.shipping_city,
    s.shipping_federal_unit,
    array_agg(p.name)
  from sales s
  join sale_items si on si.sale_id = s.id
  join products p on p.id = si.product_id
  where s.id = order_id
    and lower(s.customer_contact) = lower(buyer_email)
  group by s.id;
$$;

grant execute on function get_order_status(uuid, text) to anon;
