-- Studio 18 — geração de etiqueta de envio (Melhor Envio). Rode no SQL
-- Editor do Supabase, depois de já ter rodado 028_shipping.sql.

-- 1. Guarda o CPF e telefone do cliente no próprio pedido — hoje o CPF só
-- passava de raspão pelo checkout (usado no Mercado Pago e descartado) e o
-- telefone nem existia; ambos são exigidos pelo Melhor Envio pra gerar
-- etiqueta de verdade (destinatário).
alter table sales add column if not exists customer_cpf text;
alter table sales add column if not exists customer_phone text;

-- 2. ID numérico do serviço de frete escolhido na cotação (ex: 1 = Correios
-- PAC) — precisa ser reenviado igualzinho pro Melhor Envio na hora de
-- gerar a etiqueta de verdade, não dá pra usar só o nome/preço salvos.
alter table sales add column if not exists shipping_service_id text;

-- 3. Resultado da geração da etiqueta — preenchido pela function
-- generate-shipping-label depois que a equipe clica em "Gerar etiqueta"
-- no painel. Serve também de trava: se já tem shipping_label_url, a
-- function não gera (nem cobra) de novo.
alter table sales add column if not exists shipping_label_url text;
alter table sales add column if not exists shipping_tracking_code text;
alter table sales add column if not exists melhor_envio_order_id text;
