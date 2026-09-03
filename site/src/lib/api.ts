import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { mockCatalog } from '@/lib/mockCatalog'
import { mockBlogPosts } from '@/lib/mockBlog'
import type { BlogPost, CatalogProduct, CheckoutInput, ShippingOption } from '@/types/catalog'

export const isDemoMode = !isSupabaseConfigured

/**
 * Chama uma Edge Function e devolve o corpo já tipado. Quando a function
 * responde com status de erro (4xx/5xx), o supabase-js não expõe a
 * mensagem — só um "Edge Function returned a non-2xx status code" genérico
 * — então busca o JSON de verdade (com o campo "error" que as functions
 * sempre devolvem) direto da resposta antes de desistir.
 */
async function invokeEdgeFunction<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase!.functions.invoke(name, { body: body as Record<string, unknown> })
  if (error) {
    const context = (error as { context?: Response }).context
    const parsed = await context?.clone().json().catch(() => null)
    throw new Error(parsed?.error || error.message)
  }
  if (data?.error) throw new Error(data.error)
  return data as T
}

export async function getCatalog(): Promise<CatalogProduct[]> {
  if (supabase) {
    const { data, error } = await supabase.from('public_catalog').select('*').order('name')
    if (error) throw error
    return (data as CatalogProduct[]).map((p) => ({ ...p, image_urls: p.image_urls ?? [] }))
  }
  return mockCatalog
}

export async function getProduct(id: string): Promise<CatalogProduct | undefined> {
  const catalog = await getCatalog()
  return catalog.find((p) => p.id === id)
}

export interface CreatePaymentResult {
  orderId: string
  status: string
  pix?: { qrCode?: string; qrCodeBase64?: string }
  boleto?: { barcode?: string; ticketUrl?: string }
  error?: string
}

/**
 * Cria a cobranca real no Mercado Pago via Supabase Edge Function (o Access
 * Token do gateway fica so no servidor) e registra o pedido em Vendas com
 * status "pendente" ate a confirmacao do pagamento chegar pelo webhook.
 */
export async function createPayment(input: CheckoutInput): Promise<CreatePaymentResult> {
  if (supabase) {
    return invokeEdgeFunction<CreatePaymentResult>('mp-create-payment', input)
  }

  // Modo demonstracao: nao ha backend para processar o pagamento.
  await new Promise((resolve) => setTimeout(resolve, 600))
  return { orderId: `demo-${Date.now()}`, status: 'pendente' }
}

/**
 * Cota frete em tempo real (Melhor Envio) via Supabase Edge Function — o
 * token da API fica só no servidor. Retorna as opções ordenadas por preço,
 * ou uma mensagem quando não há nenhuma disponível para o CEP informado.
 */
export async function getShippingOptions(
  zipCode: string,
  items: { productId: string; quantity: number }[],
): Promise<{ options: ShippingOption[]; message?: string }> {
  if (supabase) {
    return invokeEdgeFunction<{ options: ShippingOption[]; message?: string }>('calculate-shipping', { zipCode, items })
  }

  // Modo demonstração: simula duas opções fixas.
  await new Promise((resolve) => setTimeout(resolve, 500))
  return {
    options: [
      { id: 1, service: 'PAC', company: 'Correios', price: 32.9, deliveryDays: '7' },
      { id: 2, service: 'SEDEX', company: 'Correios', price: 54.0, deliveryDays: '3' },
    ],
  }
}

export interface CouponValidation {
  valid: boolean
  discountPct: number
}

/**
 * Valida um cupom de desconto (parcerias com influenciadores) direto no
 * Postgres via função security definer — não expõe a lista de cupons
 * cadastrados, só se o código informado está válido agora e qual o
 * desconto. A cobrança real (Edge Function mp-create-payment) reconfere o
 * cupom no servidor antes de aplicar o desconto de verdade.
 */
