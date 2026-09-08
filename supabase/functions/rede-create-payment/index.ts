// Cria uma cobrança na Rede/e.Rede (PIX ou cartão) e registra o pedido como
// uma venda "pendente" no Supabase. PV e client secret ficam só aqui
// (variáveis de ambiente da function), nunca no site.
//
// Diferenças importantes em relação ao mp-create-payment (Mercado Pago):
// - Não existe um componente tipo o Bricks pra tokenizar o cartão no
//   navegador do cliente — o número do cartão chega até aqui (o front manda
//   direto pra esta function, nunca fica salvo em lugar nenhum).
// - A Rede usa OAuth2 (client_credentials) em vez de um token fixo — o
//   access_token expira em 24 minutos, então pedimos um novo a cada request
//   em vez de tentar cachear entre invocações.
// - Boleto não existe aqui — não faz parte do negócio.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const REDE_PV = Deno.env.get('REDE_PV')!
const REDE_CLIENT_SECRET = Deno.env.get('REDE_CLIENT_SECRET')!
// 'sandbox' (padrão) ou 'production' — trocar só isso quando migrarmos pra valer
const REDE_ENV = Deno.env.get('REDE_ENV') ?? 'sandbox'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const REDE_URLS =
  REDE_ENV === 'production'
    ? { auth: 'https://api.userede.com.br/redelabs/oauth2/token', transactions: 'https://api.userede.com.br/erede/v2/transactions' }
    : { auth: 'https://rl7-sandbox-api.useredecloud.com.br/oauth2/token', transactions: 'https://sandbox-erede.useredecloud.com.br/v2/transactions' }

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

type PaymentMethod = 'pix' | 'cartao'

// Desconto de 10% para pagamento à vista no PIX — mesmo valor usado no
// front-end (site/src/lib/pricing.ts).
const PIX_DISCOUNT = 0.1
function pixPrice(fullPrice: number): number {
  return Math.round(fullPrice * (1 - PIX_DISCOUNT) * 100) / 100
}

interface Address {
  zipCode: string
  streetName: string
  streetNumber: string
  complement?: string
  neighborhood: string
  city: string
  federalUnit: string
}

interface CheckoutItem {
  productId: string
  quantity: number
  withMotor?: boolean
}

interface CardInput {
  number: string
  holderName: string
  expirationMonth: number
  expirationYear: number
  securityCode: string
}

interface RequestBody {
  items: CheckoutItem[]
  customerName: string
  customerEmail: string
  customerCpf: string
  customerPhone: string
  paymentMethod: PaymentMethod
  // só para cartão — nunca fica salvo, só repassado pra Rede
  card?: CardInput
  installments?: number
  address: Address
  couponCode?: string
  shipping?: { id: number; service: string; company: string; price: number; deliveryDays: string }
  turnstileToken?: string | null
}

const TURNSTILE_SECRET_KEY = Deno.env.get('TURNSTILE_SECRET_KEY')

async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) return true
  if (!token) {
    console.error('Turnstile: nenhum token recebido do navegador.')
    return false
  }
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: TURNSTILE_SECRET_KEY, response: token }),
    })
    const data = await res.json().catch(() => null)
    if (!data?.success) {
      console.error('Turnstile recusou o token:', JSON.stringify(data))
    }
    return Boolean(data?.success)
  } catch (err) {
    console.error('Turnstile: erro ao chamar siteverify:', err)
    return false
  }
}

