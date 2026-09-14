// Consulta ATIVA do status de um PIX direto na Rede — chamada pelo próprio
// navegador do cliente (a cada 5s, enquanto a tela de "aguardando
// confirmação" estiver aberta), em vez de depender só do webhook.
//
// Motivo: confirmado em produção que a notificação da Rede
// (rede-pix-webhook) só chega no momento em que o QR Code é CRIADO
// (evento "PV.UPDATE_TRANSACTION_PIX"), não quando o pagamento é
// efetivamente confirmado — pelo menos com a configuração atual da conta.
// Até isso ser resolvido junto ao suporte da Rede, essa consulta ativa é
// o que garante a confirmação automática funcionar de verdade.
//
// Segurança: exige orderId + e-mail (mesmo padrão do get_order_status
// público) — sem isso, não dá pra usar isso pra descobrir o status de
// pedidos de outras pessoas só sabendo o UUID.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const REDE_PV = Deno.env.get('REDE_PV')!
const REDE_CLIENT_SECRET = Deno.env.get('REDE_CLIENT_SECRET')!
const REDE_ENV = Deno.env.get('REDE_ENV') ?? 'sandbox'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const REDE_URLS =
  REDE_ENV === 'production'
    ? { pixTransactions: 'https://api.userede.com.br/erede/v1/transactions' }
    : { pixTransactions: 'https://sandbox-erede.useredecloud.com.br/v1/transactions' }

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Studio 18 <onboarding@resend.dev>'
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://studio18.vercel.app'

// Mesma convenção usada em rede-pix-webhook (qrCodeResponse.status — o
// "returnCode" da raiz só diz se A CONSULTA funcionou, não se foi pago).
const PAID_STATUSES = new Set(['Paid', 'Concluded', 'Completed', 'Approved', 'Confirmed', 'Settled'])

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function pixAuthHeader(): string {
  return `Basic ${btoa(`${REDE_PV.trim()}:${REDE_CLIENT_SECRET.trim()}`)}`
}

async function sendConfirmationEmail(to: string, name: string | null, saleId: string): Promise<void> {
  if (!RESEND_API_KEY) return
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject: `Pagamento confirmado — Studio 18 #${saleId.slice(0, 8)}`,
        html: `
        <div style="background:#060606;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
          <div style="max-width:520px;margin:0 auto;background:#0c0c0c;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">
            <div style="padding:20px 28px;border-bottom:1px solid rgba(255,255,255,0.08);">
              <img src="${SITE_URL}/logo-studio18.png" alt="Studio 18" height="28" style="height:28px;width:auto;display:block;" />
            </div>
            <div style="padding:28px;">
              <h1 style="margin:0 0 16px;font-size:20px;color:#f3f1ec;">Pagamento confirmado!</h1>
              <div style="font-size:14px;line-height:1.6;color:#b7b3a9;">
                <p>Olá, ${name?.split(' ')[0] || 'tudo bem'}! Recebemos a confirmação do pagamento do seu pedido <strong>#${saleId.slice(0, 8)}</strong>.</p>
                <p>Já avisamos nossa equipe — seu set entra na fila de preparação para envio.</p>
                <p style="margin-top:24px;">
                  <a href="${SITE_URL}/conta" style="color:#e6c778;">Acompanhe o status do envio em Minha Conta</a>
                </p>
              </div>
            </div>
            <div style="padding:20px 28px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#7a766d;">
              Studio 18 — Do nosso Studio ao seu.
            </div>
          </div>
        </div>`,
      }),
    })
  } catch (err) {
    console.error('Erro ao enviar e-mail de confirmação (check-pix-status):', err)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { orderId, email } = await req.json()
    if (!orderId || !email) return json({ error: 'orderId e email são obrigatórios.' }, 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('id, status, payment_method, provider_payment_id, customer_name, customer_contact')
      .eq('id', orderId)
      .maybeSingle()

    if (saleError || !sale) return json({ error: 'Pedido não encontrado.' }, 404)
    if ((sale.customer_contact ?? '').toLowerCase() !== String(email).toLowerCase()) {
      return json({ error: 'Pedido não encontrado.' }, 404)
    }

    // Já resolvido, ou não é PIX (nada pra consultar) — devolve o status
    // atual sem gastar uma chamada na Rede à toa.
    if (sale.status !== 'pendente' || sale.payment_method !== 'pix' || !sale.provider_payment_id) {
      return json({ status: sale.status })
    }

    const queryResponse = await fetch(`${REDE_URLS.pixTransactions}/${sale.provider_payment_id}`, {
      headers: { Authorization: pixAuthHeader() },
    })
    if (!queryResponse.ok) {
      console.error('check-pix-status: falha ao consultar a Rede:', queryResponse.status)
      return json({ status: sale.status })
    }
    const transaction = await queryResponse.json()
    const pixStatus = transaction.qrCodeResponse?.status as string | undefined

    if (!pixStatus || !PAID_STATUSES.has(pixStatus)) {
      return json({ status: sale.status })
    }

    // Update condicional (só se ainda estiver pendente) — evita reenviar o
    // e-mail de confirmação duas vezes se o webhook e essa consulta ativa
    // caírem quase ao mesmo tempo.
    const { data: updated } = await supabase
      .from('sales')
      .update({ status: 'pago', provider_status: pixStatus })
      .eq('id', orderId)
      .eq('status', 'pendente')
      .select('id')
      .maybeSingle()

    if (updated) {
      await sendConfirmationEmail(sale.customer_contact, sale.customer_name, sale.id)
    }

    return json({ status: 'pago' })
  } catch (err) {
    console.error('Erro em check-pix-status:', err)
    return json({ error: 'Erro inesperado ao consultar status do pagamento.' }, 500)
  }
})
