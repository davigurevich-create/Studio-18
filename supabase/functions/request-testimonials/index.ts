// Roda 1x por dia via pg_cron (ver migration 080_testimonials.sql) — manda
// o e-mail pedindo depoimento pra pedidos entregues há 5 dias ou mais, que
// ainda não foram avisados (testimonial_requested_at nulo).
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
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Studio 18 <onboarding@resend.dev>'
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://studio18.vercel.app'
const TESTIMONIAL_BONUS_POINTS = 1000
const DAYS_AFTER_DELIVERY = 5

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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const cutoff = new Date(Date.now() - DAYS_AFTER_DELIVERY * 24 * 60 * 60 * 1000).toISOString()

    const { data: sales, error } = await supabase
      .from('sales')
      .select('id, customer_name, customer_contact')
      .eq('status', 'entregue')
      .not('delivered_at', 'is', null)
      .lte('delivered_at', cutoff)
      .is('testimonial_requested_at', null)
      .not('customer_contact', 'is', null)

    if (error) {
      console.error('Falha ao buscar pedidos elegíveis pra pedido de depoimento:', error)
      return json({ error: error.message }, 500)
    }
    if (!sales || sales.length === 0) return json({ requested: 0 })

    let requestedCount = 0
    for (const sale of sales) {
      const firstName = String(sale.customer_name ?? '').split(' ')[0] || 'tudo bem'
      await sendEmail(
        sale.customer_contact as string,
        'Como ficou o seu set? Conte pra gente e ganhe 1000 pontos',
        emailShell(
          'O que você achou do seu set?',
          `<p>Olá, ${firstName}! Já faz alguns dias que seu pedido chegou — esperamos que tenha aproveitado bastante a montagem.</p>
           <p>Conta pra gente como foi a experiência: sua opinião ajuda outros colecionadores e pode aparecer na nossa seção de depoimentos no site.</p>
           <p style="margin:20px 0;padding:16px;border-radius:8px;background:rgba(230,199,120,0.08);border:1px solid rgba(205,164,77,0.35);text-align:center;">
             Deixe seu depoimento e ganhe <strong style="color:#e6c778;">${TESTIMONIAL_BONUS_POINTS} pontos de bônus</strong> — leva menos de 2 minutos.
           </p>
           <p style="text-align:center;">
             <a href="${SITE_URL}/avaliacao/${sale.id}" style="display:inline-block;padding:12px 28px;border-radius:999px;background:#cda44d;color:#0a0a0a;font-weight:700;text-decoration:none;">Deixar meu depoimento</a>
           </p>`,
        ),
      )
      await supabase.from('sales').update({ testimonial_requested_at: new Date().toISOString() }).eq('id', sale.id)
      requestedCount++
    }

    return json({ requested: requestedCount })
  } catch (err) {
    console.error('Erro ao pedir depoimentos:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado.' }, 500)
  }
})
