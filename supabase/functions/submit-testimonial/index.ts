// Recebe o depoimento do cliente (link mandado pela request-testimonials,
// 5 dias depois da entrega). Pública (sem login — é o mesmo e-mail que
// recebeu o link quem confirma a identidade aqui), mas confere que o
// e-mail informado bate com o pedido antes de aceitar, e credita o bônus
// de 1000 pontos assim que o depoimento é enviado (não depende da
// aprovação da equipe — a pessoa já cumpriu a parte dela).
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TESTIMONIAL_BONUS_POINTS = 1000

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

interface RequestBody {
  saleId: string
  email: string
  customerName: string
  rating: number
  message: string
  photoUrl?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { saleId, email, customerName, rating, message, photoUrl } = body

    if (!saleId || !email || !customerName || !message || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return json({ error: 'Dados obrigatórios ausentes ou inválidos.' }, 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('id, customer_contact')
      .eq('id', saleId)
      .maybeSingle()

    if (saleError || !sale || sale.customer_contact?.toLowerCase() !== email.toLowerCase()) {
      return json({ error: 'Pedido não encontrado para esse e-mail.' }, 404)
    }

    const { data: items } = await supabase
      .from('sale_items')
      .select('product_id, product:products(name)')
      .eq('sale_id', saleId)

    const productNames = (items ?? [])
      .map((it: any) => it.product?.name as string | undefined)
      .filter((name): name is string => Boolean(name))

    const { data: created, error } = await supabase
      .from('testimonials')
      .insert({
        sale_id: saleId,
        product_id: items?.[0]?.product_id ?? null,
        product_names: productNames.length > 0 ? productNames : null,
        customer_name: customerName,
        customer_email: email,
        rating,
        message,
        photo_url: photoUrl || null,
        status: 'pendente',
      })
      .select()
      .single()

    if (error || !created) {
      // unique(sale_id) barrado — a pessoa já mandou depoimento pra esse pedido.
      if (error?.code === '23505') {
        return json({ error: 'Você já enviou um depoimento para esse pedido.' }, 409)
      }
      console.error('Falha ao registrar depoimento:', error)
      return json({ error: 'Não foi possível registrar seu depoimento agora.' }, 500)
    }

    await supabase.from('customer_points_ledger').insert({
      customer_email: email,
      points: TESTIMONIAL_BONUS_POINTS,
      reason: 'Bônus por depoimento',
      sale_id: saleId,
    })

    await sendEmail(
      email,
      'Recebemos seu depoimento — Studio 18',
      emailShell(
        'Obrigado pelo depoimento!',
        `<p>Olá, ${customerName.split(' ')[0]}! Recebemos seu depoimento e já creditamos <strong style="color:#e6c778;">${TESTIMONIAL_BONUS_POINTS} pontos</strong> de bônus na sua conta.</p>
         <p>Nossa equipe revisa rapidinho antes de publicar no site — assim que aprovado, seu depoimento aparece na seção "O que os nossos colecionadores dizem".</p>`,
      ),
    )

    return json({ testimonialId: created.id })
  } catch (err) {
    console.error('Erro ao registrar depoimento:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado.' }, 500)
  }
})
