-- Studio 18 — corrige um problema sério: nenhum pedido feito pelo site
-- (PIX ou cartão) jamais descontou o estoque automaticamente, em nenhum
-- momento do fluxo (nem ao pagar, nem ao enviar). Só as vendas cadastradas
-- manualmente pela equipe no painel (+ Nova venda) davam baixa. Isso corrigiu
-- só de agora em diante (Edge Functions rede-create-payment,
-- rede-pix-webhook e check-pix-status) — esta migration acerta o passado,
-- lançando a saída retroativa de cada venda que já está paga/enviada/
-- entregue e nunca teve baixa registrada. Rode no SQL Editor do Supabase.

-- Bloco 1 — confira antes de aplicar: quantas vendas e quantas peças por
-- produto vão ser descontadas agora.
select
  p.sku,
  p.name,
  sum(si.quantity) as pecas_a_descontar,
  count(distinct s.id) as vendas_afetadas
from sales s
join sale_items si on si.sale_id = s.id
join products p on p.id = si.product_id
where s.status in ('pago', 'enviado', 'entregue')
  and not exists (
    select 1 from inventory_movements m
    where m.sale_id = s.id and m.type = 'saida'
  )
group by p.sku, p.name
order by pecas_a_descontar desc;

-- Bloco 2 — depois de conferir a lista acima, rode o backfill de verdade.
insert into inventory_movements (product_id, type, quantity, unit_cost_brl, container_id, sale_id, notes, moved_at)
select
  si.product_id,
  'saida',
  si.quantity,
  p.cost_price_brl,
  null,
  s.id,
  'Baixa retroativa — correção de vendas que não descontavam estoque automaticamente (migration 079)',
  s.sale_date
from sales s
join sale_items si on si.sale_id = s.id
join products p on p.id = si.product_id
where s.status in ('pago', 'enviado', 'entregue')
  and not exists (
    select 1 from inventory_movements m
    where m.sale_id = s.id and m.type = 'saida'
  );
