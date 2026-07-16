// Recebe solicitações de reposição de peças faltantes vindas do site
// (formulário público, sem login) e registra em part_requests. Sempre
// gratuito para o cliente — a equipe acompanha e atualiza o status pelo
// painel de gestão.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

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

type ReplacementType = 'impressao_3d' | 'original_fabricante'

interface RequestBody {
  customerName: string
  customerEmail: string
  orderReference: string
  productModel: string
  partDescription: string
  replacementType: ReplacementType
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { customerName, customerEmail, orderReference, productModel, partDescription, replacementType } = body

    if (
      !customerName ||
      !customerEmail ||
      !orderReference ||
      !productModel ||
      !partDescription ||
      (replacementType !== 'impressao_3d' && replacementType !== 'original_fabricante')
    ) {
      return json({ error: 'Dados obrigatórios ausentes.' }, 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: created, error } = await supabase
      .from('part_requests')
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        order_reference: orderReference,
        product_model: productModel,
        part_description: partDescription,
        replacement_type: replacementType,
        status: 'pendente',
      })
      .select()
      .single()

    if (error || !created) {
      return json({ error: 'Não foi possível registrar a solicitação.' }, 500)
    }

    const replacementBlockHtml =
      replacementType === 'impressao_3d'
        ? '<p>Vamos imprimir a peça em 3D no nosso próprio estúdio e enviar em até <strong>2 dias úteis</strong> — sem nenhum custo para você.</p>'
        : '<p>Vamos solicitar a peça original diretamente ao fabricante. O prazo de envio é maior do que a impressão 3D, mas também é totalmente <strong>gratuito</strong> — assim que ela chegar, avisamos e enviamos para você.</p>'

    await sendEmail(
      customerEmail,
      `Solicitação de peça recebida — Studio 18 #${created.id.slice(0, 8)}`,
      emailShell(
        'Recebemos sua solicitação!',
        `<p>Olá, ${customerName.split(' ')[0]}! Recebemos seu pedido de reposição da peça:</p>
         <p style="margin:12px 0;padding:12px;border-radius:8px;background:rgba(255,255,255,0.04);">
           <strong>${productModel}</strong><br />${partDescription}
         </p>
         ${replacementBlockHtml}
         <p style="margin-top:20px;">Número do pedido original: ${orderReference}</p>
         <p style="margin-top:24px;">
           <a href="${SITE_URL}/rastreio" style="color:#e6c778;">Acompanhe o status a qualquer momento em ${SITE_URL}/rastreio</a>
         </p>`,
      ),
    )

    return json({ requestId: created.id })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado.' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
