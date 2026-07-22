-- Studio 18 — motor de conteúdo para redes sociais (Instagram e TikTok).
-- Guarda sugestões de posts/vídeos prontas para produção, com um fluxo de
-- status simples (sugerido -> em produção -> publicado). Uso interno da
-- equipe apenas — não é exposto no site. Rode no SQL Editor do Supabase.

create table if not exists social_content_ideas (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('instagram', 'tiktok')),
  format text not null,
  pillar text not null,
  title text not null,
  script text not null,
  hashtags text,
  cta text,
  status text not null default 'sugerido' check (status in ('sugerido', 'em_producao', 'publicado')),
  created_at timestamptz not null default now()
);

alter table social_content_ideas enable row level security;

drop policy if exists "authenticated full access" on social_content_ideas;
create policy "authenticated full access" on social_content_ideas
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Coletânea inicial — 12 sugestões prontas (6 Instagram + 6 TikTok) para
-- popular as redes do zero, cobrindo os 5 pilares de conteúdo da marca:
-- bastidores, educação automotiva, produto em destaque, comunidade/prova
-- social e novidades/estoque.
-- ---------------------------------------------------------------------------
insert into social_content_ideas (platform, format, pillar, title, script, hashtags, cta) values

-- INSTAGRAM ------------------------------------------------------------------
(
  'instagram', 'reel', 'bastidores',
  'Um fundador, um set, zero atalhos',
  'Roteiro: time-lapse das mãos montando um set peça por peça, cortes rápidos no ritmo da música. Texto na tela: "Testado peça por peça antes de chegar até você". Fecha com a logo Studio 18.' || chr(10) || chr(10) ||
  'Legenda: Antes de qualquer set chegar até você, um dos fundadores da Studio 18 monta ele peça por peça — sim, ele mesmo. Se travar, quebrar ou faltar peça, a gente descobre antes do cliente. É o nosso jeito de garantir que o que chega na sua casa é 100% funcional.',
  '#studio18 #legotechnic #setstecnicos #miniaturasdecarros #colecionadorbr #carrosdemontagem',
  'Qual desses modelos você gostaria de ver sendo montado no próximo vídeo? Comenta aqui 👇'
),
(
  'instagram', 'carrossel', 'educacao',
  'Você sabia? A história real por trás do set',
  'Carrossel de 5-6 slides: slide 1 com a pergunta-gancho sobre o carro real (ex: Bugatti Tourbillon), slides 2-4 com curiosidades da história automotiva (usar o texto já cadastrado no produto), slide 5 revelando o set Studio 18 correspondente com preço e escala 1:8.',
  '#studio18 #curiosidadesautomotivas #bugatti #carrostecnicos #escalacolecionavel #legomotors',
  'Qual carro você quer ver a história no próximo post? Comenta o modelo!'
),
(
  'instagram', 'reel', 'produto',
  'ASMR: o som de abrir uma caixa Studio 18',
  'Roteiro: closes no som de abrir a caixa oficial, manual sendo folheado, saco de peças sendo aberto. Sem fala, só o som ambiente com legenda. Última cena: set montado girando em 360°.',
  '#studio18 #asmr #unboxing #legotechnic #ferrari #miniaturascolecionaveis',
  'Esse aqui já é seu favorito da coleção? Conta nos comentários.'
),
(
  'instagram', 'stories', 'comunidade',
  'Pergunte o que quiser sobre importação de sets técnicos',
  'Sequência de stories com caixa de perguntas ("Pergunte qualquer coisa"). Responder em vídeo curto dúvidas comuns: prazo de entrega, garantia, peça faltante, diferença entre fabricantes (CADA, GULY, REOBRIX, KBOX). Salvar como destaque "Perguntas".',
  '#studio18 #perguntaseresp #importacaobrasil',
  'Manda sua pergunta na caixinha — vamos responder em vídeo!'
),
(
  'instagram', 'carrossel', 'oferta',
  'Radar de estoque: últimas unidades do lote atual',
  'Carrossel mostrando 3 modelos com estoque baixo no lote atual (puxar do painel de gestão). Slide final com CTA para lista de espera do site.',
  '#studio18 #edicaolimitada #estoquelimitado #legotechnic #colecionadorbr',
  'De olho em algum desses? Essa pode ser sua última chance nesse lote — link na bio para entrar na lista de espera.'
),
(
  'instagram', 'feed', 'comunidade',
  'Repost de cliente: não é still de catálogo',
  'Post com foto/vídeo enviado por um cliente real do set montado na casa dele (com permissão). Formato simples, foto + legenda.',
  '#studio18 #clientestudio18 #minhacolecao #legotechnic',
  'Marca a gente nos stories quando o seu chegar — queremos repostar! 📦🏁'
),

-- TIKTOK ---------------------------------------------------------------------
(
  'tiktok', 'video', 'produto',
  'Dava pra comprar um Lambo funcional parado no Brasil?',
  'Hook (0-3s): texto na tela "Você não sabia que dava pra ter um Lamborghini com peças que se movem de verdade, parado no Brasil". 3-10s: mostrar o set com direção/suspensão funcionando. 10-15s: preço aparece na tela + "link na bio".',
  '#studio18 #lamborghini #legotechnic #carrosdemontagem #fy #brasil',
  'Link na bio pra ver esse modelo de perto.'
),
(
  'tiktok', 'video', 'educacao',
  '"Isso realmente funciona ou é só decoração?"',
  'Formato resposta a comentário/dúvida comum. Gravar respondendo diretamente à pergunta, mostrando a direção, suspensão e câmbio funcionando de verdade no set. Tom direto, sem enrolação.',
  '#studio18 #respondendo #legotechnic #curiosidade #brasil',
  'Ficou alguma dúvida? Comenta que a gente responde no próximo vídeo.'
),
(
  'tiktok', 'video', 'bastidores',
  'Time-lapse: 3.842 peças em 20 segundos',
  'Time-lapse acelerado da montagem completa de um set do início ao fim, com contador de peças subindo na tela em tempo real ("peça 214 de 3.842...") e música em alta no momento.',
  '#studio18 #timelapse #legotechnic #satisfying #fy',
  'Assiste até o fim pra ver o resultado — vale muito a pena.'
),
(
  'tiktok', 'video', 'bastidores',
  'Um dia na vida de quem importa sets técnicos no Brasil',
  'Vlog curto mostrando o estoque físico real no Brasil (diferencial-chave da marca), separando pedidos, embalando — desmistificando o mito de "importado só chega depois de meses".',
  '#studio18 #diaadia #empreendedorismo #importacao #brasil',
  'Segue pra acompanhar os bastidores da operação.'
),
(
  'tiktok', 'video', 'produto',
  '3 sets que você não sabia que precisava',
  'Formato listicle rápido: 3 modelos diferentes em cortes de 2-3s cada, com nome e preço aparecendo na tela, música trend por trás.',
  '#studio18 #legotechnic #precisodisso #colecionavel #fy',
  'Qual desses 3 você levaria primeiro? Comenta o número.'
),
(
  'tiktok', 'video', 'oferta',
  'Por que sets técnicos premium não precisam custar uma fortuna',
  'Gancho polêmico/educativo: falar sobre importação direta, sem intermediários, estoque físico no Brasil e entrega em poucos dias como motivo do preço mais justo comparado ao mercado.',
  '#studio18 #precojusto #legotechnic #importacaodireta #brasil',
  'Link na bio pra ver a coleção completa.'
);
