-- Studio 18 — renomeia "Motor detalhado" para "Motor funcional" nos
-- produtos de motor já criados (caso você já tenha rodado a 058 antes
-- dessa correção). Seguro rodar mesmo que a 058 ainda não tenha rodado —
-- simplesmente não encontra nada pra atualizar.
update products
set name = replace(name, 'Motor detalhado — ', 'Motor funcional — ')
where sku like '%-MOTOR' and name like 'Motor detalhado — %';
