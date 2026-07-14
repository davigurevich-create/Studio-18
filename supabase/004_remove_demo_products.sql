-- Remove os 4 produtos de exemplo (fictícios, usados só para testar o dashboard
-- antes dos 17 modelos reais serem cadastrados) — não são produtos da Studio 18.
-- Rode no SQL Editor do Supabase.

delete from sale_items
where product_id in (
  select id from products where sku in ('S18-CAR-001', 'S18-CAR-002', 'S18-MOTO-001', 'S18-MOT-001')
);

-- inventory_movements é apagado automaticamente (on delete cascade) junto com o produto
delete from products
where sku in ('S18-CAR-001', 'S18-CAR-002', 'S18-MOTO-001', 'S18-MOT-001');
