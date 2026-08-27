-- Studio 18 — reseta a nota fiscal de teste do pedido do Davi (a NFC-e
-- antiga de homologação), pra poder testar a nova emissão como NF-e.
-- Rode no SQL Editor do Supabase. Ajuste o e-mail se quiser resetar um
-- pedido de teste diferente.

update sales
set invoice_status = 'nao_emitida',
    invoice_number = null,
    invoice_series = null,
    invoice_key = null,
    invoice_pdf_url = null,
    invoice_xml_url = null,
    invoice_error = null,
    invoice_ref = null
where customer_contact = 'davi.gurevich@gmail.com'
  and invoice_status = 'autorizada';
