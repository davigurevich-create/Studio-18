-- Studio 18 — expõe o status do depoimento (se já foi enviado e se foi
-- aprovado) na função get_my_orders, pra área "Minha Conta" do site poder
-- mostrar um link "Deixar depoimento" nos pedidos entregues que ainda não
-- têm um, e o status de moderação nos que já têm.
-- Rode no SQL Editor do Supabase.

drop function if exists get_my_orders();

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
  items jsonb,
  testimonial_status text
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
    ) as items,
    t.status as testimonial_status
  from sales s
  left join testimonials t on t.sale_id = s.id
  where lower(s.customer_contact) = lower(auth.jwt() ->> 'email')
  order by s.sale_date desc;
$$;

grant execute on function get_my_orders() to authenticated;
