// Roda periodicamente via pg_cron (ver migration 065_delivery_status_automation.sql)
// — reconsulta a Melhor Envio pelos pedidos com status "enviado" que já têm
// rastreio, e marca sozinho como "entregue" assim que a transportadora
// confirma a entrega (campo delivered_at deixa de ser null).
//
// Não precisa de autenticação de staff: só o próprio agendamento do
// Postgres (com a service role key) chama essa function, nunca o painel.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// Mesmo toggle usado em calculate-shipping e generate-shipping-label.
const MELHOR_ENVIO_ENV = Deno.env.get('MELHOR_ENVIO_ENV') ?? 'producao'
const MELHOR_ENVIO_BASE_URL = MELHOR_ENVIO_ENV === 'sandbox' ? 'https://sandbox.melhorenvio.com.br' : 'https://www.melhorenvio.com.br'
const MELHOR_ENVIO_TOKEN = (MELHOR_ENVIO_ENV === 'sandbox' ? Deno.env.get('MELHOR_ENVIO_SANDBOX_TOKEN') : Deno.env.get('MELHOR_ENVIO_TOKEN'))!

// --- E-mail transacional (Resend) — mesmo padrão das outras functions ---
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

async function sendDeliveredEmail(saleId: string, customerName: string | null, customerContact: string): Promise<void> {
  await sendEmail(
    customerContact,
    `Seu pedido foi entregue — Studio 18 #${saleId.slice(0, 8)}`,
    emailShell(
      'Seu pedido chegou!',
      `<p>Olá, ${String(customerName ?? '').split(' ')[0] || 'tudo bem'}! A transportadora confirmou a entrega do pedido <strong>#${saleId.slice(0, 8)}</strong>.</p>
       <p style="margin-top:16px;">Esperamos que aproveite muito o seu novo set — se tiver qualquer problema com o pedido, é só responder este e-mail.</p>
       <p style="margin-top:20px;">
         <a href="${SITE_URL}/conta" style="color:#e6c778;">Ver detalhes em Minha Conta</a>
       </p>`,
    ),
  )
}

async function meFetch(path: string, body: unknown) {
  const res = await fetch(`${MELHOR_ENVIO_BASE_URL}/api/v2/me/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Studio 18 (contato@studio18bricks.com.br)',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, data }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Evita mandar um payload gigante de uma vez só pra Melhor Envio — reconsulta
// em lotes pequenos.
const BATCH_SIZE = 20

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: sales, error } = await supabase
      .from('sales')
      .select('id, melhor_envio_order_id, customer_name, customer_contact, status')
      .eq('status', 'enviado')
      .not('melhor_envio_order_id', 'is', null)
    if (error) {
      console.error('Falha ao buscar pedidos enviados:', error)
      return json({ error: error.message }, 500)
    }
    if (!sales || sales.length === 0) return json({ checked: 0, delivered: 0 })

    let deliveredCount = 0
    for (let i = 0; i < sales.length; i += BATCH_SIZE) {
      const batch = sales.slice(i, i + BATCH_SIZE)
      const orderIds = batch.map((s) => s.melhor_envio_order_id as string)
      const tracking = await meFetch('shipment/tracking', { orders: orderIds })
      if (!tracking.ok) {
        console.error('Falha ao consultar rastreio na Melhor Envio:', tracking.data)
        continue
      }
      for (const sale of batch) {
        const info = tracking.data?.[sale.melhor_envio_order_id as string]
        if (!info?.delivered_at) continue
        await supabase.from('sales').update({ status: 'entregue' }).eq('id', sale.id)
        deliveredCount++
        if (sale.customer_contact) await sendDeliveredEmail(sale.id, sale.customer_name, sale.customer_contact)
      }
    }

    return json({ checked: sales.length, delivered: deliveredCount })
  } catch (err) {
    console.error('Erro ao atualizar status de entrega:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado ao atualizar status de entrega.' }, 500)
  }
})
