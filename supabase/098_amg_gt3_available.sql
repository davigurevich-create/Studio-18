-- Studio 18 — AMG GT3 (S18-022) deixa de ser só "placeholder" de teste de
-- demanda: conseguimos 1 unidade de verdade via troca direta com o
-- Rogério Toys (1 Maserati Gran Turismo + 1 Bugatti Tourbillon pelo AMG
-- GT3, sem dinheiro envolvido). Define o preço de venda, baixa os 2 sets
-- que saíram, dá entrada no AMG GT3 pelo custo real da troca (soma do
-- custo dos 2 sets entregues) e adiciona a história automotiva do modelo.
-- Rode no SQL Editor do Supabase.

-- Bloco 1 — confere estoque atual e custo dos 2 sets antes de baixar (pra
-- garantir que tem pelo menos 1 unidade de cada em estoque pra dar baixa).
select sku, name, cost_price_brl
from products
where sku in ('S18-009', 'S18-011');

update products
set
  sale_price_brl = 4190,
  automotive_history = 'O Mercedes-AMG GT3 nasceu da ambição da divisão de performance da Mercedes-Benz de dominar o automobilismo GT mundial. Apresentado em 2015, ele compartilha a base do GT de rua, mas é reconstruído do zero como um carro de corrida puro: motor V8 biturbo de 6.3 litros, aerodinâmica agressiva com a icônica asa traseira ajustável e uma suspensão desenvolvida para extrair o máximo de cada curva em pistas como Spa-Francorchamps e Nürburgring. Ao longo dos anos, o GT3 acumulou vitórias nas 24 Horas de Spa, no campeonato GT World Challenge e em dezenas de campeonatos regionais pelo mundo, tornando-se um dos carros GT3 mais vencedores da história recente — e um símbolo da filosofia "Affalterbach" de engenharia sem concessões. Este set técnico reproduz essa pedigree de pista em escala, com a mesma presença visual agressiva do carro real: a grade AMG, a asa traseira funcional e a pintura que remete às liveries de competição.'
where sku = 'S18-022';

-- Bloco 2 — baixa os 2 sets entregues na troca (saem do estoque, pelo
-- custo de cada um).
insert into inventory_movements (product_id, type, quantity, unit_cost_brl, notes, moved_at)
select id, 'saida', 1, cost_price_brl, 'Saída por troca direta com Rogério Toys — entregue em permuta pelo AMG GT3 (S18-022)', now()
from products
where sku in ('S18-009', 'S18-011');

-- Bloco 3 — dá entrada no AMG GT3, pelo custo real da troca (soma do custo
-- dos 2 sets entregues no Bloco 2).
insert into inventory_movements (product_id, type, quantity, unit_cost_brl, notes, moved_at)
select
  p.id,
  'entrada',
  1,
  (select coalesce(sum(cost_price_brl), 0) from products where sku in ('S18-009', 'S18-011')),
  'Entrada via troca direta com Rogério Toys — permuta por 1 Maserati Gran Turismo + 1 Bugatti Tourbillon',
  now()
from products p
where p.sku = 'S18-022';
