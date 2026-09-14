-- Studio 18 — corrige o desconto contado em dobro em pedidos PIX já
-- registrados (mesmo bug corrigido no código da Edge Function
-- rede-create-payment). sale_items.unit_price_brl já sai com o desconto do
-- PIX embutido; sales.discount_brl deveria guardar só a parte do CUPOM (se
-- houver), não o desconto do PIX de novo — isso fazia o "Total" do painel
-- (e o valor de desconto enviado pra nota fiscal) ficar ~5% abaixo do que
-- foi realmente cobrado do cliente.
-- Rode no SQL Editor do Supabase.

-- BLOCO 1 — conferir antes: mostra o discount_brl atual (errado) e o
-- correto lado a lado, pra você comparar antes de aplicar.
select
  s.id,
  s.customer_name,
  s.discount_brl as discount_brl_atual,
  coalesce(
    case when s.coupon_code is not null then
      round(
        (select coalesce(sum(si.unit_price_brl * si.quantity), 0) from sale_items si where si.sale_id = s.id)
        * (select c.discount_pct from coupons c where lower(c.code) = lower(s.coupon_code)) / 100.0
      , 2)
    else 0 end
  , 0) as discount_brl_correto
from sales s
where s.payment_method = 'pix';

-- BLOCO 2 — aplica a correção em todos os pedidos PIX.
update sales s
set discount_brl = coalesce(
  case when s.coupon_code is not null then
    round(
      (select coalesce(sum(si.unit_price_brl * si.quantity), 0) from sale_items si where si.sale_id = s.id)
      * (select c.discount_pct from coupons c where lower(c.code) = lower(s.coupon_code)) / 100.0
    , 2)
  else 0 end
, 0)
where s.payment_method = 'pix';
