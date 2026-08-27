-- Studio 18 — corrige notas fiscais já emitidas cuja URL do PDF/XML ficou
-- salva como caminho relativo (bug já corrigido no código, esse UPDATE só
-- conserta os registros que já existiam antes da correção).
-- Rode no SQL Editor do Supabase.

update sales
set invoice_pdf_url = 'https://homologacao.focusnfe.com.br' || invoice_pdf_url
where invoice_pdf_url is not null
  and invoice_pdf_url not like 'http%';

update sales
set invoice_xml_url = 'https://homologacao.focusnfe.com.br' || invoice_xml_url
where invoice_xml_url is not null
  and invoice_xml_url not like 'http%';
