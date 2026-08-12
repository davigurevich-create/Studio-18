// Cria uma cobrança no Mercado Pago (PIX, boleto ou cartão) e registra o
// pedido como uma venda "pendente" no Supabase. O Access Token do Mercado
// Pago fica só aqui (variável de ambiente da function), nunca no site.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// --- E-mail transacional (Resend) ------------------------------------------
// Envia a confirmação de pedido ao cliente. Nunca derruba o checkout se
// falhar — erro de e-mail só fica registrado no log da function.
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

type PaymentMethod = 'pix' | 'cartao' | 'boleto'

// Desconto de 10% para pagamento à vista no PIX — mesmo valor usado no
// front-end (site/src/lib/pricing.ts). Fonte real da cobrança: é aqui que o
// valor de fato vira transaction_amount no Mercado Pago.
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
}

interface RequestBody {
  items: CheckoutItem[]
  customerName: string
  customerEmail: string
  customerCpf: string
  paymentMethod: PaymentMethod
  // só para cartão: gerado no navegador pelo SDK do Mercado Pago (Bricks),
  // nunca enviamos o número do cartão para esta function
  cardToken?: string
  cardPaymentMethodId?: string
  installments?: number
  // sempre obrigatório — usado como endereço de entrega em toda venda, e
  // também exigido pelo Mercado Pago para gerar boleto registrado
  address: Address
  // código de cupom de desconto (parcerias com influenciadores) — sempre
  // reconferido aqui, nunca confiamos no desconto calculado no navegador
  couponCode?: string
}

