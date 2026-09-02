-- Corrige o image_url do Audi RS6 Avant (S18-018), caso o registro já
-- existisse antes da migration 061 rodar (com on conflict do nothing,
-- a imagem não teria sido setada).
update products set image_url = '/products/S18-018.jpg' where sku = 'S18-018';