// OAuth2 client_credentials — PV faz o papel de clientId, a chave de
// integração gerada no portal é o clientSecret. Token dura 24 minutos;
// como cada invocação da function é curta, pedimos um novo sempre (sem
// cache) em vez de arriscar usar um expirado.
async function getRedeAccessToken(): Promise<string> {
  const res = await fetch(REDE_URLS.auth, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${REDE_PV}:${REDE_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.access_token) {
    console.error('Falha ao gerar access_token da Rede:', res.status, JSON.stringify(data))
    throw new Error('Não foi possível autenticar com a Rede.')
  }
  return data.access_token as string
}

// "00" = sucesso em qualquer transação da Rede (cartão ou pix)
function mapStatus(returnCode: string | undefined): string {
  return returnCode === '00' ? 'pago' : 'pendente'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const {
      items,
      customerName,
      customerEmail,
      customerCpf,
      customerPhone,
      paymentMethod,
      card,
      installments,
      address,
      couponCode,
      shipping,
      turnstileToken,
    } = body

    if (!items?.length || !customerName || !customerEmail || !customerCpf || !customerPhone || !paymentMethod || !address) {
      return json({ error: 'Dados obrigatórios ausentes.' }, 400)
    }
    if (!shipping || !(shipping.price >= 0)) {
      return json({ error: 'Selecione uma opção de frete.' }, 400)
    }
    if (paymentMethod === 'cartao' && (!card?.number || !card.expirationMonth || !card.expirationYear || !card.securityCode)) {
      return json({ error: 'Dados do cartão incompletos.' }, 400)
    }
    if (!(await verifyTurnstile(turnstileToken))) {
      return json({ error: 'Não foi possível verificar que você não é um robô. Recarregue a página e tente de novo.' }, 403)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sale_price_brl, motor_product_id')
      .in('id', items.map((i) => i.productId))
    if (productsError || !products || products.length !== items.length) {
      return json({ error: 'Um ou mais produtos não foram encontrados.' }, 404)
    }

    const motorProductIds = items
      .map((i) => {
        if (!i.withMotor) return null
        return products.find((p) => p.id === i.productId)?.motor_product_id ?? null
      })
      .filter((id): id is string => Boolean(id))

    const { data: motorProducts } = motorProductIds.length
      ? await supabase.from('products').select('id, name, sale_price_brl').in('id', motorProductIds)
      : { data: [] as { id: string; name: string; sale_price_brl: number }[] }

    const lineItems = items.map((i) => {
      const product = products.find((p) => p.id === i.productId)!
      const fullUnitPrice = Number(product.sale_price_brl)
      const unitPrice = paymentMethod === 'pix' ? pixPrice(fullUnitPrice) : fullUnitPrice
      return { product, quantity: i.quantity, unitPrice, fullUnitPrice }
    })

    for (const i of items) {
      if (!i.withMotor) continue
      const product = products.find((p) => p.id === i.productId)!
      if (!product.motor_product_id) continue
      const motor = motorProducts?.find((m) => m.id === product.motor_product_id)
      if (!motor) continue
      const fullUnitPrice = Number(motor.sale_price_brl)
      const unitPrice = paymentMethod === 'pix' ? pixPrice(fullUnitPrice) : fullUnitPrice
      lineItems.push({ product: motor, quantity: i.quantity, unitPrice, fullUnitPrice })
    }

    let appliedCoupon: { id: string; code: string; uses_count: number; kind: string; ownerUserId: string | null } | null = null
    let couponDiscountPct = 0
    if (couponCode) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('id, code, discount_pct, active, max_uses, uses_count, expires_at, kind, owner_user_id')
        .ilike('code', couponCode)
        .maybeSingle()
      const isValid =
        coupon &&
        coupon.active &&
        (coupon.expires_at === null || new Date(coupon.expires_at) > new Date()) &&
        (coupon.max_uses === null || coupon.uses_count < coupon.max_uses)
      if (isValid) {
        appliedCoupon = {
          id: coupon.id,
          code: coupon.code,
          uses_count: coupon.uses_count,
          kind: coupon.kind,
          ownerUserId: coupon.owner_user_id,
        }
        couponDiscountPct = Number(coupon.discount_pct)
      }
    }

    const fullTotalAmount = lineItems.reduce((t, li) => t + li.fullUnitPrice * li.quantity, 0)
    const pixAdjustedTotal = lineItems.reduce((t, li) => t + li.unitPrice * li.quantity, 0)
    const productsTotal =
      couponDiscountPct > 0
        ? Math.round(pixAdjustedTotal * (1 - couponDiscountPct / 100) * 100) / 100
        : pixAdjustedTotal
    const shippingCost = Math.round(shipping.price * 100) / 100
    const totalAmount = Math.round((productsTotal + shippingCost) * 100) / 100
    const discountAmount = Math.round((fullTotalAmount - productsTotal) * 100) / 100
    const description =
      lineItems.length === 1
        ? lineItems[0].product.name
        : `${lineItems.reduce((t, li) => t + li.quantity, 0)} itens — ${lineItems.map((li) => li.product.name).join(', ')}`.slice(0, 250)

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        sale_date: new Date().toISOString(),
        channel: 'site',
        customer_name: customerName,
        customer_contact: customerEmail,
        customer_cpf: customerCpf.replace(/\D/g, ''),
        customer_phone: customerPhone.replace(/\D/g, ''),
        payment_method: paymentMethod,
        status: 'pendente',
        payment_provider: 'rede',
        shipping_cost_brl: shippingCost,
        shipping_service: `${shipping.company} ${shipping.service}`.trim(),
        shipping_service_id: String(shipping.id),
        shipping_days: shipping.deliveryDays,
        discount_brl: discountAmount,
        notes: `Pedido feito pelo site — ${description}`,
        shipping_zip_code: address.zipCode.replace(/\D/g, ''),
        shipping_street_name: address.streetName,
        shipping_street_number: address.streetNumber,
        shipping_complement: address.complement || null,
        shipping_neighborhood: address.neighborhood,
        shipping_city: address.city,
        shipping_federal_unit: address.federalUnit,
        coupon_code: appliedCoupon?.code ?? null,
      })
      .select()
      .single()
    if (saleError || !sale) {
      console.error('Falha ao inserir venda:', saleError)
      return json({ error: 'Não foi possível registrar o pedido.' }, 500)
    }

    if (appliedCoupon) {
      await supabase.from('coupons').update({ uses_count: appliedCoupon.uses_count + 1 }).eq('id', appliedCoupon.id)

      if (appliedCoupon.kind === 'referral_code' && appliedCoupon.ownerUserId) {
        const REFERRAL_REWARD_PCT = 5
        const rewardCode = `OBRIGADO-${sale.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`
        const { error: rewardError } = await supabase.from('coupons').insert({
          code: rewardCode,
          discount_pct: REFERRAL_REWARD_PCT,
          active: true,
          max_uses: 1,
          kind: 'referral_reward',
          owner_user_id: appliedCoupon.ownerUserId,
          source_referral_code: appliedCoupon.code,
        })
        if (rewardError) console.error('Falha ao gerar cupom de recompensa por indicação:', rewardError)
      }
    }

    await supabase.from('sale_items').insert(
      lineItems.map((li) => ({
        sale_id: sale.id,
        product_id: li.product.id,
        quantity: li.quantity,
        unit_price_brl: li.unitPrice,
        unit_cost_brl: 0,
      })),
    )

    // campo "reference" da Rede aceita só até 16 alfanuméricos — não cabe
    // um UUID inteiro, então usamos um recorte dele (só pra referência
    // legível; quem identifica a venda de fato é o nosso sale.id/tid)
    const shortReference = sale.id.replace(/-/g, '').slice(0, 16)
    const amountInCents = Math.round(totalAmount * 100)

    const accessToken = await getRedeAccessToken()

    let redeBody: Record<string, unknown>
    if (paymentMethod === 'pix') {
      const expiration = new Date(Date.now() + 30 * 60 * 1000) // QR Code válido por 30 minutos
      redeBody = {
        kind: 'pix',
        reference: shortReference,
        amount: amountInCents,
        // nome de campo confirmado pela mensagem de erro real da Rede
        // ("QrCode: Expiration Date parameter missing") — a doc em PDF
        // tinha esse campo grafado errado ("Date timeExpiration")
        qrCode: { 'Expiration Date': expiration.toISOString().slice(0, 19) },
      }
    } else {
      redeBody = {
        capture: true,
        kind: 'credit',
        reference: shortReference,
        amount: amountInCents,
        installments: installments ?? 1,
        cardholderName: card!.holderName,
        cardNumber: card!.number,
        expirationMonth: card!.expirationMonth,
        expirationYear: card!.expirationYear,
        securityCode: card!.securityCode,
      }
    }

    const redeResponse = await fetch(REDE_URLS.transactions, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(redeBody),
    })
    const payment = await redeResponse.json().catch(() => null)

    if (!redeResponse.ok || !payment) {
      console.error('Falha na chamada à Rede:', redeResponse.status, JSON.stringify(payment))
      await supabase.from('sales').update({ status: 'cancelado', provider_status: 'error' }).eq('id', sale.id)
      return json({ error: payment?.returnMessage ?? 'Falha ao criar pagamento na Rede.' }, 502)
    }

    // resposta da Rede: cartão tem "returnCode" na raiz; pix tem
    // "returnCode" na raiz também (referente à criação do QR Code — o
    // status de PAGAMENTO em si só chega depois, pelo webhook)
    const finalStatus = paymentMethod === 'pix' ? 'pendente' : mapStatus(payment.returnCode)

    if (paymentMethod === 'cartao' && payment.returnCode !== '00') {
      await supabase
        .from('sales')
        .update({ status: 'cancelado', provider_status: payment.returnCode, provider_payment_id: payment.tid ? String(payment.tid) : null })
        .eq('id', sale.id)
      return json({ error: payment.returnMessage ?? 'Pagamento recusado pela operadora do cartão.' }, 402)
    }

    await supabase
      .from('sales')
      .update({
        provider_payment_id: payment.tid ? String(payment.tid) : null,
        provider_status: payment.returnCode ?? null,
        status: finalStatus,
      })
      .eq('id', sale.id)

    const itemsListHtml = lineItems
      .map(
        (li) =>
          `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span>${li.quantity}x ${li.product.name}</span>
            <span>R$ ${(li.unitPrice * li.quantity).toFixed(2).replace('.', ',')}</span>
          </div>`,
      )
      .join('')

    const discountLabel = [
      paymentMethod === 'pix' ? 'à vista no PIX (10%)' : null,
      appliedCoupon ? `cupom ${appliedCoupon.code} (${couponDiscountPct}%)` : null,
    ]
      .filter(Boolean)
      .join(' + ')
    const discountRowHtml =
      discountAmount > 0
        ? `<div style="display:flex;justify-content:space-between;padding:6px 0;color:#8fce8f;">
            <span>Desconto ${discountLabel}</span><span>-R$ ${discountAmount.toFixed(2).replace('.', ',')}</span>
          </div>`
        : ''
    const shippingRowHtml = `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span>Frete — ${shipping.company} ${shipping.service}</span><span>R$ ${shippingCost.toFixed(2).replace('.', ',')}</span>
          </div>`

    const paymentBlockHtml =
      paymentMethod === 'pix'
        ? '<p>Pague com o PIX Copia e Cola ou o QR Code que enviamos na tela de confirmação. Assim que o pagamento for identificado, você recebe um novo e-mail confirmando.</p>'
        : '<p style="color:#8fce8f;">Pagamento aprovado! Seu pedido já está confirmado.</p>'

    await sendEmail(
      customerEmail,
      `Pedido recebido — Studio 18 #${sale.id.slice(0, 8)}`,
      emailShell(
        'Recebemos seu pedido!',
        `<p>Olá, ${customerName.split(' ')[0]}! Seu pedido <strong>#${sale.id.slice(0, 8)}</strong> foi registrado com sucesso.</p>
         <div style="margin:16px 0;">${itemsListHtml}${shippingRowHtml}${discountRowHtml}</div>
         <div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:700;color:#f3f1ec;">
           <span>Total</span><span>R$ ${totalAmount.toFixed(2).replace('.', ',')}</span>
         </div>
         ${paymentBlockHtml}
         <p style="margin-top:20px;">Entrega para: ${address.streetName}, ${address.streetNumber}${address.complement ? ` — ${address.complement}` : ''} — ${address.neighborhood}, ${address.city}/${address.federalUnit}</p>
         <p style="margin-top:24px;">
           <a href="${SITE_URL}/rastreio" style="color:#e6c778;">Acompanhe seu pedido a qualquer momento em ${SITE_URL}/rastreio</a>
         </p>`,
      ),
    )

    return json({
      orderId: sale.id,
      status: finalStatus,
      pix:
        paymentMethod === 'pix'
          ? {
              qrCode: payment.qrCodeResponse?.qrCodeData,
              qrCodeBase64: payment.qrCodeResponse?.qrCodeImage,
            }
          : undefined,
    })
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
