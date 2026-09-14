-- Studio 18 — recria só o registro necessário da venda de teste (Zero
-- Pulse, R$1) que tinha a nota fiscal de teste emitida, pra fazer o botão
-- "Cancelar nota" voltar a aparecer no painel (Vendas → Nota fiscal). Essa
-- venda tinha sido apagada em 071_revert_pix_live_test.sql, mas a nota
-- fiscal em si continua existindo de verdade na Focus NFe/SEFAZ — só
-- precisamos do registro local pra cancelar ela pela interface.
-- Dados extraídos do painel da Focus NFe (print do usuário).
-- Rode no SQL Editor do Supabase.
--
-- Depois de cancelar a nota pelo painel, pode apagar essa venda de novo
-- (fica um DELETE comentado no fim deste arquivo).

with nova_venda as (
  insert into sales (
    sale_date, channel, customer_name, customer_contact, customer_cpf, customer_phone,
    payment_method, status, shipping_cost_brl, discount_brl,
    shipping_street_name, shipping_street_number, shipping_complement, shipping_neighborhood,
    shipping_city, shipping_federal_unit, shipping_zip_code,
    invoice_status, invoice_ref, invoice_number, invoice_key, invoice_pdf_url,
    notes
  )
  values (
    '2026-09-09 11:16:00-03', 'site', 'Davi Gurevich', 'davi.gurevich@gmail.com', '51947204831', '11981008013',
    'pix', 'pago', 0, 0,
    'Rua Pedro Avancine', '363', 'Apto 32 bloco 1', 'Jardim Panorama',
    'São Paulo', 'SP', '05679160',
    'autorizada', 's18-c0e0b32d-4b49-4810-8aea-b16d0a1a4ee2-1788963360003', '1',
    'NFe3526096875347500019255001000000011215907242',
    'https://api.focusnfe.com.br/v2/nfe/s18-c0e0b32d-4b49-4810-8aea-b16d0a1a4ee2-1788963360003.pdf',
    'Registro recriado só pra permitir cancelar a nota fiscal de teste pelo painel (venda original apagada em 071)'
  )
  returning id
)
insert into sale_items (sale_id, product_id, quantity, unit_price_brl)
select nova_venda.id, products.id, 1, 1.00
from nova_venda, products
where products.sku = 'S18-019';

-- Depois de cancelar pela interface, rode isto pra apagar de vez
-- (ajuste o customer_contact se tiver mais de um pedido de teste com o
-- mesmo e-mail):
--
-- delete from sales
-- where customer_contact = 'davi.gurevich@gmail.com'
--   and invoice_ref = 's18-c0e0b32d-4b49-4810-8aea-b16d0a1a4ee2-1788963360003';
