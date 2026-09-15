-- Studio 18 — renomeia o S18-001 de "Lamborghini LP5000" pra "Lamborghini
-- Countach" (LP5000 é só o nome da versão do motor do Countach, não do
-- carro). Rode no SQL Editor do Supabase.

update products
set name = 'Lamborghini Countach',
    brand_model = 'Lamborghini Countach'
where sku = 'S18-001';
