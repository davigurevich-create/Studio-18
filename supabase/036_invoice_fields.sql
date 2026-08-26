-- Studio 18 — campos para emissão de nota fiscal (NFC-e via Focus NFe).
-- Rode no SQL Editor do Supabase depois de já ter rodado 035.

-- 1. NCM de cada produto — classificação fiscal obrigatória em toda nota.
-- Fica NULL até você confirmar com seu contador; a function emit-invoice
-- recusa emitir nota de um pedido com item sem NCM cadastrado, com erro
-- claro apontando qual SKU falta.
alter table products add column if not exists ncm text;

-- Expõe o NCM na view de estoque, pra poder editar na aba Estoque do
-- painel (mesmo truque de sempre: coluna nova vai no final do select).
create or replace view product_stock as
select
  p.id as product_id,
  p.sku,
  p.name,
  p.category,
  p.manufacturer,
  p.min_stock_alert,
  p.cost_price_brl,
  p.sale_price_brl,
  p.length_cm,
  p.height_cm,
  p.width_cm,
  coalesce(sum(case when m.type = 'entrada' then m.quantity
                     when m.type = 'ajuste' then m.quantity
                     else 0 end), 0)
  - coalesce(sum(case when m.type = 'saida' then m.quantity else 0 end), 0)
    as quantity_in_stock,
  p.piece_count,
  p.ncm
from products p
left join inventory_movements m on m.product_id = p.id
group by p.id, p.sku, p.name, p.category, p.manufacturer, p.min_stock_alert, p.cost_price_brl, p.sale_price_brl,
  p.length_cm, p.height_cm, p.width_cm, p.piece_count, p.ncm;

-- 2. Estado da nota fiscal de cada pedido.
alter table sales add column if not exists invoice_status text
  default 'nao_emitida'
  check (invoice_status in ('nao_emitida', 'processando', 'autorizada', 'erro', 'cancelada'));
alter table sales add column if not exists invoice_number text;
alter table sales add column if not exists invoice_series text;
-- Chave de acesso da NFC-e (44 dígitos) — usada tanto pra conferência do
-- cliente quanto no campo options.invoice.key da etiqueta do Melhor Envio,
-- que é o que destrava o seguro acima de R$1.000 num envio comercial.
alter table sales add column if not exists invoice_key text;
alter table sales add column if not exists invoice_pdf_url text;
alter table sales add column if not exists invoice_xml_url text;
alter table sales add column if not exists invoice_error text;
