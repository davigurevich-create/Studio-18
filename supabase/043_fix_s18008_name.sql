-- Studio 18 — corrige o nome do S18-008: estava cadastrado como "770-4
-- Touro Furioso" / "Pagani Huayra", mas o produto real é o Lamborghini
-- Centenario (confirmado pela caixa/manual do fabricante). Rode no SQL
-- Editor do Supabase depois de já ter rodado 042_s18007_cover_and_gallery.sql.
update products
set name = 'Lamborghini Centenario',
    brand_model = 'Lamborghini Centenario'
where sku = 'S18-008';
