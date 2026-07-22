import type {
  AuditLogEntry,
  BlogPost,
  Container,
  Expense,
  InventoryMovement,
  PartRequest,
  Product,
  RestockWaitlistEntry,
  Sale,
  SaleItem,
  SocialContentIdea,
} from '@/types/domain'

const now = new Date().toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

export const seedProducts: Product[] = []

export const seedContainers: Container[] = [
  {
    id: 'c1',
    code: 'CONT-2026-01',
    origin: 'China',
    status: 'em_transito',
    eta_date: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
    arrival_date: null,
    freight_cost_brl: 18000,
    customs_cost_brl: 6500,
    notes: 'Primeiro container - abertura da Studio 18',
    created_at: now,
  },
]

export const seedMovements: InventoryMovement[] = []

export const seedSales: Sale[] = []

export const seedSaleItems: SaleItem[] = []

export const seedBlogPosts: BlogPost[] = []

export const seedPartRequests: PartRequest[] = []

export const seedRestockWaitlist: RestockWaitlistEntry[] = []

export const seedSocialContentIdeas: SocialContentIdea[] = [
  {
    id: 'sc1',
    created_at: daysAgo(1),
    platform: 'instagram',
    format: 'reel',
    pillar: 'bastidores',
    title: 'Um fundador, um set, zero atalhos',
    script:
      'Roteiro: time-lapse das mãos montando um set peça por peça, cortes rápidos no ritmo da música. Texto na tela: "Testado peça por peça antes de chegar até você". Fecha com a logo Studio 18.\n\nLegenda: Antes de qualquer set chegar até você, um dos fundadores da Studio 18 monta ele peça por peça — sim, ele mesmo. Se travar, quebrar ou faltar peça, a gente descobre antes do cliente. É o nosso jeito de garantir que o que chega na sua casa é 100% funcional.',
    hashtags: '#studio18 #legotechnic #setstecnicos #miniaturasdecarros #colecionadorbr #carrosdemontagem',
    cta: 'Qual desses modelos você gostaria de ver sendo montado no próximo vídeo? Comenta aqui 👇',
    status: 'sugerido',
  },
  {
    id: 'sc2',
    created_at: daysAgo(1),
    platform: 'instagram',
    format: 'carrossel',
    pillar: 'educacao',
    title: 'Você sabia? A história real por trás do set',
    script:
      'Carrossel de 5-6 slides: slide 1 com a pergunta-gancho sobre o carro real (ex: Bugatti Tourbillon), slides 2-4 com curiosidades da história automotiva (usar o texto já cadastrado no produto), slide 5 revelando o set Studio 18 correspondente com preço e escala 1:8.',
    hashtags: '#studio18 #curiosidadesautomotivas #bugatti #carrostecnicos #escalacolecionavel #legomotors',
    cta: 'Qual carro você quer ver a história no próximo post? Comenta o modelo!',
    status: 'sugerido',
  },
  {
    id: 'sc3',
    created_at: daysAgo(1),
    platform: 'instagram',
    format: 'reel',
    pillar: 'produto',
    title: 'ASMR: o som de abrir uma caixa Studio 18',
    script:
      'Roteiro: closes no som de abrir a caixa oficial, manual sendo folheado, saco de peças sendo aberto. Sem fala, só o som ambiente com legenda. Última cena: set montado girando em 360°.',
    hashtags: '#studio18 #asmr #unboxing #legotechnic #ferrari #miniaturascolecionaveis',
    cta: 'Esse aqui já é seu favorito da coleção? Conta nos comentários.',
    status: 'sugerido',
  },
  {
    id: 'sc4',
    created_at: daysAgo(1),
    platform: 'instagram',
    format: 'stories',
    pillar: 'comunidade',
    title: 'Pergunte o que quiser sobre importação de sets técnicos',
    script:
      'Sequência de stories com caixa de perguntas ("Pergunte qualquer coisa"). Responder em vídeo curto dúvidas comuns: prazo de entrega, garantia, peça faltante, diferença entre fabricantes (CADA, GULY, REOBRIX, KBOX). Salvar como destaque "Perguntas".',
    hashtags: '#studio18 #perguntaseresp #importacaobrasil',
    cta: 'Manda sua pergunta na caixinha — vamos responder em vídeo!',
    status: 'sugerido',
  },
  {
    id: 'sc5',
    created_at: daysAgo(1),
    platform: 'instagram',
    format: 'carrossel',
    pillar: 'oferta',
    title: 'Radar de estoque: últimas unidades do lote atual',
    script:
      'Carrossel mostrando 3 modelos com estoque baixo no lote atual (puxar do painel de gestão). Slide final com CTA para lista de espera do site.',
    hashtags: '#studio18 #edicaolimitada #estoquelimitado #legotechnic #colecionadorbr',
    cta: 'De olho em algum desses? Essa pode ser sua última chance nesse lote — link na bio para entrar na lista de espera.',
    status: 'sugerido',
  },
  {
    id: 'sc6',
    created_at: daysAgo(1),
    platform: 'instagram',
    format: 'feed',
    pillar: 'comunidade',
    title: 'Repost de cliente: não é still de catálogo',
    script:
      'Post com foto/vídeo enviado por um cliente real do set montado na casa dele (com permissão). Formato simples, foto + legenda.',
    hashtags: '#studio18 #clientestudio18 #minhacolecao #legotechnic',
    cta: 'Marca a gente nos stories quando o seu chegar — queremos repostar! 📦🏁',
    status: 'sugerido',
  },
  {
    id: 'sc7',
    created_at: daysAgo(1),
    platform: 'tiktok',
    format: 'video',
    pillar: 'produto',
    title: 'Dava pra comprar um Lambo funcional parado no Brasil?',
    script:
      'Hook (0-3s): texto na tela "Você não sabia que dava pra ter um Lamborghini com peças que se movem de verdade, parado no Brasil". 3-10s: mostrar o set com direção/suspensão funcionando. 10-15s: preço aparece na tela + "link na bio".',
    hashtags: '#studio18 #lamborghini #legotechnic #carrosdemontagem #fy #brasil',
    cta: 'Link na bio pra ver esse modelo de perto.',
    status: 'sugerido',
  },
  {
    id: 'sc8',
    created_at: daysAgo(1),
    platform: 'tiktok',
    format: 'video',
    pillar: 'educacao',
    title: '"Isso realmente funciona ou é só decoração?"',
    script:
      'Formato resposta a comentário/dúvida comum. Gravar respondendo diretamente à pergunta, mostrando a direção, suspensão e câmbio funcionando de verdade no set. Tom direto, sem enrolação.',
    hashtags: '#studio18 #respondendo #legotechnic #curiosidade #brasil',
    cta: 'Ficou alguma dúvida? Comenta que a gente responde no próximo vídeo.',
    status: 'sugerido',
  },
  {
    id: 'sc9',
    created_at: daysAgo(1),
    platform: 'tiktok',
    format: 'video',
    pillar: 'bastidores',
    title: 'Time-lapse: 3.842 peças em 20 segundos',
    script:
      'Time-lapse acelerado da montagem completa de um set do início ao fim, com contador de peças subindo na tela em tempo real ("peça 214 de 3.842...") e música em alta no momento.',
    hashtags: '#studio18 #timelapse #legotechnic #satisfying #fy',
    cta: 'Assiste até o fim pra ver o resultado — vale muito a pena.',
    status: 'sugerido',
  },
  {
    id: 'sc10',
    created_at: daysAgo(1),
    platform: 'tiktok',
    format: 'video',
    pillar: 'bastidores',
    title: 'Um dia na vida de quem importa sets técnicos no Brasil',
    script:
      'Vlog curto mostrando o estoque físico real no Brasil (diferencial-chave da marca), separando pedidos, embalando — desmistificando o mito de "importado só chega depois de meses".',
    hashtags: '#studio18 #diaadia #empreendedorismo #importacao #brasil',
    cta: 'Segue pra acompanhar os bastidores da operação.',
    status: 'sugerido',
  },
  {
    id: 'sc11',
    created_at: daysAgo(1),
    platform: 'tiktok',
    format: 'video',
    pillar: 'produto',
    title: '3 sets que você não sabia que precisava',
    script:
      'Formato listicle rápido: 3 modelos diferentes em cortes de 2-3s cada, com nome e preço aparecendo na tela, música trend por trás.',
    hashtags: '#studio18 #legotechnic #precisodisso #colecionavel #fy',
    cta: 'Qual desses 3 você levaria primeiro? Comenta o número.',
    status: 'sugerido',
  },
  {
    id: 'sc12',
    created_at: daysAgo(1),
    platform: 'tiktok',
    format: 'video',
    pillar: 'oferta',
    title: 'Por que sets técnicos premium não precisam custar uma fortuna',
    script:
      'Gancho polêmico/educativo: falar sobre importação direta, sem intermediários, estoque físico no Brasil e entrega em poucos dias como motivo do preço mais justo comparado ao mercado.',
    hashtags: '#studio18 #precojusto #legotechnic #importacaodireta #brasil',
    cta: 'Link na bio pra ver a coleção completa.',
    status: 'sugerido',
  },
]

export const seedAuditLog: AuditLogEntry[] = []

export const seedExpenses: Expense[] = [
  { id: 'e1', expense_date: daysAgo(15), category: 'importacao', description: 'Compra do primeiro lote (fornecedor China)', amount_brl: 48000, container_id: 'c1', created_at: daysAgo(15) },
  { id: 'e2', expense_date: daysAgo(15), category: 'frete', description: 'Frete maritimo container CONT-2026-01', amount_brl: 18000, container_id: 'c1', created_at: daysAgo(15) },
  { id: 'e3', expense_date: daysAgo(7), category: 'marketing', description: 'Criacao de site (Lovable) + trafego pago inicial', amount_brl: 3200, container_id: null, created_at: daysAgo(7) },
  { id: 'e4', expense_date: daysAgo(3), category: 'operacional', description: 'Embalagens e etiquetas', amount_brl: 850, container_id: null, created_at: daysAgo(3) },
]
