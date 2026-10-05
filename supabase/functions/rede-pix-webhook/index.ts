// Recebe as notificações de status do PIX da Rede e atualiza a venda
// correspondente no Supabase. A URL desta function precisa ser registrada
// junto à Rede — em produção, por telefone com o call center (informando
// CNPJ, PV, e-mail e esta URL); em sandbox, via
// POST v1/transactions/notification-URL (self-service, sem precisar ligar).
//
// Diferente do Mercado Pago, a notificação da Rede só traz o TID
// (data.id) — não o nosso próprio identificador de venda — por isso
// buscamos a venda por provider_payment_id em vez de "external_reference".
import { createClient } from 'npm:@supabase/supabase-js@2'

const REDE_PV = Deno.env.get('REDE_PV')!
const REDE_CLIENT_SECRET = Deno.env.get('REDE_CLIENT_SECRET')!
const REDE_ENV = Deno.env.get('REDE_ENV') ?? 'sandbox'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// v1 (PIX) — mesmo endpoint usado em rede-create-payment. O suporte da
// Rede confirmou (chamado RITM7838124/RITM7845169) que essa API não fala
// OAuth2: era isso que fazia essa consulta falhar silenciosamente (batia
// no endpoint v2 de cartão com um token que a v1 não reconhece), e por
// isso nenhum PIX confirmava sozinho — o status só nunca saía de
// "pendente" mesmo com o pagamento aprovado de verdade.
const REDE_URLS =
  REDE_ENV === 'production'
    ? { pixTransactions: 'https://api.userede.com.br/erede/v1/transactions' }
    : { pixTransactions: 'https://sandbox-erede.useredecloud.com.br/v1/transactions' }

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

function pixAuthHeader(): string {
  return `Basic ${btoa(`${REDE_PV.trim()}:${REDE_CLIENT_SECRET.trim()}`)}`
}

// Confirmado com uma transação real: o formato da resposta MUDA conforme o
// momento. Antes do pagamento, vem em qrCodeResponse.status ("Pending").
// Depois de pago, some o qrCodeResponse e aparece um bloco "authorization"
// novo, com o status em authorization.status ("Approved") — igual ao
// formato do cartão (v2). Por isso checa os dois campos.
function extractPixStatus(transaction: Record<string, unknown>): string | undefined {
  const authorization = transaction.authorization as { status?: string } | undefined
  const qrCodeResponse = transaction.qrCodeResponse as { status?: string } | undefined
  return authorization?.status ?? qrCodeResponse?.status
}

const PAID_STATUSES = new Set(['Approved', 'Paid', 'Concluded', 'Completed', 'Confirmed', 'Settled'])

function mapStatus(pixStatus: string | undefined): string {
  if (pixStatus && PAID_STATUSES.has(pixStatus)) return 'pago'
  return 'pendente'
}

// Baixa automática de estoque no momento em que a venda vira "pago" — antes
// disso, nenhum ponto do sistema descontava o estoque de uma venda feita
// pelo site (só a venda manual cadastrada no painel dava baixa). Confere se
// já existe uma saída pra essa venda antes de inserir, pra nunca dar baixa
// duas vezes (ex: webhook e o polling do check-pix-status confirmando quase
// ao mesmo tempo).
async function deductStockForSale(supabase: ReturnType<typeof createClient>, saleId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('inventory_movements')
    .select('id')
    .eq('sale_id', saleId)
    .eq('type', 'saida')
    .limit(1)
  if (existing && existing.length > 0) return

  const { data: items } = await supabase.from('sale_items').select('product_id, quantity').eq('sale_id', saleId)
  if (!items || items.length === 0) return

  const productIds = [...new Set(items.map((i: any) => i.product_id))]
  const { data: products } = await supabase.from('products').select('id, cost_price_brl').in('id', productIds)

  const movements = items.map((i: any) => ({
    product_id: i.product_id,
    type: 'saida',
    quantity: i.quantity,
    unit_cost_brl: products?.find((p: any) => p.id === i.product_id)?.cost_price_brl ?? null,
    container_id: null,
    sale_id: saleId,
    notes: 'Baixa automática por venda confirmada',
    moved_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('inventory_movements').insert(movements)
  if (error) console.error(`Falha ao dar baixa de estoque da venda ${saleId}:`, error)
}

Deno.serve(async (req) => {
  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    console.log('Notificação recebida da Rede:', JSON.stringify(body))
    const tid = body?.data?.id
    const events: string[] = body?.events ?? []

    if (!tid || !events.length) {
      return new Response('ok', { status: 200 })
    }

    const queryResponse = await fetch(`${REDE_URLS.pixTransactions}/${tid}`, {
      headers: { Authorization: pixAuthHeader() },
    })
    if (!queryResponse.ok) {
      console.error('Falha ao consultar transação PIX na Rede:', queryResponse.status, await queryResponse.text().catch(() => ''))
      return new Response('ok', { status: 200 })
    }
    const transaction = await queryResponse.json()
    console.log('Resposta da consulta PIX na Rede:', JSON.stringify(transaction))

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: existingSale } = await supabase
      .from('sales')
      .select('id, status, customer_name, customer_contact')
      .eq('provider_payment_id', String(tid))
      .maybeSingle()

    if (!existingSale) return new Response('ok', { status: 200 })

    const pixStatus = extractPixStatus(transaction)
    const newStatus = mapStatus(pixStatus)
    await supabase
      .from('sales')
      .update({
        provider_status: pixStatus ?? null,
        status: newStatus,
      })
      .eq('id', existingSale.id)

    // Só avisa por e-mail e dá baixa de estoque na transição pra "pago"
    // (evita reenviar em toda notificação repetida que a Rede manda pro
    // mesmo pagamento).
    if (existingSale.status !== 'pago' && newStatus === 'pago') {
      await deductStockForSale(supabase, existingSale.id)
    }
    if (existingSale.status !== 'pago' && newStatus === 'pago' && existingSale.customer_contact) {
      await sendEmail(
        existingSale.customer_contact,
        `Pagamento confirmado — Studio 18 #${existingSale.id.slice(0, 8)}`,
        emailShell(
          'Pagamento confirmado!',
          `<p>Olá, ${(existingSale.customer_name ?? '').split(' ')[0] || 'tudo bem'}! Recebemos a confirmação do pagamento do seu pedido <strong>#${existingSale.id.slice(0, 8)}</strong>.</p>
           <p>Já avisamos nossa equipe — seu set entra na fila de preparação para envio.</p>
           <p style="margin-top:24px;">
             <a href="${SITE_URL}/conta" style="color:#e6c778;">Acompanhe o status do envio em Minha Conta</a>
           </p>`,
        ),
      )
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    // A Rede reenvia se não receber 200 — evitamos loop de retry por erro
    // nosso respondendo 200 mesmo em falha, mas logamos no servidor pra
    // dar pra investigar (foi a falta desse log que atrasou achar o bug
    // do endpoint errado aqui embaixo).
    console.error('Erro no webhook do PIX:', err)
    return new Response('ok', { status: 200 })
  }
})
