-- Studio 18 — expõe comprimento/altura/largura na view public_catalog, para
-- o site conseguir exibir as dimensões preenchidas no painel de gestão.
-- Rode no SQL Editor do Supabase.
--
-- CREATE OR REPLACE funciona aqui (sem precisar de DROP) porque as novas
-- colunas vão só no final da lista — nada muda de posição/nome.

create or replace view public_catalog as
select
  p.id,
  p.sku,
  p.name,
  p.category,
  p.brand_model,
  p.manufacturer,
  p.collection_tag,
  p.scale,
  p.piece_count,
  p.sale_price_brl,
  p.image_url,
  p.image_urls,
  p.automotive_history,
  p.dimensions,
  p.spec_highlights,
  p.length_cm,
  p.height_cm,
  p.width_cm,
  greatest(coalesce(s.quantity_in_stock, 0), 0) as quantity_available
from products p
left join product_stock s on s.product_id = p.id
where p.active = true;
