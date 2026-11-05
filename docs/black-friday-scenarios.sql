-- Studio 18 — simulação Black Friday: 25% cartão (até 6x s/ juros) / 30% PIX
-- Somente leitura (SELECT). Rode no SQL Editor do Supabase.
-- Usa product_stock (estoque atual) + cost_price_brl + sale_price_brl.
-- Ajuste os parâmetros no bloco "params".

with params as (
  select
    0.25::numeric as desc_cartao,      -- desconto no cartão (até 6x sem juros)
    0.30::numeric as desc_pix,         -- desconto no PIX à vista
    0.80::numeric as mix_cartao,       -- % das unidades vendidas no cartão
    0.035::numeric as taxa_cartao,     -- taxa da adquirente (MDR) — CONFIRMAR com a Rede
    0.0::numeric  as taxa_pix,         -- taxa PIX — CONFIRMAR com a Rede
    0.0::numeric  as imposto,          -- % imposto s/ receita (ex.: Simples) — CONFIRMAR
    0.0::numeric  as custo_envio_un    -- frete absorvido por unidade (R$) — CONFIRMAR
),
cenarios as (
  select * from (values (1, 0.40::numeric), (2, 0.60::numeric), (3, 0.80::numeric)) as c(cenario, pct_vendido)
),
base as (
  select s.sku, s.name, s.quantity_in_stock as estoque,
         s.cost_price_brl as custo, s.sale_price_brl as preco
  from product_stock s
  join products p on p.id = s.product_id
  where p.active and s.quantity_in_stock > 0
),
calc as (
  select
    c.cenario, c.pct_vendido, b.sku, b.name, b.custo, b.preco,
    b.estoque * c.pct_vendido                         as un_vendidas,
    b.estoque * c.pct_vendido * pr.mix_cartao         as un_cartao,
    b.estoque * c.pct_vendido * (1 - pr.mix_cartao)   as un_pix,
    pr.*
  from base b cross join cenarios c cross join params pr
),
resumo as (
  select
    cenario, pct_vendido,
    sum(un_vendidas)                                              as unidades,
    sum(un_cartao * preco * (1 - desc_cartao)
      + un_pix    * preco * (1 - desc_pix))                       as fat_bruto,
    sum(un_cartao * preco * (1 - desc_cartao) * taxa_cartao
      + un_pix    * preco * (1 - desc_pix)    * taxa_pix)         as taxas,
    sum((un_cartao * preco * (1 - desc_cartao)
       + un_pix    * preco * (1 - desc_pix)) * imposto)           as impostos,
    sum(un_vendidas * custo)                                      as cpv,
    sum(un_vendidas * custo_envio_un)                             as frete,
    sum(un_vendidas * preco)                                      as fat_preco_cheio
  from calc group by cenario, pct_vendido
)
select
  cenario, pct_vendido, round(unidades, 1) as unidades,
  round(fat_preco_cheio, 2)                                  as fat_a_preco_cheio,
  round(fat_bruto, 2)                                        as fat_com_desconto,
  round(fat_bruto - taxas - impostos, 2)                     as fat_liquido,
  round(cpv, 2)                                              as custo_produtos,
  round(fat_bruto - taxas - impostos - cpv - frete, 2)       as lucro,
  round(100 * (fat_bruto - taxas - impostos - cpv - frete)
        / nullif(fat_bruto - taxas - impostos, 0), 1)        as margem_pct,
  round(100 * (fat_bruto - taxas - impostos - cpv - frete)
        / nullif(cpv, 0), 1)                                 as retorno_s_custo_pct
from resumo order by cenario;

-- Conferência por SKU (custo x preço com desconto): quem dá prejuízo no PIX (30%)?
-- select sku, name, custo, preco,
--        round(preco*0.75,2) as preco_cartao, round(preco*0.70,2) as preco_pix,
--        round(preco*0.70 - custo,2) as lucro_un_pix
-- from (select s.sku, s.name, s.cost_price_brl custo, s.sale_price_brl preco
--       from product_stock s) t order by lucro_un_pix;
