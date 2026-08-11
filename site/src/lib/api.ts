import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { mockCatalog } from '@/lib/mockCatalog'
import { mockBlogPosts } from '@/lib/mockBlog'
import type { BlogPost, CatalogProduct, CheckoutInput } from '@/types/catalog'

export const isDemoMode = !isSupabaseConfigured

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
    const { data, error } = await supabase.functions.invoke('mp-create-payment', { body: input })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data as CreatePaymentResult
  }

  // Modo demonstracao: nao ha backend para processar o pagamento.
  await new Promise((resolve) => setTimeout(resolve, 600))
  return { orderId: `demo-${Date.now()}`, status: 'pendente' }
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
    const { data, error } = await supabase.functions.invoke('submit-part-request', { body: input })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data as { requestId: string }
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

export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  if (!supabase) {
    return 'Modo demonstração: conecte o Supabase e a API da Anthropic para conversar com o assistente de verdade.'
  }
  const { data, error } = await supabase.functions.invoke('site-chat', { body: { messages } })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data.reply as string
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
