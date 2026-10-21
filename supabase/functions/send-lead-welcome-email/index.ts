// Roda 1x por dia via pg_cron (ver migration 103_leads_welcome_personal_email.sql)
// — manda a mensagem pessoal do Rubens (primeiro e-mail da sequência de
// nutrição) pra leads com 1+ dia desde o cadastro que ainda não a
// receberam. O cupom de boas-vindas já é mandado na hora pelo submit-lead;
// esse aqui é o toque pessoal que vem um pouco depois.
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
const DAYS_AFTER_SIGNUP = 1

// Esse e-mail é pra parecer escrito à mão pelo Rubens, não um disparo da
// marca — por isso o remetente usa o nome dele, mesmo endereço verificado
// no Resend do EMAIL_FROM padrão.
const DEFAULT_FROM = Deno.env.get('EMAIL_FROM') ?? 'Studio 18 <onboarding@resend.dev>'
const EMAIL_FROM = Deno.env.get('LEAD_WELCOME_EMAIL_FROM') ?? DEFAULT_FROM.replace(/^[^<]+/, 'Rubens Gurevich ')

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

// Assinatura oficial do Rubens (mesmo arquivo HTML usado no e-mail pessoal
// dele fora do sistema) — colada aqui tal como fornecida.
const RUBENS_SIGNATURE = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial, Helvetica, sans-serif">
    <tbody>
        <tr>
            <td style="background-color:rgb(10, 10, 10); border-radius:10px; padding:16px 20px; vertical-align:middle">
                <img src="https://zmdownload-accl.zoho.com/zm/ImageSignature?fileName=logo-studio18-definitive.png&amp;accountId=8311779000000008002&amp;storeName=940337290&amp;frm=s&amp;fileId=59ce068365c269f3698e0" width="140" alt="Studio 18" style="display:block; border:0; outline:none">
            </td>
            <td style="width:18px; line-height:1px; font-size:1px">
                &nbsp;
                <br>
            </td>
            <td style="border-left:2px solid rgb(205, 164, 77); padding-left:18px; vertical-align:middle">
                <div style="font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:bold; color:rgb(26, 26, 26)">
                    Rubens Gurevich
                    <br>
                </div>
                <div style="font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; color:rgb(169, 121, 58); margin-top:3px">
                    Fundador · Studio 18
                    <br>
                </div>
                <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:rgb(91, 91, 91); margin-top:10px; line-height:20px">
                    <div>
                        <a href="https://wa.me/5511983134664" style="color:rgb(91, 91, 91); text-decoration:none" target="_blank">
                            WhatsApp (11) 98313-4664
                        </a>
                        <br>
                    </div>
                    <div>
                        <a href="https://www.instagram.com/studio18_bricks/" style="color:rgb(91, 91, 91); text-decoration:none" target="_blank">
                            Instagram @studio18_bricks
                        </a>
                        <br>
                    </div>
                    <div>
                        <a href="https://studio18bricks.com.br" style="color:rgb(169, 121, 58); text-decoration:none; font-weight:bold" target="_blank">
                            studio18bricks.com.br
                        </a>
                        <br>
                    </div>
                </div>
            </td>
        </tr>
    </tbody>
</table>`

// Deliberadamente simples (sem o template escuro de marca usado nos outros
// e-mails transacionais) — o objetivo aqui é parecer um e-mail pessoal real
// escrito pelo Rubens, não uma peça de comunicação da empresa.
function personalEmailShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background:#ffffff;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
            <tr>
              <td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#1a1a1a;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding-top:28px;">
                ${RUBENS_SIGNATURE}
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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const cutoff = new Date(Date.now() - DAYS_AFTER_SIGNUP * 24 * 60 * 60 * 1000).toISOString()

    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, email')
      .is('welcome_personal_email_sent_at', null)
      .lte('created_at', cutoff)

    if (error) {
      console.error('Falha ao buscar leads elegíveis pro e-mail pessoal:', error)
      return json({ error: error.message }, 500)
    }
    if (!leads || leads.length === 0) return json({ sent: 0 })

    let sentCount = 0
    for (const lead of leads) {
      await sendEmail(
        lead.email,
        'Obrigado por se interessar no Studio 18!',
        personalEmailShell(
          'Obrigado por se interessar no Studio 18!',
          `<p>Oi, tudo bem?</p>
           <p>Aqui é o Rubens, fundador do Studio 18. Antes de mais nada, muito obrigado por ter deixado seu e-mail com a gente — isso significa que, de alguma forma, o que a gente está construindo chamou sua atenção, e eu não ia deixar isso passar sem pelo menos me apresentar de verdade.</p>
           <p>O Studio 18 começou de um jeito bem simples: eu sempre fui apaixonado por blocos de montar técnicos — aquele tipo de set que não é só um brinquedo, é um projeto de engenharia em miniatura, com peças que encaixam em lugares improváveis até formar algo que parece ter saído de uma vitrine. Montar um desses sempre foi, pra mim, uma das poucas coisas que me tiravam completamente da rotina.</p>
           <p>O problema é que, no Brasil, ter acesso a esses modelos de altíssima qualidade sempre foi complicado: ou vinha de fora com frete e impostos impagáveis, ou demorava meses, ou simplesmente não existia um lugar de confiança para comprar. Eu senti isso na pele, e imaginei que outros colecionadores — gente como eu, que só queria viver essa experiência sem drama — sentiam o mesmo.</p>
           <p>Foi daí que nasceu o Studio 18: a vontade de trazer pra outros colecionadores o mesmo prazer que eu sinto ao montar um set, com peças de altíssima qualidade, preço justo e, o mais importante, pronta entrega aqui dentro do Brasil. Sem esperar dois meses, sem pagar fortuna em frete internacional, sem torcer para a encomenda não ficar retida.</p>
           <p>Você já deu o primeiro passo só por estar aqui. Nos próximos dias vou te mandar mais algumas coisas — um pouco da nossa história, o que nossos colecionadores têm falado, e claro, novidades do nosso catálogo. Mas queria que esse primeiro contato fosse só isso: um "oi, muito obrigado, e seja bem-vindo".</p>
           <p>Um abraço,</p>`,
        ),
      )
      await supabase.from('leads').update({ welcome_personal_email_sent_at: new Date().toISOString() }).eq('id', lead.id)
      sentCount++
    }

    return json({ sent: sentCount })
  } catch (err) {
    console.error('Erro ao mandar e-mail pessoal de boas-vindas:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado.' }, 500)
  }
})
