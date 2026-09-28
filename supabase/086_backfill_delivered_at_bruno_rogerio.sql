-- Studio 18 — preenche delivered_at pro Bruno e pro Rogério (entregas que
-- aconteceram antes da correção que passou a gravar essa data), com uma
-- data segura de 7 dias atrás — só pra destravar o gatilho do e-mail de
-- pedido de depoimento (que exige delivered_at preenchido e >= 5 dias).
-- A data exata não é usada em mais nada.
update sales
set delivered_at = now() - interval '7 days'
where id in (
  'e74b6424-c7d6-4da2-b578-c0acfee80c1b', -- Rogerio Cazelato
  '06d62a61-ea5b-451d-9101-8b778d698bc9'  -- Bruno Levi
)
and delivered_at is null;
