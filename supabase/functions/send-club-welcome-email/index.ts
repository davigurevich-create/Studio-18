// Dispara o e-mail de boas-vindas ao clube assim que o cliente atinge a
// pontuação de algum clube (10K/25K/50K/75K/100K) — chamado pelo front-end
// (Conta.tsx/Checkout.tsx) toda vez que a sessão carrega, mas só envia de
// verdade na primeira chamada depois de cruzar o nível: quem decide isso é
// o banco (check_new_club_milestone(), 121), nunca o cliente — a function
// chama o RPC com o JWT de quem está logado e só manda e-mail se o banco
// disser que é um marco novo (is_new = true), fechando a brecha de alguém
// chamar isso repetido só pra spammar o próprio e-mail.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
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
    if (!authHeader) {
      return json({ error: 'É preciso estar logado.' }, 401)
    }

    // O RPC roda com o JWT de quem chamou (igual a uma chamada normal do
    // supabase-js do site) — é o próprio banco quem decide se é um marco
    // novo, nunca o payload desta request.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data, error } = await userClient.rpc('check_new_club_milestone')
    if (error) {
      console.error('Falha ao checar marco de clube:', error)
      return json({ isNewClub: false }, 200)
    }
    const row = (data ?? [])[0] as
      | { is_new: boolean; club_name: string | null; discount_pct: number | null; customer_email: string | null; display_name: string | null }
      | undefined
    if (!row?.is_new || !row.customer_email) {
      return json({ isNewClub: false })
    }

    const firstName = (row.display_name ?? 'tudo bem').split(' ')[0]
    await sendEmail(
      row.customer_email,
      `Bem-vindo ao ${row.club_name} — Studio 18`,
      emailShell(
        `Parabéns, você entrou no ${row.club_name}! 🏆`,
        `<p>Olá, ${firstName}! Sua coleção acabou de cruzar a pontuação do <strong style="color:#e6c778;">${row.club_name}</strong> — obrigado pela confiança em cada peça que você já montou com a gente.</p>
         <p>Como reconhecimento, seu benefício de <strong style="color:#e6c778;">${row.discount_pct}% OFF</strong> já foi ativado automaticamente na sua conta: ele entra sozinho no carrinho assim que você for ao checkout, e acumula com qualquer outro cupom que você usar na mesma compra.</p>
         <p style="margin-top:20px;"><a href="${SITE_URL}/conta" style="color:#e6c778;">Veja seu status e seus selos em Minha Conta</a></p>`,
      ),
    )

    return json({ isNewClub: true, clubName: row.club_name, discountPct: row.discount_pct })
  } catch (err) {
    console.error('Erro em send-club-welcome-email:', err)
    return json({ isNewClub: false }, 200)
  }
})