export async function validateCoupon(code: string): Promise<CouponValidation> {
  if (!supabase) {
    // Modo demonstração: qualquer código de 4+ caracteres é aceito como
    // exemplo, para dar para testar a experiência sem backend.
    await new Promise((resolve) => setTimeout(resolve, 400))
    if (code.trim().length >= 4) return { valid: true, discountPct: 8 }
    return { valid: false, discountPct: 0 }
  }
  const { data, error } = await supabase.rpc('validate_coupon', { coupon_code: code })
  if (error || !data || data.length === 0) return { valid: false, discountPct: 0 }
  const row = data[0] as { valid: boolean; discount_pct: number | null }
  return { valid: row.valid, discountPct: row.valid ? Number(row.discount_pct) : 0 }
}

export interface OrderStatus {
  id: string
  sale_date: string
  status: string
  shipping_city: string | null
  shipping_federal_unit: string | null
  product_names: string[]
}

/**
 * Consulta publica de status de pedido — o cliente precisa saber o numero
 * do pedido E o e-mail usado na compra, senao a function get_order_status
 * (Postgres, security definer) nao retorna nada.
 */
export async function getOrderStatus(orderId: string, email: string): Promise<OrderStatus | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_order_status', {
    order_id: orderId,
    buyer_email: email,
  })
  if (error || !data || data.length === 0) return null
  return data[0] as OrderStatus
}

export interface PartRequestInput {
  orderId: string
  productModel: string
  partDescription: string
  replacementType: 'impressao_3d' | 'original_fabricante'
  photoUrl?: string
}

/**
 * Envia a foto da peça faltante direto para o Storage do Supabase (bucket
 * publico "part-request-photos") e devolve a URL publica para ser salva
 * junto da solicitacao. Em modo demo, nao ha upload real.
 */
export async function uploadPartRequestPhoto(file: File): Promise<string> {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return URL.createObjectURL(file)
  }
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('part-request-photos').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('part-request-photos').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Envia uma solicitacao de reposicao de peca faltante — exige o cliente
 * logado na área da conta, vinculada a um pedido real dele (orderId).
 * Sempre gratuito para o cliente — a Edge Function confere a posse do
 * pedido, registra em part_requests e dispara o e-mail de confirmacao.
 */
export async function submitPartRequest(input: PartRequestInput): Promise<{ requestId: string }> {
  if (supabase) {
    return invokeEdgeFunction<{ requestId: string }>('submit-part-request', input)
  }

  // Modo demonstracao: nao ha backend para registrar a solicitacao.
  await new Promise((resolve) => setTimeout(resolve, 600))
  return { requestId: `demo-${Date.now()}` }
}

/**
 * Cadastra o cliente na lista de espera de reposição de um SKU esgotado.
 * Grava direto na tabela (sem Edge Function) — a policy de insert é aberta
 * para qualquer visitante, e o painel de gestão é quem consulta e avisa o
 * cliente manualmente quando o estoque volta.
 */
export async function joinRestockWaitlist(input: {
  productId: string
  customerName?: string
  customerEmail: string
}): Promise<void> {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return
  }
  const { error } = await supabase.from('restock_waitlist').insert({
    product_id: input.productId,
    customer_name: input.customerName || null,
    customer_email: input.customerEmail,
  })
  // Já estar na lista (violação da constraint unique) não é um erro para o
  // usuário — ele só confirma que já está cadastrado.
  if (error && error.code !== '23505') throw error
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function sendChatMessage(messages: ChatMessage[], turnstileToken?: string | null): Promise<string> {
  if (!supabase) {
    return 'Modo demonstração: conecte o Supabase e a API da Anthropic para conversar com o assistente de verdade.'
  }
  const data = await invokeEdgeFunction<{ reply: string }>('site-chat', { messages, turnstileToken })
  return data.reply
}

export interface RecommendationPick {
  sku: string
  reason: string
}

/**
 * IA proprietária que sugere 1 a 3 sets do catálogo a partir de uma
 * descrição livre do cliente ("um carro esportivo italiano, pra exibir na
 * sala"). A Edge Function já valida que os SKUs retornados existem de
 * verdade no catálogo — aqui só repassa a lista.
 */