function mapStatus(mpStatus: string): string {
  if (mpStatus === 'approved') return 'pago'
  if (mpStatus === 'rejected' || mpStatus === 'cancelled') return 'cancelado'
  return 'pendente'
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
      paymentMethod,
      cardToken,
      cardPaymentMethodId,
      installments,
      address,
      couponCode,
    } = body

    if (!items?.length || !customerName || !customerEmail || !customerCpf || !paymentMethod || !address) {
      return json({ error: 'Dados obrigatórios ausentes.' }, 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    console.log('checkpoint: antes de buscar produtos')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sale_price_brl')
      .in('id', items.map((i) => i.productId))
    console.log('checkpoint: depois de buscar produtos', { productsError, count: products?.length })
    if (productsError || !products || products.length !== items.length) {
      return json({ error: 'Um ou mais produtos não foram encontrados.' }, 404)
    }

    const lineItems = items.map((i) => {
      const product = products.find((p) => p.id === i.productId)!
      const fullUnitPrice = Number(product.sale_price_brl)
      const unitPrice = paymentMethod === 'pix' ? pixPrice(fullUnitPrice) : fullUnitPrice
      return { product, quantity: i.quantity, unitPrice, fullUnitPrice }
    })

    // Cupom de desconto (parcerias com influenciadores) — nunca confiamos no
    // desconto calculado no navegador, revalidamos aqui contra a tabela
    // coupons antes de aplicar qualquer coisa na cobrança de verdade.
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
    const totalAmount =
      couponDiscountPct > 0
        ? Math.round(pixAdjustedTotal * (1 - couponDiscountPct / 100) * 100) / 100
        : pixAdjustedTotal
    const discountAmount = Math.round((fullTotalAmount - totalAmount) * 100) / 100
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
        payment_method: paymentMethod,
        status: 'pendente',
        payment_provider: 'mercadopago',
        shipping_cost_brl: 0,
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
    console.log('checkpoint: depois de inserir venda', { saleError, saleId: sale?.id })
    if (saleError || !sale) {
      console.error('Falha ao inserir venda:', saleError)
      return json({ error: 'Não foi possível registrar o pedido.' }, 500)
    }

    if (appliedCoupon) {
      await supabase.from('coupons').update({ uses_count: appliedCoupon.uses_count + 1 }).eq('id', appliedCoupon.id)

      // Indicação de amigos: se o cupom usado é o código pessoal de um
      // cliente, ele ganha um cupom de recompensa de uso único assim que
      // este pedido é registrado (não espera confirmação de pagamento).
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

    const [firstName, ...rest] = customerName.trim().split(' ')
    const lastName = rest.join(' ') || firstName

    const payerBase = {
      email: customerEmail,
      first_name: firstName,
      last_name: lastName,
      identification: { type: 'CPF', number: customerCpf.replace(/\D/g, '') },
    }

    let mpBody: Record<string, unknown>
    if (paymentMethod === 'pix') {
      mpBody = {
        transaction_amount: totalAmount,
        description,
        payment_method_id: 'pix',
        payer: payerBase,
        external_reference: sale.id,
        notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      }
    } else if (paymentMethod === 'boleto') {
      mpBody = {
        transaction_amount: totalAmount,
        description,
        payment_method_id: 'bolbradesco',
        payer: {
          ...payerBase,
          address: {
            zip_code: address.zipCode.replace(/\D/g, ''),
            street_name: address.streetName,
            street_number: address.streetNumber,
            neighborhood: address.neighborhood,
            city: address.city,
            federal_unit: address.federalUnit,
          },
        },
        external_reference: sale.id,
        notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      }
    } else {
      if (!cardToken || !cardPaymentMethodId) {
        return json({ error: 'Token de cartão ausente.' }, 400)
      }
      mpBody = {
        transaction_amount: totalAmount,
        token: cardToken,
        description,
        installments: installments ?? 1,
        payment_method_id: cardPaymentMethodId,
        payer: payerBase,
        external_reference: sale.id,
        notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      }
    }

    console.log('checkpoint: antes de chamar Mercado Pago', { hasToken: Boolean(MP_ACCESS_TOKEN), tokenLength: MP_ACCESS_TOKEN?.length })
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': sale.id,
      },
      body: JSON.stringify(mpBody),
    })
    console.log('checkpoint: depois de chamar Mercado Pago', { status: mpResponse.status, ok: mpResponse.ok })
    const payment = await mpResponse.json()
    console.log('checkpoint: corpo da resposta do Mercado Pago', payment)

    if (!mpResponse.ok) {
      await supabase.from('sales').update({ status: 'cancelado', provider_status: 'error' }).eq('id', sale.id)
      return json({ error: payment.message ?? 'Falha ao criar pagamento no Mercado Pago.' }, 502)
    }

    const finalStatus = mapStatus(payment.status)
    await supabase
      .from('sales')
      .update({
        provider_payment_id: String(payment.id),
        provider_status: payment.status,
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

    let paymentBlockHtml = ''
    if (paymentMethod === 'pix') {
      paymentBlockHtml =
        '<p>Pague com o PIX Copia e Cola ou o QR Code que enviamos na tela de confirmação. Assim que o pagamento for identificado, você recebe um novo e-mail confirmando.</p>'
    } else if (paymentMethod === 'boleto') {
      paymentBlockHtml = `<p>Seu boleto foi gerado. <a href="${payment.transaction_details?.external_resource_url ?? '#'}" style="color:#e6c778;">Clique aqui para visualizar e pagar</a>. A compensação pode levar até 3 dias úteis.</p>`
    } else {
      paymentBlockHtml =
        finalStatus === 'pago'
          ? '<p style="color:#8fce8f;">Pagamento aprovado! Seu pedido já está confirmado.</p>'
          : '<p>Estamos processando o pagamento do seu cartão.</p>'
    }

    await sendEmail(
      customerEmail,
      `Pedido recebido — Studio 18 #${sale.id.slice(0, 8)}`,
      emailShell(
        'Recebemos seu pedido!',
        `<p>Olá, ${customerName.split(' ')[0]}! Seu pedido <strong>#${sale.id.slice(0, 8)}</strong> foi registrado com sucesso.</p>
         <div style="margin:16px 0;">${itemsListHtml}${discountRowHtml}</div>
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
      status: mapStatus(payment.status),
      pix:
        paymentMethod === 'pix'
          ? {
              qrCode: payment.point_of_interaction?.transaction_data?.qr_code,
              qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
            }
          : undefined,
      boleto:
        paymentMethod === 'boleto'
          ? {
              barcode: payment.barcode?.content,
              ticketUrl: payment.transaction_details?.external_resource_url,
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
