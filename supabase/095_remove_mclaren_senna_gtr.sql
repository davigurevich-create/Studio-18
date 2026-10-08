-- Studio 18 — remove o McLaren Senna GTR (S18-020) de vez: era um
-- "placeholder" criado só pra medir interesse (migration 061, zero
-- estoque, sem preço definido ainda) — sem demanda, e não vai entrar no
-- próximo container. Remove do site (público_catalog), do estoque e de
-- qualquer lista de espera/favorito associado.
-- Rode no SQL Editor do Supabase.

-- Bloco 1 — confere que não tem nenhuma venda de verdade desse produto
-- antes de apagar (se aparecer alguma linha aqui, PARE e me avise antes de
-- rodar o Bloco 2 — a remoção falharia de qualquer forma por segurança,
-- mas é bom saber o motivo).
select s.id as sale_id, s.sale_date, s.customer_name, si.quantity, si.unit_price_brl
from sale_items si
join sales s on s.id = si.sale_id
join products p on p.id = si.product_id
where p.sku = 'S18-020';

-- Bloco 2 — apaga o produto (lista de espera e favoritos associados vão
-- junto, é cascade). Se existir alguma venda de verdade (Bloco 1 não
-- vazio), isso vai dar erro de "violates foreign key constraint" em vez de
-- apagar — nesse caso, me chama antes de continuar.
delete from products
where sku = 'S18-020';
