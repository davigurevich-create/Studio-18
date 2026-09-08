-- Studio 18 — expõe o código de rastreio (gerado ao emitir a etiqueta) pro
-- cliente, tanto na área "Minha Conta" (get_my_orders) quanto na consulta
-- pública de pedido (get_order_status).
-- Rode no SQL Editor do Supabase.

-- Postgres não deixa mudar o formato de retorno (RETURNS TABLE) de uma
-- função com CREATE OR REPLACE — precisa apagar antes de recriar.
drop function if exists get_order_status(uuid, text);
drop function if exists get_my_orders();

create function get_order_status(order_id uuid, buyer_email text)
returns table (
  id uuid,
  sale_date timestamptz,
  status text,
  shipping_city text,
  shipping_federal_unit text,
  shipping_tracking_code text,
  shipping_service text,
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
    s.shipping_tracking_code,
    s.shipping_service,
    array_agg(p.name)
  from sales s
  join sale_items si on si.sale_id = s.id
  join products p on p.id = si.product_id
  where s.id = order_id
    and lower(s.customer_contact) = lower(buyer_email)
  group by s.id;
$$;

grant execute on function get_order_status(uuid, text) to anon;

create function get_my_orders()
returns table (
  id uuid,
  sale_date timestamptz,
  status text,
  payment_method text,
  shipping_city text,
  shipping_federal_unit text,
  shipping_zip_code text,
  shipping_street_name text,
  shipping_street_number text,
  shipping_complement text,
  shipping_neighborhood text,
  shipping_tracking_code text,
  shipping_service text,
  customer_name text,
  items jsonb
)
language sql
security definer
stable
set search_path = public
as $$
  select
    s.id,
    s.sale_date,
    s.status,
    s.payment_method,
    s.shipping_city,
    s.shipping_federal_unit,
    s.shipping_zip_code,
    s.shipping_street_name,
    s.shipping_street_number,
    s.shipping_complement,
    s.shipping_neighborhood,
    s.shipping_tracking_code,
    s.shipping_service,
    s.customer_name,
    coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'product_name', p.name,
          'quantity', si.quantity,
          'unit_price_brl', si.unit_price_brl
        ))
        from sale_items si
        join products p on p.id = si.product_id
        where si.sale_id = s.id
      ),
      '[]'::jsonb
    ) as items
  from sales s
  where lower(s.customer_contact) = lower(auth.jwt() ->> 'email')
  order by s.sale_date desc;
$$;

grant execute on function get_my_orders() to authenticated;
