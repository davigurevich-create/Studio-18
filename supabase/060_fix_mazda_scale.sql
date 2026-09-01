-- Studio 18 — corrige a escala do Mazda Le Mans Rally 787B: é 1:10, não 1:8.
update products set scale = '1:10' where sku = 'S18-007';