export async function recommendSets(query: string, turnstileToken?: string | null): Promise<RecommendationPick[]> {
  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return []
  }
  const data = await invokeEdgeFunction<{ picks: RecommendationPick[] }>('recommend-sets', { query, turnstileToken })
  return data.picks ?? []
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------
export async function getBlogPosts(): Promise<BlogPost[]> {
  if (supabase) {
    const { data, error } = await supabase.from('public_blog_posts').select('*')
    if (error) throw error
    return data as BlogPost[]
  }
  return mockBlogPosts
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  const posts = await getBlogPosts()
  return posts.find((p) => p.slug === slug)
}

// ---------------------------------------------------------------------------
// Minha Conta — área logada do cliente (login por código, Supabase Auth)
// ---------------------------------------------------------------------------
export interface MyOrderItem {
  product_name: string
  quantity: number
  unit_price_brl: number
}

export interface MyOrder {
  id: string
  sale_date: string
  status: string
  payment_method: string | null
  shipping_city: string | null
  shipping_federal_unit: string | null
  shipping_zip_code: string | null
  shipping_street_name: string | null
  shipping_street_number: string | null
  shipping_complement: string | null
  shipping_neighborhood: string | null
  customer_name: string | null
  items: MyOrderItem[]
}

const demoOrders: MyOrder[] = [
  {
    id: 'demo-a1b2c3d4-0000-0000-0000-000000000001',
    sale_date: new Date(Date.now() - 6 * 86400000).toISOString(),
    status: 'enviado',
    payment_method: 'pix',
    shipping_city: 'São Paulo',
    shipping_federal_unit: 'SP',
    shipping_zip_code: '01310-100',
    shipping_street_name: 'Av. Paulista',
    shipping_street_number: '1000',
    shipping_complement: 'Apto 52',
    shipping_neighborhood: 'Bela Vista',
    customer_name: 'Cliente Demonstração',
    items: [{ product_name: 'Bugatti Tourbillon', quantity: 1, unit_price_brl: 1366.43 }],
  },
  {
    id: 'demo-a1b2c3d4-0000-0000-0000-000000000002',
    sale_date: new Date(Date.now() - 32 * 86400000).toISOString(),
    status: 'entregue',
    payment_method: 'cartao',
    shipping_city: 'São Paulo',
    shipping_federal_unit: 'SP',
    shipping_zip_code: '01310-100',
    shipping_street_name: 'Av. Paulista',
    shipping_street_number: '1000',
    shipping_complement: 'Apto 52',
    shipping_neighborhood: 'Bela Vista',
    customer_name: 'Cliente Demonstração',
    items: [{ product_name: 'Ferrari Enzo', quantity: 1, unit_price_brl: 1491.03 }],
  },
]

/**
 * Traz o histórico de pedidos do cliente logado — via função Postgres
 * security definer get_my_orders, que já confere que o e-mail bate com a
 * sessão (não é possível ver pedidos de outra pessoa).
 */
export async function getMyOrders(): Promise<MyOrder[]> {
  if (!supabase) return demoOrders
  const { data, error } = await supabase.rpc('get_my_orders')
  if (error) throw error
  return (data ?? []) as MyOrder[]
}

export interface MyPartRequest {
  id: string
  created_at: string
  product_model: string
  part_description: string
  replacement_type: 'impressao_3d' | 'original_fabricante'
  status: string
  photo_url: string | null
}

export async function getMyPartRequests(): Promise<MyPartRequest[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_my_part_requests')
  if (error) throw error
  return (data ?? []) as MyPartRequest[]
}

export interface MyWaitlistEntry {
  id: string
  product_id: string
  created_at: string
  notified: boolean
  product: { name: string; image_url: string | null } | null
}

