// Cota frete em tempo real via Melhor Envio (Correios + transportadoras).
// O token da API fica só aqui (variável de ambiente da function), nunca no
// site — o mesmo esquema usado para o Access Token do Mercado Pago.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MELHOR_ENVIO_TOKEN = Deno.env.get('MELHOR_ENVIO_TOKEN')!
const SHIPPING_ORIGIN_ZIP = (Deno.env.get('SHIPPING_ORIGIN_ZIP') ?? '04784-080').replace(/\D/g, '')

// Ainda não temos as dimensões reais medidas de cada caixa (só o peso) —
// usa uma caixa "média" de set grande technic 1:8 como estimativa até
// cadastrarmos as medidas reais por SKU em length_cm/height_cm/width_cm.
const DEFAULT_BOX_CM = { length: 50, width: 35, height: 12 }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface RequestItem {
  productId: string
  quantity: number
}

interface RequestBody {
  zipCode: string
  items: RequestItem[]
}

interface MelhorEnvioOption {
  name?: string
  price?: string | number
  delivery_time?: number
  custom_delivery_time?: number
  company?: { name?: string }
  error?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { zipCode, items }: RequestBody = await req.json()
    if (!zipCode || !items?.length) {
      return json({ error: 'CEP e itens são obrigatórios.' }, 400)
    }

    const destinationZip = zipCode.replace(/\D/g, '')
    if (destinationZip.length !== 8) {
      return json({ error: 'CEP inválido.' }, 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, weight_kg, length_cm, height_cm, width_cm, sale_price_brl')
      .in('id', items.map((i) => i.productId))

    if (productsError || !products || products.length !== items.length) {
      return json({ error: 'Um ou mais produtos não foram encontrados.' }, 404)
    }

    const meProducts = items.map((i) => {
      const product = products.find((p) => p.id === i.productId)!
      return {
        id: product.id,
        width: product.width_cm ?? DEFAULT_BOX_CM.width,
        height: product.height_cm ?? DEFAULT_BOX_CM.height,
        length: product.length_cm ?? DEFAULT_BOX_CM.length,
        weight: Number(product.weight_kg ?? 5),
        insurance_value: Number(product.sale_price_brl),
        quantity: i.quantity,
      }
    })

    const meResponse = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Studio 18 (contato@studio18bricks.com.br)',
      },
      body: JSON.stringify({
        from: { postal_code: SHIPPING_ORIGIN_ZIP },
        to: { postal_code: destinationZip },
        products: meProducts,
      }),
    })

    const raw = await meResponse.json()
    if (!meResponse.ok || !Array.isArray(raw)) {
      console.error('Falha ao consultar Melhor Envio:', raw)
      return json({ options: [], message: 'Não foi possível calcular o frete agora. Tente novamente em instantes.' })
    }

    const options = (raw as MelhorEnvioOption[])
      .filter((opt) => !opt.error && opt.price != null)
      .map((opt) => ({
        service: opt.name ?? 'Frete',
        company: opt.company?.name ?? '',
        price: Number(opt.price),
        deliveryDays: String(opt.delivery_time ?? opt.custom_delivery_time ?? '—'),
      }))
      .sort((a, b) => a.price - b.price)

    if (options.length === 0) {
      return json({ options: [], message: 'Nenhuma transportadora disponível para este CEP no momento.' })
    }

    // Melhor Envio costuma devolver muitas transportadoras — mostra só as
    // mais baratas pro cliente não ter que comparar 8+ opções no checkout.
    const MAX_OPTIONS = 4
    return json({ options: options.slice(0, MAX_OPTIONS) })
  } catch (err) {
    console.error('Erro ao calcular frete:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado ao calcular frete.' }, 500)
  }
})
