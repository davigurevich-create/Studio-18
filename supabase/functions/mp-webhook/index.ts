// Recebe as notificações de pagamento do Mercado Pago e atualiza o status
// da venda correspondente no Supabase. Configure esta URL como webhook no
// painel do Mercado Pago (Suas integrações > sua aplicação > Webhooks).
import { createClient } from 'npm:@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// --- E-mail transacional (Resend) ------------------------------------------
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Studio 18 <onboarding@resend.dev>'
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://studio18.vercel.app'

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY não configurada — e-mail não enviado.')
    return
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    })
    if (!res.ok) console.error('Falha ao enviar e-mail:', await res.text())
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err)
  }
}

function emailShell(title: string, bodyHtml: string): string {
  return `
  <div style="background:#060606;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#0c0c0c;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">
      <div style="padding:20px 28px;border-bottom:1px solid rgba(255,255,255,0.08);">
        <img src="${SITE_URL}/logo-studio18.png" alt="Studio 18" height="28" style="height:28px;width:auto;display:block;" />
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 16px;font-size:20px;color:#f3f1ec;">${title}</h1>
        <div style="font-size:14px;line-height:1.6;color:#b7b3a9;">${bodyHtml}</div>
      </div>
      <div style="padding:20px 28px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#7a766d;">
        Studio 18 — Do nosso Studio ao seu.
      </div>
    </div>
  </div>`
}

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

    const { data: existingSale } = await supabase
      .from('sales')
      .select('id, status, customer_name, customer_contact')
      .eq('id', saleId)
      .maybeSingle()

    const newStatus = mapStatus(payment.status)
    await supabase
      .from('sales')
      .update({
        provider_payment_id: String(payment.id),
        provider_status: payment.status,
        status: newStatus,
      })
      .eq('id', saleId)

    // So avisa por e-mail na transicao para "pago" (evita reenviar em toda
    // notificacao repetida que o Mercado Pago manda para o mesmo pagamento).
    if (existingSale && existingSale.status !== 'pago' && newStatus === 'pago' && existingSale.customer_contact) {
      await sendEmail(
        existingSale.customer_contact,
        `Pagamento confirmado — Studio 18 #${saleId.slice(0, 8)}`,
        emailShell(
          'Pagamento confirmado!',
          `<p>Olá, ${(existingSale.customer_name ?? '').split(' ')[0] || 'tudo bem'}! Recebemos a confirmação do pagamento do seu pedido <strong>#${saleId.slice(0, 8)}</strong>.</p>
           <p>Já avisamos nossa equipe — seu set entra na fila de preparação para envio.</p>
           <p style="margin-top:24px;">
             <a href="${SITE_URL}/rastreio" style="color:#e6c778;">Acompanhe o status do envio em ${SITE_URL}/rastreio</a>
           </p>`,
        ),
      )
    }

    return new Response('ok', { status: 200 })
  } catch {
    // Mercado Pago reenvia se não receber 200 — evitamos loop de retry por
    // erro nosso respondendo 200 mesmo em falha, e só logamos no servidor.
    return new Response('ok', { status: 200 })
  }
})
