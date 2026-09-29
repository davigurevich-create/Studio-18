-- Studio 18 — correção pontual: o Rogério escreveu o próprio sobrenome
-- errado ("Vazelato") no depoimento da BMW M4 GT4. Corrige só esse campo,
-- só nesse depoimento.

-- Bloco 1 — confere que é só essa 1 linha antes de alterar.
select id, customer_name, customer_email, product_names
from testimonials
where customer_email = 'rcazelato@icloud.com'
  and customer_name ilike '%vazelato%';

-- Bloco 2 — corrige.
update testimonials
set customer_name = replace(customer_name, 'Vazelato', 'Cazelato')
where customer_email = 'rcazelato@icloud.com'
  and customer_name ilike '%vazelato%';
