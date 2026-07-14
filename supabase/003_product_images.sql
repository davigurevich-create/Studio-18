-- Studio 18 — imagens padronizadas dos 17 sets (fundo em gradiente carbono/dourado)
-- Rode no SQL Editor do Supabase depois do deploy do site com as imagens em
-- site/public/products/S18-0XX.jpg

update products set image_url = '/products/' || sku || '.jpg'
where sku in (
  'S18-001','S18-002','S18-003','S18-004','S18-005','S18-006','S18-007','S18-008','S18-009',
  'S18-010','S18-011','S18-012','S18-013','S18-014','S18-015','S18-016','S18-017'
);
