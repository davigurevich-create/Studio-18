// Recebe o e-mail do pop-up de boas-vindas do site: grava em `leads` e
// manda o e-mail com o cupom (o pop-up promete isso na tela, então precisa
// realmente acontecer — antes só gravava na tabela, sem enviar nada).
// Pública (sem login, é pra visitante anônimo), mesmo padrão de validação
// simples do resto do site pra esse tipo de captura de e-mail de baixo
// risco (sem dado sensível envolvido).
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// --- E-mail transacional (Resend) — mesmo padrão do submit-part-request ---
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Studio 18 <onboarding@resend.dev>'
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://studio18.vercel.app'
const WELCOME_COUPON_CODE = 'ENTREINOFLOW10'

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

// E-mail em tabela (não div) com bgcolor explícito em cada célula — Outlook
// desktop (engine do Word) ignora/falha em aplicar background de CSS em
// <div> de forma consistente, o que fazia o fundo escuro "sumir" em
// pedaços e a mensagem chegar com listras pretas/brancas quebradas pra
// quem usa o Outlook no tema claro do Windows. Tabela com bgcolor (atributo
// HTML, não CSS) é o jeito confiável de garantir a mesma aparência em
// qualquer cliente de e-mail, independente do tema do sistema da pessoa —
// as meta tags de color-scheme reforçam isso nos clientes mais modernos.
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

interface RequestBody {
  email: string
  source?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, source }: RequestBody = await req.json()
    const cleanEmail = (email ?? '').trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length > 200) {
      return json({ error: 'E-mail inválido.' }, 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: existing } = await supabase.from('leads').select('id').eq('email', cleanEmail).maybeSingle()

    if (!existing) {
      const { error } = await supabase.from('leads').insert({ email: cleanEmail, source: source || 'popup_boas_vindas' })
      if (error) return json({ error: 'Não foi possível registrar seu e-mail agora.' }, 500)
    }

    // Manda o e-mail sempre, mesmo se já estava na lista — a pessoa pode ter
    // perdido o cupom da primeira vez e estar tentando de novo.
    await sendEmail(
      cleanEmail,
      'Seu cupom de 10% — Studio 18',
      emailShell(
        'Seu cupom chegou!',
        `<p>Obrigado por entrar pra nossa lista. Use o código abaixo pra garantir <strong>10% de desconto</strong> na sua primeira compra:</p>
         <p style="margin:16px 0;padding:16px;text-align:center;border-radius:8px;background:rgba(230,199,120,0.08);border:1px solid rgba(205,164,77,0.35);">
           <span style="font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:22px;font-weight:700;letter-spacing:0.08em;color:#e6c778;">${WELCOME_COUPON_CODE}</span>
         </p>
         <p>Aplique esse código no campo de cupom durante o checkout.</p>
         <p style="margin-top:20px;">
           <a href="${SITE_URL}/#colecao" style="color:#e6c778;">Ver a coleção completa</a>
         </p>`,
      ),
    )

    return json({ ok: true })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado.' }, 500)
  }
})
