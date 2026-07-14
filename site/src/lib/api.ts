import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { mockCatalog } from '@/lib/mockCatalog'
import type { CatalogProduct, CheckoutInput } from '@/types/catalog'

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
