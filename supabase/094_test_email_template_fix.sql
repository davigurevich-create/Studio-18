-- Studio 18 — teste pontual do template de e-mail corrigido (tabela em vez
-- de div, pra funcionar certo no Outlook), mandando pra
-- rubens@brasilopenbadge.com.br via request-testimonials. Rode no SQL
-- Editor do Supabase, bloco por bloco, nessa ordem.

-- Bloco 1 — cria um pedido de teste "entregue há 6 dias". ANOTE o "id" que
-- aparecer no resultado — vai precisar dele no Bloco 3.
with nova_venda as (
  insert into sales (
    sale_date, channel, customer_name, customer_contact,
    status, delivered_at, testimonial_requested_at,
    shipping_cost_brl, discount_brl
  )
  values (
    now() - interval '10 days', 'site', 'Rubens Gurevich', 'rubens@brasilopenbadge.com.br',
    'entregue', now() - interval '6 days', null,
    0, 0
  )
  returning id
),
item as (
  insert into sale_items (sale_id, product_id, quantity, unit_price_brl)
  select nova_venda.id, products.id, 1, 1.00
  from nova_venda, products
  where products.sku = 'S18-001'
  returning sale_id
)
select id as sale_id_de_teste from nova_venda;

-- Bloco 2 — dispara a function AGORA, sem esperar o cron de amanhã.
-- IMPORTANTE: troque SEU_PROJECT_REF e SUA_SERVICE_ROLE_KEY pelos mesmos
-- valores reais que você já usou antes.
select net.http_post(
  url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/request-testimonials',
  headers := jsonb_build_object(
    'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY',
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb
);

-- Bloco 3 — depois de confirmar que o e-mail chegou certinho no Outlook do
-- Rubens, apaga o pedido de teste (sale_items vai junto, é cascade). Troque
-- SALE_ID_DE_TESTE pelo id que você anotou no Bloco 1.
delete from sales
where id = 'SALE_ID_DE_TESTE';
