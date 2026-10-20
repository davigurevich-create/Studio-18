// Avisa um cliente da lista de espera que o produto que ele queria voltou
// ao estoque. Chamada pelo painel quando a equipe clica "Marcar como
// avisado" na aba Lista de espera — antes esse clique só mudava o status
// interno, sem mandar e-mail nenhum de verdade (a pessoa nunca ficava
// sabendo). Só a equipe pode chamar — mesmo padrão is_staff() das outras
// functions administrativas.
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
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#060606;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#060606" style="background:#060606;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0c0c0c" style="max-width:520px;background:#0c0c0c;border:1px solid #262626;border-radius:12px;">
            <tr>
              <td bgcolor="#0c0c0c" style="padding:20px 28px;border-bottom:1px solid #262626;background:#0c0c0c;">
                <img src="${SITE_URL}/logo-studio18.png" alt="Studio 18" height="28" style="height:28px;width:auto;display:block;" />
              </td>
            </tr>
            <tr>
              <td bgcolor="#0c0c0c" style="padding:28px;background:#0c0c0c;font-family:Helvetica,Arial,sans-serif;">
                <h1 style="margin:0 0 16px;font-size:20px;color:#f3f1ec;">${title}</h1>
                <div style="font-size:14px;line-height:1.6;color:#b7b3a9;">${bodyHtml}</div>
              </td>
            </tr>
            <tr>
              <td bgcolor="#0c0c0c" style="padding:20px 28px;border-top:1px solid #262626;background:#0c0c0c;font-size:12px;color:#7a766d;font-family:Helvetica,Arial,sans-serif;">
                Studio 18 — Do nosso Studio ao seu.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
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
    if (!isStaff) return json({ error: 'Só a equipe pode avisar a lista de espera.' }, 403)

    const { waitlistEntryId } = await req.json()
    if (!waitlistEntryId) return json({ error: 'waitlistEntryId é obrigatório.' }, 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: entry, error } = await supabase
      .from('restock_waitlist')
      .select('id, customer_name, customer_email, product_id, products(name, sale_price_brl)')
      .eq('id', waitlistEntryId)
      .maybeSingle()
    if (error || !entry) return json({ error: 'Registro da lista de espera não encontrado.' }, 404)

    const { data: stock } = await supabase
      .from('product_stock')
      .select('quantity_in_stock')
      .eq('product_id', entry.product_id)
      .maybeSingle()

    const product = entry.products as unknown as { name: string; sale_price_brl: number } | null
    if (!product) return json({ error: 'Produto não encontrado.' }, 404)

    const firstName = String(entry.customer_name ?? '').split(' ')[0] || 'tudo bem'
    const qty = stock?.quantity_in_stock ?? 0
    const scarcityLine =
      qty > 0 && qty <= 2
        ? `<p style="margin:16px 0;padding:14px;border-radius:8px;background:rgba(230,199,120,0.08);border:1px solid rgba(205,164,77,0.35);text-align:center;"><strong style="color:#e6c778;">Atenção: restam só ${qty} unidade${qty > 1 ? 's' : ''}</strong> — é por ordem de chegada, sem reserva.</p>`
        : ''
    const priceFormatted = Number(product.sale_price_brl).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    await sendEmail(
      entry.customer_email,
      `Voltou! ${product.name} já está disponível — Studio 18`,
      emailShell(
        'O set que você esperava chegou',
        `<p>Olá, ${firstName}! Você entrou na nossa lista de espera pelo <strong>${product.name}</strong> — e ele acabou de voltar ao estoque.</p>
         ${scarcityLine}
         <p style="margin:16px 0;">Preço: <strong style="color:#e6c778;">${priceFormatted}</strong></p>
         <p style="text-align:center;margin-top:20px;">
           <a href="${SITE_URL}/produto/${entry.product_id}" style="display:inline-block;padding:12px 28px;border-radius:999px;background:#cda44d;color:#0a0a0a;font-weight:700;text-decoration:none;">Garantir o meu agora</a>
         </p>`,
      ),
    )

    return json({ sent: true })
  } catch (err) {
    console.error('Erro ao avisar lista de espera:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado ao avisar lista de espera.' }, 500)
  }
})
