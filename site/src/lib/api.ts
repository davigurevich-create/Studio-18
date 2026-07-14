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

/**
 * Cria um pedido pendente que aparece direto no painel de gestao (Vendas),
 * sem exigir login — a policy no Supabase so permite inserir vendas com
 * status "pendente" e canal "site".
 */
export async function submitOrder(product: CatalogProduct, input: CheckoutInput): Promise<{ orderId: string }> {
  if (supabase) {
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        sale_date: new Date().toISOString(),
        channel: 'site',
        customer_name: input.customerName,
        customer_contact: input.customerContact,
        payment_method: input.paymentMethod,
        status: 'pendente',
        shipping_cost_brl: 0,
        discount_brl: 0,
        notes: `Pedido feito pelo site — ${product.name}`,
      })
      .select()
      .single()
    if (saleError) throw saleError

    const { error: itemError } = await supabase.from('sale_items').insert({
      sale_id: sale.id,
      product_id: product.id,
      quantity: 1,
      unit_price_brl: product.sale_price_brl,
      unit_cost_brl: 0,
    })
    if (itemError) throw itemError

    return { orderId: sale.id as string }
  }

  // Modo demonstracao: nao ha backend para persistir o pedido.
  await new Promise((resolve) => setTimeout(resolve, 600))
  return { orderId: `demo-${Date.now()}` }
}
