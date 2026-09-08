// Recebe as notificações de status do PIX da Rede e atualiza a venda
// correspondente no Supabase. A URL desta function precisa ser registrada
// junto à Rede — em produção, por telefone com o call center (informando
// CNPJ, PV, e-mail e esta URL); em sandbox, via
// POST v1/transactions/notification-URL (self-service, sem precisar ligar).
//
// Diferente do Mercado Pago, a notificação da Rede só traz o TID
// (data.id) — não o nosso próprio identificador de venda — por isso
// buscamos a venda por provider_payment_id em vez de "external_reference".
import { createClient } from 'npm:@supabase/supabase-js@2'

const REDE_PV = Deno.env.get('REDE_PV')!
const REDE_CLIENT_SECRET = Deno.env.get('REDE_CLIENT_SECRET')!
const REDE_ENV = Deno.env.get('REDE_ENV') ?? 'sandbox'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const REDE_URLS =
  REDE_ENV === 'production'
    ? { auth: 'https://api.userede.com.br/redelabs/oauth2/token', transactions: 'https://api.userede.com.br/erede/v2/transactions' }
    : { auth: 'https://rl7-sandbox-api.useredecloud.com.br/oauth2/token', transactions: 'https://sandbox-erede.useredecloud.com.br/v2/transactions' }

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

async function getRedeAccessToken(): Promise<string> {
  const res = await fetch(REDE_URLS.auth, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${REDE_PV}:${REDE_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.access_token) {
    throw new Error('Não foi possível autenticar com a Rede.')
  }
  return data.access_token as string
}

// status do PIX vem em authorization.status: "Approved" | "Canceled" | "Pending"
function mapStatus(pixStatus: string | undefined): string {
  if (pixStatus === 'Approved') return 'pago'
  if (pixStatus === 'Canceled') return 'cancelado'
  return 'pendente'
}

Deno.serve(async (req) => {
  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const tid = body?.data?.id
    const events: string[] = body?.events ?? []

    if (!tid || !events.length) {
      return new Response('ok', { status: 200 })
    }

    const accessToken = await getRedeAccessToken()
    const queryResponse = await fetch(`${REDE_URLS.transactions}/${tid}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!queryResponse.ok) return new Response('ok', { status: 200 })
    const transaction = await queryResponse.json()

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: existingSale } = await supabase
      .from('sales')
      .select('id, status, customer_name, customer_contact')
      .eq('provider_payment_id', String(tid))
      .maybeSingle()

    if (!existingSale) return new Response('ok', { status: 200 })

    const newStatus = mapStatus(transaction.authorization?.status)
    await supabase
      .from('sales')
      .update({
        provider_status: transaction.authorization?.status ?? null,
        status: newStatus,
      })
      .eq('id', existingSale.id)

    // Só avisa por e-mail na transição pra "pago" (evita reenviar em toda
    // notificação repetida que a Rede manda pro mesmo pagamento).
    if (existingSale.status !== 'pago' && newStatus === 'pago' && existingSale.customer_contact) {
      await sendEmail(
        existingSale.customer_contact,
        `Pagamento confirmado — Studio 18 #${existingSale.id.slice(0, 8)}`,
        emailShell(
          'Pagamento confirmado!',
          `<p>Olá, ${(existingSale.customer_name ?? '').split(' ')[0] || 'tudo bem'}! Recebemos a confirmação do pagamento do seu pedido <strong>#${existingSale.id.slice(0, 8)}</strong>.</p>
           <p>Já avisamos nossa equipe — seu set entra na fila de preparação para envio.</p>
           <p style="margin-top:24px;">
             <a href="${SITE_URL}/rastreio" style="color:#e6c778;">Acompanhe o status do envio em ${SITE_URL}/rastreio</a>
           </p>`,
        ),
      )
    }

    return new Response('ok', { status: 200 })
  } catch {
    // A Rede reenvia se não receber 200 — evitamos loop de retry por erro
    // nosso respondendo 200 mesmo em falha, e só logamos no servidor.
    return new Response('ok', { status: 200 })
  }
})
