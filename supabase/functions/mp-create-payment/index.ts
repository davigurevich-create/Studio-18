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

type PaymentMethod = 'pix' | 'cartao' | 'boleto'

interface Address {
  zipCode: string
  streetName: string
  streetNumber: string
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
    } = body

    if (!items?.length || !customerName || !customerEmail || !customerCpf || !paymentMethod || !address) {
      return json({ error: 'Dados obrigatórios ausentes.' }, 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sale_price_brl')
      .in('id', items.map((i) => i.productId))
    if (productsError || !products || products.length !== items.length) {
      return json({ error: 'Um ou mais produtos não foram encontrados.' }, 404)
    }

    const lineItems = items.map((i) => {
      const product = products.find((p) => p.id === i.productId)!
      return { product, quantity: i.quantity }
    })

    const totalAmount = lineItems.reduce((t, li) => t + Number(li.product.sale_price_brl) * li.quantity, 0)
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
        discount_brl: 0,
        notes: `Pedido feito pelo site — ${description}`,
        shipping_zip_code: address.zipCode.replace(/\D/g, ''),
        shipping_street_name: address.streetName,
        shipping_street_number: address.streetNumber,
        shipping_neighborhood: address.neighborhood,
        shipping_city: address.city,
        shipping_federal_unit: address.federalUnit,
      })
      .select()
      .single()
    if (saleError || !sale) {
      return json({ error: 'Não foi possível registrar o pedido.' }, 500)
    }

    await supabase.from('sale_items').insert(
      lineItems.map((li) => ({
        sale_id: sale.id,
        product_id: li.product.id,
        quantity: li.quantity,
        unit_price_brl: li.product.sale_price_brl,
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

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': sale.id,
      },
      body: JSON.stringify(mpBody),
    })
    const payment = await mpResponse.json()

    if (!mpResponse.ok) {
      await supabase.from('sales').update({ status: 'cancelado', provider_status: 'error' }).eq('id', sale.id)
      return json({ error: payment.message ?? 'Falha ao criar pagamento no Mercado Pago.' }, 502)
    }

    await supabase
      .from('sales')
      .update({
        provider_payment_id: String(payment.id),
        provider_status: payment.status,
        status: mapStatus(payment.status),
      })
      .eq('id', sale.id)

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
