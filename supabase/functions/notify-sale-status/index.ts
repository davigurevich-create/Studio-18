// Chamada por um trigger do Postgres (ver migration 107_notify_sale_status.sql)
// toda vez que uma venda é criada ou tem o status alterado — manda uma
// notificação no Telegram pros sócios, pra qualquer mudança (não só
// "pago"): pedido iniciado, pago, enviado, entregue ou cancelado/recusado.
// A ideia é dar visibilidade de tentativas que não deram certo também
// (cartão recusado, PIX que nunca foi pago), não só vendas confirmadas.
//
// Não precisa de autenticação de staff: só o próprio trigger do Postgres
// (via pg_net, com a service role key) chama essa function.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')
const DASHBOARD_URL = Deno.env.get('DASHBOARD_URL') ?? 'https://painel.studio18bricks.com.br'

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

async function sendTelegram(text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados — notificação não enviada.')
    return
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    if (!res.ok) console.error('Falha ao enviar notificação Telegram:', await res.text())
  } catch (err) {
    console.error('Erro ao enviar notificação Telegram:', err)
  }
}

const CHANNEL_LABELS: Record<string, string> = {
  site: 'Site',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  feira: 'Feira',
  outro: 'Outro',
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix',
  cartao: 'Cartão',
  boleto: 'Boleto',
  dinheiro: 'Dinheiro',
  outro: 'Outro',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface RequestBody {
  saleId: string
  status: string
  previousStatus: string | null
  isNew: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { saleId, status, previousStatus, isNew }: RequestBody = await req.json()
    if (!saleId || !status) return json({ error: 'saleId e status são obrigatórios.' }, 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: sale } = await supabase.from('sales').select('*').eq('id', saleId).maybeSingle()
    if (!sale) return json({ ok: true, skipped: 'sale_not_found' })

    const { data: items } = await supabase
      .from('sale_items')
      .select('quantity, unit_price_brl, product:products(name)')
      .eq('sale_id', saleId)

    const productsTotal = (items ?? []).reduce((t: number, it: any) => t + Number(it.unit_price_brl) * it.quantity, 0)
    const total = productsTotal - Number(sale.discount_brl ?? 0) + Number(sale.shipping_cost_brl ?? 0) + Number(sale.installment_fee_brl ?? 0)
    const productNames = (items ?? []).map((it: any) => `${it.quantity}x ${it.product?.name ?? 'Item'}`).join(', ') || '(itens não encontrados)'
    const customerLabel = sale.customer_name || sale.customer_contact || 'Cliente não identificado'
    const channelLabel = CHANNEL_LABELS[sale.channel] ?? sale.channel
    const paymentLabel = sale.payment_method ? (PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method) : '—'
    const orderLink = `${DASHBOARD_URL}/vendas`

    let headline: string | null = null
    let extra = ''

    if (isNew) {
      if (status === 'pendente') {
        headline = '🛒 Novo pedido iniciado — aguardando pagamento'
      } else if (status === 'pago') {
        headline = '✅ Nova venda registrada (já paga)'
      } else {
        headline = `🆕 Nova venda registrada — status "${status}"`
      }
    } else if (previousStatus !== status) {
      switch (status) {
        case 'pago':
          headline = '✅ Pagamento confirmado!'
          break
        case 'enviado':
          headline = '📦 Pedido enviado!'
          if (sale.shipping_tracking_code) extra = `\nRastreio: <code>${sale.shipping_tracking_code}</code>`
          break
        case 'entregue':
          headline = '🎉 Pedido entregue!'
          break
        case 'cancelado':
          headline = '❌ Pedido cancelado / pagamento recusado'
          if (sale.provider_status) extra = `\nMotivo informado pela operadora: ${sale.provider_status}`
          extra += '\nVale conferir se o cliente precisa de ajuda pra tentar de novo.'
          break
        default:
          headline = `🔄 Status do pedido mudou para "${status}"`
      }
    }

    if (!headline) return json({ ok: true, skipped: 'no_relevant_change' })

    const text = `${headline}

<b>Cliente:</b> ${customerLabel}
<b>Itens:</b> ${productNames}
<b>Valor:</b> ${formatBRL(total)}
<b>Canal:</b> ${channelLabel} · <b>Pagamento:</b> ${paymentLabel}${extra}

${orderLink}`

    await sendTelegram(text)

    return json({ ok: true })
  } catch (err) {
    console.error('Erro ao notificar mudança de status de venda:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado.' }, 500)
  }
})
