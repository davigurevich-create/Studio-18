-- Studio 18 — ficha técnica resumida (4 bullets) por modelo, exibida logo
-- abaixo da História Automotiva na página de produto do site.
-- Rode no SQL Editor do Supabase.

alter table products add column if not exists spec_highlights text[];

drop view if exists public_catalog;

create view public_catalog as
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
  greatest(coalesce(s.quantity_in_stock, 0), 0) as quantity_available
from products p
left join product_stock s on s.product_id = p.id
where p.active = true;

grant select on public_catalog to anon, authenticated;

update products set spec_highlights = array[
  'Motor V12 4.8L aspirado, 48 válvulas',
  'Potência: 455 cv',
  '0-100 km/h: 4,9 s',
  'Velocidade máxima: 295 km/h'
] where sku = 'S18-001';

update products set spec_highlights = array[
  'Motor boxer bicilíndrico 1.300cc ShiftCam',
  'Potência: 145 cv',
  'Peso em ordem de marcha: 237 kg',
  'Autonomia estimada: até 400 km por tanque'
] where sku = 'S18-002';

update products set spec_highlights = array[
  'Motor V8 biturbo híbrido 4.6L (LMDh)',
  'Potência combinada: ~680 cv',
  'Categoria: Hypercar LMDh — WEC e IMSA',
  'Pódios consecutivos em Le Mans desde a estreia'
] where sku = 'S18-003';

update products set spec_highlights = array[
  'Motor 6 cilindros em linha 3.0L biturbo (S58)',
  'Potência homologada GT4: ~431 cv',
  'Categoria: GT4 — endurance amador e semiprofissional',
  'Peso mínimo de competição: ~1.430 kg'
] where sku = 'S18-004';

update products set spec_highlights = array[
  'Motor V12 6.0L biturbo',
  'Potência: 864 cv',
  '0-100 km/h: 3,3 s',
  'Câmbio manual de 7 marchas disponível — raridade entre hypercars'
] where sku = 'S18-005';

update products set spec_highlights = array[
  'Motor V6 3.5L sobrealimentado',
  'Potência: 436 cv',
  'Peso: apenas 1.110 kg',
  '0-100 km/h: 3,2 s'
] where sku = 'S18-006';

update products set spec_highlights = array[
  'Motor rotativo Wankel 4 rotores (R26B)',
  'Potência: ~700 cv',
  'Marco histórico: único vencedor rotativo em Le Mans (1991)',
  'Rotação máxima: mais de 9.000 rpm'
] where sku = 'S18-007';

update products set spec_highlights = array[
  'Motor V12 aspirado',
  'Potência: 770 cv',
  'Tração integral (indicada pelo "-4")',
  'Aerodinâmica ativa para downforce em alta velocidade'
] where sku = 'S18-008';

update products set spec_highlights = array[
  'Motor V6 Nettuno 3.0L biturbo',
  'Potência: até 550 cv (versão Trofeo)',
  '0-100 km/h: 3,5 s',
  'Configuração 2+2 lugares com porta-malas de verdade'
] where sku = 'S18-009';

update products set spec_highlights = array[
  'Motor V6 1.6L turbo-híbrido',
  'Potência combinada: mais de 1.000 cv',
  'Peso mínimo com piloto: 798 kg',
  '0-100 km/h: menos de 2,6 s'
] where sku = 'S18-010';

update products set spec_highlights = array[
  'Motor V16 6.0L híbrido + 3 motores elétricos',
  'Potência combinada: 1.800 cv',
  '0-100 km/h: menos de 2 s',
  'Velocidade máxima: 445 km/h (limitada eletronicamente)'
] where sku = 'S18-011';

update products set spec_highlights = array[
  'Propulsão 100% elétrica com supercapacitores (conceito)',
  'Fibra de carbono autorreparável (tecnologia conceitual)',
  'Motores elétricos independentes em cada roda',
  'Um vislumbre do que a marca imagina para as próximas décadas'
] where sku = 'S18-012';

update products set spec_highlights = array[
  'Motor V6 3.8L biturbo VR38DETT',
  'Potência: 570+ cv com o kit Liberty Walk',
  'Tração integral ATTESA E-TS',
  'Kit widebody com alargamentos de até 10 cm por lado'
] where sku = 'S18-013';

update products set spec_highlights = array[
  'Motor V12 6.0L aspirado',
  'Potência: 660 cv',
  '0-100 km/h: 3,4 s',
  'Produção limitada: apenas 400 unidades'
] where sku = 'S18-014';

update products set spec_highlights = array[
  'Motor V8 4.0L biturbo híbrido + 3 motores elétricos',
  'Potência combinada: 1.030 cv',
  'Tração integral',
  '0-100 km/h: 2,3 s'
] where sku = 'S18-015';

update products set spec_highlights = array[
  'Motores turbodiesel e gasolina Ingenium disponíveis',
  'Tração integral permanente com Terrain Response',
  'Vau de até 900 mm de profundidade',
  'Capacidade para até 7 lugares'
] where sku = 'S18-016';

update products set spec_highlights = array[
  'Motor V12 6.5L aspirado',
  'Potência: 770 cv',
  'Recorde histórico em Nürburgring: 6min44s97 (carro de produção)',
  'Aerodinâmica ativa ALA 2.0'
] where sku = 'S18-017';
