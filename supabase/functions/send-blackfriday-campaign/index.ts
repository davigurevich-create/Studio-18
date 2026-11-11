// Dispara a campanha de Black Friday pra base de leads do pop-up de
// boas-vindas. Só a equipe pode chamar (is_staff()). Dois modos:
// - { testEmail: "..." }: manda só 1 cópia pro e-mail informado, não mexe
//   em nada no banco — pra revisar o template antes do disparo de verdade.
// - { confirm: true }: dispara de verdade pra todo mundo em `leads` que
//   ainda não recebeu (blackfriday_email_sent_at is null) e não se
//   descadastrou (unsubscribed_at is null), marcando cada um enviado. Pode
//   rodar de novo com segurança — nunca manda 2x pro mesmo lead.
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
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`
// Banner que o Rubens produz à parte — ver dimensão/arquivo esperado no
// comentário de blackFridayEmailHtml() mais abaixo.
const BANNER_URL = `${SITE_URL}/email-blackfriday-banner.jpg`

// Resend aceita até 100 e-mails por chamada do endpoint de lote — manda em
// blocos de 90 (margem de segurança) em vez de 1 request por lead, senão
// 277 e-mails estourariam o tempo de execução da function.
const BATCH_SIZE = 90

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function sendBatch(emails: { from: string; to: string; subject: string; html: string }[]): Promise<boolean[]> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY não configurada — campanha não enviada.')
    return emails.map(() => false)
  }
  try {
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emails),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      console.error('Falha no lote do Resend:', res.status, JSON.stringify(body))
      return emails.map(() => false)
    }
    // Resposta: { data: [{ id }, ...] } na mesma ordem do array enviado.
    const results = (body?.data ?? []) as { id?: string }[]
    return emails.map((_, i) => Boolean(results[i]?.id))
  } catch (err) {
    console.error('Erro ao chamar o Resend em lote:', err)
    return emails.map(() => false)
  }
}

// Template impactante de Black Friday — cabeçalho é só o banner (imagem
// cheia, sem padding/moldura), pra o Rubens produzir a peça gráfica dele
// com total liberdade visual; o resto do e-mail (corpo escuro + dourado)
// seque o mesmo padrão dos outros e-mails transacionais da marca.
//
// DIMENSÃO DO BANNER: 1200×600px (proporção 2:1), JPG ou PNG, até ~500KB.
// 1200px de largura pra ficar nítido em tela retina (o e-mail mostra em
// 600px de largura) — o arquivo final deve ir pra
// site/public/email-blackfriday-banner.jpg (mesmo fluxo de sempre: sobe
// pelo GitHub em site/public/, nada de upload manual no Resend).
function blackFridayEmailHtml(unsubscribeUrl: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <title>Black Friday Studio 18</title>
  </head>
  <body style="margin:0;padding:0;background:#060606;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#060606" style="background:#060606;">
      <tr>
        <td align="center" style="padding:24px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0c0c0c" style="max-width:600px;background:#0c0c0c;border:1px solid #262626;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="line-height:0;">
                <a href="${SITE_URL}/?utm_source=email&utm_medium=campaign&utm_campaign=blackfriday2026" style="display:block;">
                  <img src="${BANNER_URL}" width="600" alt="Black Friday Studio 18" style="display:block;width:100%;max-width:600px;height:auto;" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;background:#0c0c0c;font-family:Helvetica,Arial,sans-serif;">
                <p style="margin:0 0 10px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#e6c778;text-transform:uppercase;">
                  Black Friday Studio 18
                </p>
                <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#b7b3a9;">
                  Começamos a Studio 18 há pouco tempo, e saber que pessoas como você decidiram confiar na gente
                  desde o início é algo que nos traz uma felicidade genuína. Pra agradecer essa confiança, preparamos
                  a Black Friday mais generosa que já fizemos.
                </p>
                <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;color:#f3f1ec;">
                  Até <span style="color:#e6c778;">30% OFF</span> em todo o site. Inicie uma coleção ou aumente a sua!
                </h1>
                <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#b7b3a9;">
                  25% OFF em até 6x no cartão, ou 30% OFF à vista no Pix — em qualquer carro, moto ou motor
                  funcional da coleção. É só usar o cupom abaixo no checkout.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="border:1.5px dashed #e6c778;border-radius:10px;padding:14px 22px;text-align:center;">
                      <span style="font-family:monospace;font-size:20px;font-weight:bold;letter-spacing:2px;color:#e6c778;">BLACKFRIDAY25</span>
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                  <tr>
                    <td style="border-radius:999px;background:#e6c778;">
                      <a href="${SITE_URL}/?utm_source=email&utm_medium=campaign&utm_campaign=blackfriday2026"
                         style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:bold;color:#0a0a0a;text-decoration:none;border-radius:999px;">
                        Garantir meu desconto →
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#7a766d;">
                  Promoção válida até 28/11, ou enquanto durar o estoque de cada peça. Desconto do cupom não
                  acumula com outras promoções da coleção, mas acumula com qualquer benefício de clube já ativo
                  na sua conta.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid #262626;background:#0c0c0c;font-size:11px;color:#55524c;font-family:Helvetica,Arial,sans-serif;">
                Studio 18 — Do nosso Studio ao seu.<br />
                Você recebeu este e-mail por ter deixado seu contato no site.
                <a href="${unsubscribeUrl}" style="color:#7a766d;">Não quero mais receber estes e-mails</a>.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
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
    if (!isStaff) return json({ error: 'Só a equipe pode disparar a campanha.' }, 403)

    const { testEmail, confirm } = (await req.json().catch(() => ({}))) as { testEmail?: string; confirm?: boolean }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    if (testEmail) {
      const unsubscribeUrl = `${FUNCTIONS_URL}/unsubscribe-lead?id=teste`
      const [ok] = await sendBatch([
        { from: EMAIL_FROM, to: testEmail, subject: '[TESTE] 🖤 Black Friday Studio 18 — até 30% OFF', html: blackFridayEmailHtml(unsubscribeUrl) },
      ])
      return json({ sentTest: ok })
    }

    if (!confirm) {
      const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .is('blackfriday_email_sent_at', null)
        .is('unsubscribed_at', null)
      return json({ pending: count ?? 0 })
    }

    const { data: pendingLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, email')
      .is('blackfriday_email_sent_at', null)
      .is('unsubscribed_at', null)
    if (leadsError) {
      console.error('Falha ao buscar leads:', leadsError)
      return json({ error: 'Não foi possível buscar a lista de leads.' }, 500)
    }

    let sentCount = 0
    let failedCount = 0
    for (let i = 0; i < (pendingLeads ?? []).length; i += BATCH_SIZE) {
      const chunk = (pendingLeads ?? []).slice(i, i + BATCH_SIZE)
      const emails = chunk.map((lead) => ({
        from: EMAIL_FROM,
        to: lead.email,
        subject: '🖤 Black Friday Studio 18 — até 30% OFF (e some em breve)',
        html: blackFridayEmailHtml(`${FUNCTIONS_URL}/unsubscribe-lead?id=${lead.id}`),
      }))
      const results = await sendBatch(emails)
      const sentIds = chunk.filter((_, idx) => results[idx]).map((lead) => lead.id)
      failedCount += chunk.length - sentIds.length
      sentCount += sentIds.length
      if (sentIds.length > 0) {
        await supabase.from('leads').update({ blackfriday_email_sent_at: new Date().toISOString() }).in('id', sentIds)
      }
    }

    return json({ sent: sentCount, failed: failedCount })
  } catch (err) {
    console.error('Erro em send-blackfriday-campaign:', err)
    return json({ error: 'Erro inesperado ao disparar a campanha.' }, 500)
  }
})
