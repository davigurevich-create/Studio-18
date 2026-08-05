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
    visual_prompt: 'Cinematic close-up video shot of hands assembling a black and gold 1:8 scale technic model car kit piece by piece on a dark wooden workbench, warm dramatic side lighting, shallow depth of field, time-lapse style motion, premium studio product photography aesthetic, carbon-fiber textured background, no faces visible, 9:16 vertical aspect ratio',
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
    visual_prompt: 'Split-composition editorial image: left half a moody black-and-white photograph of a classic supercar in motion (generic, no logos or brand names), right half the same car reimagined as a black and gold 1:8 scale technic building block model kit on a dark studio background, dramatic warm rim lighting, premium automotive aesthetic, clean typography space at the top for a headline, 4:5 aspect ratio',
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
    visual_prompt: 'Macro close-up cinematic shot of hands opening a premium black product box with gold foil logo, unwrapping a technic model car kit, individual plastic bags of pieces and an instruction manual visible, warm dramatic lighting, shallow depth of field, dark carbon-fiber textured background, satisfying unboxing aesthetic, 9:16 vertical aspect ratio',
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
    visual_prompt: 'Vertical social media story template, dark carbon-black background with a subtle gold gear/emblem motif in one corner, large empty text space in the center for a question sticker, minimalist premium automotive brand aesthetic, thin gold accent line at the bottom, 9:16 aspect ratio',
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
    visual_prompt: 'Studio product photography of three black and gold 1:8 scale technic supercar model kits arranged side by side on a dark wooden table with warm dramatic lighting, one kit spotlighted with a subtle glow to suggest limited availability, clean space at the top for a headline, carbon-fiber textured background, 4:5 aspect ratio',
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
    visual_prompt: 'Warm, candid lifestyle photograph of a black and gold 1:8 scale technic supercar model kit displayed on a home shelf among books and personal items, soft natural window light, authentic non-staged feel, premium collector\'s room aesthetic, 4:5 aspect ratio',
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
    visual_prompt: 'Dynamic vertical video shot of a black and gold 1:8 scale technic supercar model kit with visible moving steering and suspension mechanisms, dramatic warm studio lighting against a dark carbon-fiber background, quick zoom-in on the moving parts, bold on-screen text space at the top, energetic premium automotive aesthetic, 9:16 aspect ratio',
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
    visual_prompt: 'Vertical video close-up of hands operating the functional steering wheel and suspension of a black and gold 1:8 scale technic model car, demonstrating real mechanical movement, dramatic warm lighting, dark studio background, direct-to-camera energetic framing with space at the top for reaction text, 9:16 aspect ratio',
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
    visual_prompt: 'Fast time-lapse vertical video of a technic model car kit being assembled from a pile of loose black and gold pieces into a complete black and gold 1:8 scale supercar, dramatic warm studio lighting, dark carbon-fiber background, motion blur on fast-moving hands, on-screen counter overlay space at the top, 9:16 aspect ratio',
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
    visual_prompt: 'Vertical documentary-style video of neatly organized warehouse shelves stocked with black premium product boxes with gold foil logos, hands picking and packing an order, warm natural lighting mixed with practical warehouse lighting, authentic behind-the-scenes small business aesthetic, 9:16 aspect ratio',
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
    visual_prompt: 'Fast-paced vertical video with three quick cuts, each showing a different black and gold 1:8 scale technic supercar model kit rotating on a dark studio turntable with dramatic warm lighting, bold price tag graphic overlay space in each cut, energetic premium automotive aesthetic, 9:16 aspect ratio',
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
    visual_prompt: 'Vertical video split-scene: one side shows a shipping container and warehouse stock in Brazil, the other side shows a black and gold 1:8 scale technic supercar model kit on a dark studio background with dramatic warm lighting, bold on-screen text space for a value-proposition headline, premium yet accessible automotive aesthetic, 9:16 aspect ratio',
  },
]

export const seedAuditLog: AuditLogEntry[] = []

export const seedExpenses: Expense[] = [
  { id: 'e1', expense_date: daysAgo(15), category: 'importacao', description: 'Compra do primeiro lote (fornecedor China)', amount_brl: 48000, container_id: 'c1', paid_by: 'Davi', recurrence: 'pontual', created_at: daysAgo(15) },
  { id: 'e2', expense_date: daysAgo(15), category: 'frete', description: 'Frete maritimo container CONT-2026-01', amount_brl: 18000, container_id: 'c1', paid_by: 'Rubens', recurrence: 'pontual', created_at: daysAgo(15) },
  { id: 'e3', expense_date: daysAgo(7), category: 'marketing', description: 'Criacao de site (Lovable) + trafego pago inicial', amount_brl: 3200, container_id: null, paid_by: 'Iwan', recurrence: 'mensal', created_at: daysAgo(7) },
  { id: 'e4', expense_date: daysAgo(3), category: 'operacional', description: 'Embalagens e etiquetas', amount_brl: 850, container_id: null, paid_by: 'Davi', recurrence: 'pontual', created_at: daysAgo(3) },
]
