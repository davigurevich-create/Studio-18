// Manda o e-mail "seu pedido saiu para entrega" pro cliente — chamada pelo
// painel assim que a equipe muda manualmente o status de um pedido pra
// "enviado" (é esse clique, feito depois de levar o pacote até a agência,
// que confirma de verdade que ele foi postado; ver comentário em
// generate-shipping-label sobre por que não dá pra confiar só no código de
// rastreio pra isso). Só a equipe pode chamar — mesmo padrão is_staff() das
// outras functions administrativas.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autenticado.' }, 401)
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: isStaff } = await callerClient.rpc('is_staff')
    if (!isStaff) return json({ error: 'Só a equipe pode disparar esse aviso.' }, 403)

    const { saleId } = await req.json()
    if (!saleId) return json({ error: 'saleId é obrigatório.' }, 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: sale, error } = await supabase
      .from('sales')
      .select('id, customer_name, customer_contact, shipping_tracking_code, shipping_service')
      .eq('id', saleId)
      .maybeSingle()
    if (error || !sale) return json({ error: 'Pedido não encontrado.' }, 404)
    if (!sale.customer_contact) return json({ sent: false, reason: 'Pedido sem e-mail de contato.' })

    await sendEmail(
      sale.customer_contact,
      `Seu pedido saiu para entrega — Studio 18 #${sale.id.slice(0, 8)}`,
      emailShell(
        'Seu pedido está a caminho!',
        `<p>Olá, ${String(sale.customer_name ?? '').split(' ')[0] || 'tudo bem'}! O pedido <strong>#${sale.id.slice(0, 8)}</strong> já foi postado e está a caminho.</p>
         ${
           sale.shipping_tracking_code
             ? `<div style="margin:20px 0;padding:16px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;">
                  <div style="font-size:12px;color:#7a766d;letter-spacing:0.05em;">CÓDIGO DE RASTREIO</div>
                  <div style="margin-top:4px;font-size:16px;color:#e6c778;font-family:monospace;">${sale.shipping_tracking_code}</div>
                </div>`
             : ''
         }
         <p style="margin-top:20px;">
           <a href="${SITE_URL}/conta" style="color:#e6c778;">Acompanhe a entrega em Minha Conta</a>
         </p>`,
      ),
    )

    return json({ sent: true })
  } catch (err) {
    console.error('Erro ao notificar envio:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado ao notificar envio.' }, 500)
  }
})