export async function getMyWaitlist(): Promise<MyWaitlistEntry[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('restock_waitlist')
    .select('id, product_id, created_at, notified, product:products(name, image_url)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as MyWaitlistEntry[]
}

export async function leaveWaitlist(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('restock_waitlist').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Favoritos
// ---------------------------------------------------------------------------
export interface MyFavorite {
  id: string
  product_id: string
  created_at: string
  product: {
    id: string
    name: string
    sale_price_brl: number
    image_url: string | null
    manufacturer: string | null
    scale: string | null
    collection_tag: string | null
  } | null
}

export async function getFavorites(): Promise<MyFavorite[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('favorites')
    .select('id, product_id, created_at, product:products(id, name, sale_price_brl, image_url, manufacturer, scale, collection_tag)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as MyFavorite[]
}

export async function addFavorite(productId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('favorites').insert({ product_id: productId })
  // Já estar favoritado (violação da constraint unique) não é um erro real.
  if (error && error.code !== '23505') throw error
}

export async function removeFavorite(productId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('favorites').delete().eq('product_id', productId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Indicação de amigos
// ---------------------------------------------------------------------------
export interface ReferralInfo {
  code: string
  discountPct: number
}

export interface MyRewardCoupon {
  id: string
  code: string
  discount_pct: number
  active: boolean
  uses_count: number
  max_uses: number | null
  created_at: string
}

/**
 * Retorna o código de indicação pessoal e permanente do cliente logado —
 * criado na primeira vez que ele abre a aba (função Postgres security
 * definer, já que o cliente comum não tem INSERT direto em `coupons`).
 */
export async function getReferralCode(): Promise<ReferralInfo> {
  if (!supabase) return { code: 'AMIGO-DEMO01', discountPct: 5 }
  const { data, error } = await supabase.rpc('get_or_create_referral_code')
  if (error) throw error
  const row = (data ?? [])[0] as { code: string; discount_pct: number } | undefined
  return { code: row?.code ?? '', discountPct: row ? Number(row.discount_pct) : 5 }
}

export async function getMyRewardCoupons(): Promise<MyRewardCoupon[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('get_my_reward_coupons')
  if (error) throw error
  return (data ?? []) as MyRewardCoupon[]
}

// ---------------------------------------------------------------------------
// Meus dados — perfil e endereços salvos
// ---------------------------------------------------------------------------
export interface MyProfile {
  fullName: string
  cpf: string
}

export async function getMyProfile(): Promise<MyProfile> {
  if (!supabase) return { fullName: 'Cliente Demonstração', cpf: '' }
  const { data, error } = await supabase.from('customer_profiles').select('full_name, cpf').maybeSingle()
  if (error) throw error
  return { fullName: data?.full_name ?? '', cpf: data?.cpf ?? '' }
}

export async function saveMyProfile(input: MyProfile): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('customer_profiles')
    .upsert({ full_name: input.fullName || null, cpf: input.cpf || null, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}

export interface MyAddress {
  id: string
  label: string | null
  zip_code: string
  street_name: string
  street_number: string
  complement: string | null
  neighborhood: string
  city: string
  federal_unit: string
  is_default: boolean
}

export async function getMyAddresses(): Promise<MyAddress[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('id, label, zip_code, street_name, street_number, complement, neighborhood, city, federal_unit, is_default')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as MyAddress[]
}

export async function addMyAddress(input: Omit<MyAddress, 'id'>): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('customer_addresses').insert(input)
  if (error) throw error
}

export async function deleteMyAddress(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('customer_addresses').delete().eq('id', id)
  if (error) throw error
}

/**
 * Marca um endereço como padrão — limpa o padrão anterior antes, sem
 * precisar filtrar por cliente explicitamente (a RLS já garante que só
 * afeta os próprios endereços do usuário logado).
 */
export async function setDefaultAddress(id: string): Promise<void> {
  if (!supabase) return
  const { error: clearError } = await supabase.from('customer_addresses').update({ is_default: false }).eq('is_default', true)
  if (clearError) throw clearError
  const { error } = await supabase.from('customer_addresses').update({ is_default: true }).eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Preferências de notificação
// ---------------------------------------------------------------------------
export interface NotificationPrefs {
  restockAlerts: boolean
  newsUpdates: boolean
}

export async function getMyNotificationPrefs(): Promise<NotificationPrefs> {
  if (!supabase) return { restockAlerts: true, newsUpdates: true }
  const { data, error } = await supabase.from('notification_preferences').select('restock_alerts, news_updates').maybeSingle()
  if (error) throw error
  return { restockAlerts: data?.restock_alerts ?? true, newsUpdates: data?.news_updates ?? true }
}

export async function saveMyNotificationPrefs(input: NotificationPrefs): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      { restock_alerts: input.restockAlerts, news_updates: input.newsUpdates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
  if (error) throw error
}
