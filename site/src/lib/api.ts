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
  customerName: string
  customerEmail: string
  orderReference: string
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
 * Envia uma solicitacao de reposicao de peca faltante (formulario publico,
 * sem login). Sempre gratuito para o cliente — a Edge Function registra em
 * part_requests e dispara o e-mail de confirmacao.
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
