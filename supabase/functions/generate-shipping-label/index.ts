// Compra e gera a etiqueta de envio de um pedido já pago, via Melhor Envio
// (Correios + transportadoras). Só a equipe (staff) pode chamar isso —
// verifica com is_staff() usando o token de quem fez a chamada, não o
// service role. Isso GASTA saldo de verdade da carteira do Melhor Envio,
// por isso só roda quando alguém clica no botão "Gerar etiqueta" no painel
// — nunca automaticamente.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// 'producao' (padrão) fala com a carteira real do Melhor Envio. 'sandbox'
// usa a conta de testes deles (saldo fake, sem gastar nada de verdade) —
// só pra validar coisas como o comportamento da chave de nota fiscal antes
// de confiar isso em produção. Nunca deixe 'sandbox' configurado por engano
// depois de terminar o teste, ou as etiquetas reais param de funcionar.
const MELHOR_ENVIO_ENV = Deno.env.get('MELHOR_ENVIO_ENV') ?? 'producao'
const MELHOR_ENVIO_BASE_URL = MELHOR_ENVIO_ENV === 'sandbox' ? 'https://sandbox.melhorenvio.com.br' : 'https://www.melhorenvio.com.br'
const MELHOR_ENVIO_TOKEN = (MELHOR_ENVIO_ENV === 'sandbox' ? Deno.env.get('MELHOR_ENVIO_SANDBOX_TOKEN') : Deno.env.get('MELHOR_ENVIO_TOKEN'))!
// Mesma secret que a emit-invoice usa — 'homologacao' (padrão) emite uma
// NF-e de teste, que a SEFAZ nunca autoriza de verdade. O Melhor Envio real
// (produção) rejeita a chave dessa nota de teste com "a nota fiscal deve
// ser modelo 55" (mensagem genérica — na prática é porque a nota não existe
// de verdade na SEFAZ, não porque o modelo esteja errado). Por isso só
// anexa a chave da nota quando FOCUS_NFE_ENV = 'producao'.
const FOCUS_NFE_ENV = Deno.env.get('FOCUS_NFE_ENV') ?? 'homologacao'

// --- E-mail transacional (Resend) — mesmo padrão do rede-create-payment ---
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

// Assim que a transportadora confirma o rastreio, esse é o sinal real de
// que o pedido saiu de verdade — o status vira "enviado" sozinho, exceto se
// já estiver num passo mais adiante (entregue/cancelado), pra não regredir.
function statusPatchOnTracking(currentStatus: string): Record<string, unknown> {
  return currentStatus === 'entregue' || currentStatus === 'cancelado' ? {} : { status: 'enviado' }
}

async function sendShippedEmail(saleId: string, customerName: string | null, customerContact: string, trackingCode: string): Promise<void> {
  await sendEmail(
    customerContact,
    `Seu pedido saiu para entrega — Studio 18 #${saleId.slice(0, 8)}`,
    emailShell(
      'Seu pedido está a caminho!',
      `<p>Olá, ${String(customerName ?? '').split(' ')[0] || 'tudo bem'}! O pedido <strong>#${saleId.slice(0, 8)}</strong> já foi postado e está a caminho.</p>
       <div style="margin:20px 0;padding:16px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;">
         <div style="font-size:12px;color:#7a766d;letter-spacing:0.05em;">CÓDIGO DE RASTREIO</div>
         <div style="margin-top:4px;font-size:16px;color:#e6c778;font-family:monospace;">${trackingCode}</div>
       </div>
       <p style="margin-top:20px;">
         <a href="${SITE_URL}/rastreio" style="color:#e6c778;">Acompanhe a entrega em ${SITE_URL}/rastreio</a>
       </p>`,
    ),
  )
}

const DEFAULT_BOX_CM = { length: 50, width: 35, height: 12 }

