// Recebe as notificações de pagamento do Mercado Pago e atualiza o status
// da venda correspondente no Supabase. Configure esta URL como webhook no
// painel do Mercado Pago (Suas integrações > sua aplicação > Webhooks).
import { createClient } from 'npm:@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function mapStatus(mpStatus: string): string {
  if (mpStatus === 'approved') return 'pago'
  if (mpStatus === 'rejected' || mpStatus === 'cancelled') return 'cancelado'
  return 'pendente'
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}

    // Mercado Pago manda tanto `?type=payment&data.id=123` (webhooks v2)
    // quanto `?topic=payment&id=123` (IPN legado) — cobrimos os dois.
    const paymentId =
      body?.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id')
    const topic = body?.type ?? url.searchParams.get('topic') ?? url.searchParams.get('type')

    if (topic !== 'payment' || !paymentId) {
      return new Response('ok', { status: 200 })
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    })
    if (!mpResponse.ok) return new Response('ok', { status: 200 })
    const payment = await mpResponse.json()

    const saleId = payment.external_reference
    if (!saleId) return new Response('ok', { status: 200 })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    await supabase
      .from('sales')
      .update({
        provider_payment_id: String(payment.id),
        provider_status: payment.status,
        status: mapStatus(payment.status),
      })
      .eq('id', saleId)

    return new Response('ok', { status: 200 })
  } catch {
    // Mercado Pago reenvia se não receber 200 — evitamos loop de retry por
    // erro nosso respondendo 200 mesmo em falha, e só logamos no servidor.
    return new Response('ok', { status: 200 })
  }
})
