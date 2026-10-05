// Recebe solicitações de reposição de peças faltantes vindas da área logada
// do cliente (site) e registra em part_requests. Sempre gratuito para o
// cliente — a equipe acompanha e atualiza o status pelo painel de gestão.
//
// Exige sessão ativa (o supabase-js do site já manda o JWT do usuário
// logado automaticamente) e confere que o pedido escolhido (orderId)
// realmente pertence ao e-mail autenticado antes de aceitar — nome/e-mail
// do cliente vêm da sessão verificada, nunca do que o formulário mandar.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
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

type ReplacementType = 'impressao_3d' | 'original_fabricante'

interface RequestBody {
  orderId: string
  productModel: string
  partDescription: string
  replacementType: ReplacementType
  photoUrl?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'É preciso estar logado para enviar uma solicitação.' }, 401)
    }

    // Cliente com o JWT do usuário — usado só para descobrir quem está
    // logado (auth.getUser()), nunca para consultar tabelas diretamente.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user?.email) {
      return json({ error: 'Sessão inválida ou expirada. Faça login novamente.' }, 401)
    }

    const body: RequestBody = await req.json()
    const { orderId, productModel, partDescription, replacementType, photoUrl } = body

    if (
      !orderId ||
      !productModel ||
      !partDescription ||
      (replacementType !== 'impressao_3d' && replacementType !== 'original_fabricante')
    ) {
      return json({ error: 'Dados obrigatórios ausentes.' }, 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Confere que o pedido escolhido pertence mesmo ao e-mail autenticado —
    // fecha a brecha de qualquer um "digitar" um número de pedido qualquer.
    const { data: order, error: orderError } = await supabase
      .from('sales')
      .select('id, customer_contact')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order || order.customer_contact?.toLowerCase() !== user.email.toLowerCase()) {
      return json({ error: 'Pedido não encontrado para esse usuário.' }, 404)
    }

    const customerName = user.user_metadata?.name || user.email.split('@')[0]
    const customerEmail = user.email
    const orderReference = orderId.slice(0, 8)

    const { data: created, error } = await supabase
      .from('part_requests')
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        order_id: orderId,
        order_reference: orderReference,
        product_model: productModel,
        part_description: partDescription,
        replacement_type: replacementType,
        photo_url: photoUrl || null,
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
         ${photoUrl ? `<img src="${photoUrl}" alt="Foto da peça" style="max-width:100%;border-radius:8px;margin-bottom:16px;" />` : ''}
         ${replacementBlockHtml}
         <p style="margin-top:20px;">Número do pedido original: ${orderReference}</p>
         <p style="margin-top:24px;">
           <a href="${SITE_URL}/conta" style="color:#e6c778;">Acompanhe o status a qualquer momento em Minha Conta</a>
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
