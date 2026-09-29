-- Studio 18 — guarda o(s) nome(s) do(s) produto(s) do pedido junto do
-- depoimento, pra poder mostrar "Colecionador de X" no site (e diferenciar
-- os depoimentos quando o mesmo cliente comprou sets diferentes em pedidos
-- separados, como o Rogério com a BMW M4 e o Pagani Utopia).
-- Guarda como uma cópia (não como referência via product_id) porque um
-- depoimento é um registro histórico — não deve mudar de rótulo se o
-- produto for renomeado ou removido do catálogo depois.
-- Rode no SQL Editor do Supabase.

alter table testimonials add column if not exists product_names text[];

update testimonials t
set product_names = (
  select array_agg(p.name order by p.name)
  from sale_items si
  join products p on p.id = si.product_id
  where si.sale_id = t.sale_id
)
where product_names is null;
