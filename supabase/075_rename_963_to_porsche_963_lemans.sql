-- Studio 18 — renomeia o S18-003 de "963 (Edição Limitada Cromada)" pra
-- "Porsche 963 LEMANS". Rode no SQL Editor do Supabase.

update products
set name = 'Porsche 963 LEMANS',
    brand_model = 'Porsche 963 LEMANS'
where sku = 'S18-003';