// Dados do remetente (Studio 18) que vão em toda etiqueta gerada. Sem o
// CNPJ configurado, a function barra com uma mensagem clara até
// SHIPPING_ORIGIN_DOCUMENT ser configurado como secret.
const ORIGIN = {
  name: Deno.env.get('SHIPPING_ORIGIN_NAME') ?? 'Studio 18',
  // CNPJ (pessoa jurídica) — a API do Melhor Envio usa um campo separado
  // de CPF (`document`) para isso, ver `company_document` no payload abaixo.
  companyDocument: (Deno.env.get('SHIPPING_ORIGIN_DOCUMENT') ?? '').replace(/\D/g, ''),
  phone: (Deno.env.get('SHIPPING_ORIGIN_PHONE') ?? '11981008013').replace(/\D/g, ''),
  email: Deno.env.get('SHIPPING_ORIGIN_EMAIL') ?? 'contato@studio18bricks.com.br',
  address: Deno.env.get('SHIPPING_ORIGIN_STREET') ?? 'Rua Francisco Pais',
  number: Deno.env.get('SHIPPING_ORIGIN_NUMBER') ?? '362',
  complement: Deno.env.get('SHIPPING_ORIGIN_COMPLEMENT') ?? '',
  district: Deno.env.get('SHIPPING_ORIGIN_NEIGHBORHOOD') ?? 'Jardim Ipanema',
  city: Deno.env.get('SHIPPING_ORIGIN_CITY') ?? 'São Paulo',
  state_abbr: Deno.env.get('SHIPPING_ORIGIN_STATE') ?? 'SP',
  postal_code: (Deno.env.get('SHIPPING_ORIGIN_ZIP') ?? '04784-080').replace(/\D/g, ''),
  country_id: 'BR',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function meFetch(path: string, body: unknown) {
  const res = await fetch(`${MELHOR_ENVIO_BASE_URL}/api/v2/me/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Studio 18 (contato@studio18bricks.com.br)',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, data }
}

// A API do Melhor Envio devolve erro em formatos diferentes dependendo do
// endpoint — às vezes {"message": "..."}, às vezes {"errors": {"campo":
// ["msg"]}}. Junta tudo numa string legível em vez de mostrar um erro
// genérico sem pista nenhuma do que houve.
function meErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback
  const d = data as Record<string, unknown>
  const parts: string[] = []
  if (typeof d.message === 'string') parts.push(d.message)
  if (d.errors && typeof d.errors === 'object') {
    for (const msgs of Object.values(d.errors as Record<string, unknown>)) {
      if (Array.isArray(msgs)) parts.push(...msgs.map(String))
      else if (typeof msgs === 'string') parts.push(msgs)
    }
  }
  if (parts.length === 0 && typeof d.error === 'string') parts.push(d.error)
  return parts.length > 0 ? parts.join(' | ') : fallback
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!ORIGIN.companyDocument) {
      return json({ error: 'CNPJ do remetente ainda não cadastrado (SHIPPING_ORIGIN_DOCUMENT). Configure essa secret no Supabase assim que o CNPJ sair.' }, 400)
    }

    // Confere que quem chamou é da equipe — usa o próprio token de quem fez
    // a requisição (não o service role) pra is_staff() checar auth.uid()
    // corretamente.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autenticado.' }, 401)
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: isStaff } = await callerClient.rpc('is_staff')
    if (!isStaff) return json({ error: 'Só a equipe pode gerar etiquetas.' }, 403)

    const { saleId } = await req.json()
    if (!saleId) return json({ error: 'saleId é obrigatório.' }, 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: sale, error: saleError } = await supabase.from('sales').select('*').eq('id', saleId).maybeSingle()
    if (saleError || !sale) return json({ error: 'Pedido não encontrado.' }, 404)

    // Trava de segurança: se já tem etiqueta gerada, devolve a existente em
    // vez de comprar (e cobrar) outra de novo — mas se ainda não tem código
    // de rastreio (a Melhor Envio só atribui depois que o objeto é
    // efetivamente postado na transportadora, não na hora de gerar a
    // etiqueta), tenta buscar de novo, sem gastar saldo nenhum.
    if (sale.shipping_label_url) {
      let trackingCode: string | null = sale.shipping_tracking_code
      if (!trackingCode && sale.melhor_envio_order_id) {
        const tracking = await meFetch('shipment/tracking', { orders: [sale.melhor_envio_order_id] })
        trackingCode = tracking.data?.[sale.melhor_envio_order_id]?.tracking ?? null
        if (trackingCode) {
          await supabase
            .from('sales')
            .update({ shipping_tracking_code: trackingCode, ...statusPatchOnTracking(sale.status) })
            .eq('id', saleId)
          if (sale.customer_contact) await sendShippedEmail(saleId, sale.customer_name, sale.customer_contact, trackingCode)
        }
      }
      return json({ labelUrl: sale.shipping_label_url, trackingCode, alreadyGenerated: true })
    }

    if (sale.status !== 'pago' && sale.status !== 'enviado') {
      return json({ error: 'Só é possível gerar etiqueta de pedidos pagos.' }, 400)
    }
    if (!sale.shipping_service_id) {
      return json({ error: 'Este pedido não tem o serviço de frete registrado (feito antes desse recurso existir). Gere a etiqueta manualmente no painel do Melhor Envio.' }, 400)
    }
    if (!sale.shipping_zip_code || !sale.shipping_street_name || !sale.shipping_street_number) {
      return json({ error: 'Endereço de entrega incompleto neste pedido.' }, 400)
    }
    if (!sale.customer_cpf || !sale.customer_phone) {
      return json({ error: 'CPF ou telefone do cliente ausente neste pedido (feito antes desse recurso existir).' }, 400)
    }

    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .select('quantity, unit_price_brl, product:products(name, weight_kg, length_cm, height_cm, width_cm)')
      .eq('sale_id', saleId)
    if (itemsError || !items || items.length === 0) {
      return json({ error: 'Itens do pedido não encontrados.' }, 404)
    }

    const products = items.map((it: any) => ({
      name: it.product?.name ?? 'Set Studio 18',
      quantity: it.quantity,
      unitary_value: Number(it.unit_price_brl),
    }))

    // Um volume por unidade — cada set técnico vai na própria caixa.
    const volumes = items.flatMap((it: any) =>
      Array.from({ length: it.quantity }, () => ({
        height: it.product?.height_cm ?? DEFAULT_BOX_CM.height,
        width: it.product?.width_cm ?? DEFAULT_BOX_CM.width,
        length: it.product?.length_cm ?? DEFAULT_BOX_CM.length,
        weight: Number(it.product?.weight_kg ?? 5),
      })),
    )

    const insuranceValue = items.reduce((t: number, it: any) => t + Number(it.unit_price_brl) * it.quantity, 0)

    const to = {
      name: sale.customer_name,
      phone: sale.customer_phone,
      email: sale.customer_contact,
      document: sale.customer_cpf,
      address: sale.shipping_street_name,
      number: sale.shipping_street_number,
      complement: sale.shipping_complement || undefined,
      district: sale.shipping_neighborhood,
      city: sale.shipping_city,
      state_abbr: sale.shipping_federal_unit,
      postal_code: sale.shipping_zip_code,
      country_id: 'BR',
    }

    const from = {
      name: ORIGIN.name,
      phone: ORIGIN.phone,
      email: ORIGIN.email,
      company_document: ORIGIN.companyDocument,
      address: ORIGIN.address,
      number: ORIGIN.number,
      complement: ORIGIN.complement || undefined,
      district: ORIGIN.district,
      city: ORIGIN.city,
      state_abbr: ORIGIN.state_abbr,
      postal_code: ORIGIN.postal_code,
      country_id: ORIGIN.country_id,
    }

    // Só usa a chave da nota se ela for de uma NF-e real (produção) — uma
    // chave de homologação nunca existiu de verdade na SEFAZ, então o
    // Melhor Envio real rejeita ela (ver comentário no FOCUS_NFE_ENV acima).
    const usableInvoiceKey = FOCUS_NFE_ENV === 'producao' ? sale.invoice_key : null

    // 1. Adiciona ao carrinho do Melhor Envio.
    const cart = await meFetch('cart', {
      service: Number(sale.shipping_service_id),
      from,
      to,
      products,
      volumes,
      options: {
        // O Melhor Envio só aceita chave de nota no campo "invoice" quando é
        // NF-e modelo 55 (não NFC-e modelo 65, confirmado com o suporte) —
        // é por isso que a emit-invoice emite NF-e agora. Sem a chave, o
        // envio é classificado como "não comercial" (declaração de
        // conteúdo) e o seguro trava em R$1.000; com ela, cobre o valor
        // integral do pedido.
        insurance_value: usableInvoiceKey ? insuranceValue : Math.min(insuranceValue, 1000),
        receipt: false,
        own_hand: false,
        non_commercial: !usableInvoiceKey,
        ...(usableInvoiceKey ? { invoice: { key: usableInvoiceKey } } : {}),
        platform: 'Studio 18',
      },
    })
    if (!cart.ok || !cart.data?.id) {
      console.error('Falha ao adicionar ao carrinho Melhor Envio:', cart.data)
      return json({ error: meErrorMessage(cart.data, 'Não foi possível adicionar o frete ao carrinho do Melhor Envio.') }, 502)
    }
    const cartItemId = cart.data.id as string

    // 2. Paga com o saldo da carteira.
    const checkout = await meFetch('shipment/checkout', { orders: [cartItemId] })
    if (!checkout.ok) {
      console.error('Falha ao pagar frete (checkout) no Melhor Envio:', checkout.data)
      return json({ error: meErrorMessage(checkout.data, 'Não foi possível pagar o frete — confira o saldo da carteira do Melhor Envio.') }, 502)
    }

    // 3. Gera a etiqueta.
    const generate = await meFetch('shipment/generate', { orders: [cartItemId] })
    if (!generate.ok) {
      console.error('Falha ao gerar etiqueta no Melhor Envio:', generate.data)
      return json({ error: meErrorMessage(generate.data, 'Frete pago, mas falhou ao gerar a etiqueta. Gere manualmente no painel do Melhor Envio.') }, 502)
    }
    // Log temporário — o nome exato do campo com o código de rastreio na
    // resposta desse endpoint não está confirmado (sem acesso à doc oficial
    // daqui). Se o trackingCode sair null mesmo com a etiqueta OK, olhe esse
    // log em Functions → generate-shipping-label → Logs no Supabase pra
    // achar o campo certo.
    console.log('Resposta shipment/generate:', JSON.stringify(generate.data))

    // 4. Busca o PDF pra impressão.
    const print = await meFetch('shipment/print', { orders: [cartItemId], mode: 'private' })
    const labelUrl: string | null = print.data?.url ?? null

    let trackingCode: string | null = generate.data?.[cartItemId]?.tracking ?? generate.data?.tracking ?? null

    // Fallback: se não veio no shipment/generate, tenta o endpoint dedicado
    // de rastreio (mesmo padrão dos outros passos: POST com {orders: [id]}).
    if (!trackingCode) {
      const tracking = await meFetch('shipment/tracking', { orders: [cartItemId] })
      console.log('Resposta shipment/tracking:', JSON.stringify(tracking.data))
      trackingCode = tracking.data?.[cartItemId]?.tracking ?? null
    }

    await supabase
      .from('sales')
      .update({
        melhor_envio_order_id: cartItemId,
        shipping_label_url: labelUrl,
        shipping_tracking_code: trackingCode,
        ...(trackingCode ? statusPatchOnTracking(sale.status) : {}),
      })
      .eq('id', saleId)

    if (trackingCode && sale.customer_contact) {
      await sendShippedEmail(saleId, sale.customer_name, sale.customer_contact, trackingCode)
    }

    return json({ labelUrl, trackingCode })
  } catch (err) {
    console.error('Erro ao gerar etiqueta:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado ao gerar etiqueta.' }, 500)
  }
})
