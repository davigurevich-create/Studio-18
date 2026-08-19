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
const MELHOR_ENVIO_TOKEN = Deno.env.get('MELHOR_ENVIO_TOKEN')!

const DEFAULT_BOX_CM = { length: 50, width: 35, height: 12 }

// Dados do remetente (Studio 18) que vão em toda etiqueta gerada. O CNPJ
// ainda não existe (empresa em processo de abertura) — sem ele o Melhor
// Envio recusa a etiqueta, então a function barra com uma mensagem clara
// até SHIPPING_ORIGIN_DOCUMENT ser configurado como secret.
const ORIGIN = {
  name: Deno.env.get('SHIPPING_ORIGIN_NAME') ?? 'Studio 18',
  document: (Deno.env.get('SHIPPING_ORIGIN_DOCUMENT') ?? '').replace(/\D/g, ''),
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
  const res = await fetch(`https://www.melhorenvio.com.br/api/v2/me/${path}`, {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!ORIGIN.document) {
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
    // vez de comprar (e cobrar) outra de novo.
    if (sale.shipping_label_url) {
      return json({ labelUrl: sale.shipping_label_url, trackingCode: sale.shipping_tracking_code, alreadyGenerated: true })
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
      document: ORIGIN.document,
      address: ORIGIN.address,
      number: ORIGIN.number,
      complement: ORIGIN.complement || undefined,
      district: ORIGIN.district,
      city: ORIGIN.city,
      state_abbr: ORIGIN.state_abbr,
      postal_code: ORIGIN.postal_code,
      country_id: ORIGIN.country_id,
    }

    // 1. Adiciona ao carrinho do Melhor Envio.
    const cart = await meFetch('cart', {
      service: Number(sale.shipping_service_id),
      from,
      to,
      products,
      volumes,
      options: {
        insurance_value: insuranceValue,
        receipt: false,
        own_hand: false,
        // Isto é sempre uma venda — envio "não comercial" tem teto de
        // seguro de R$1.000 no Melhor Envio, o que rejeitava qualquer
        // pedido acima disso.
        non_commercial: false,
        platform: 'Studio 18',
      },
    })
    if (!cart.ok || !cart.data?.id) {
      console.error('Falha ao adicionar ao carrinho Melhor Envio:', cart.data)
      return json({ error: cart.data?.message ?? 'Não foi possível adicionar o frete ao carrinho do Melhor Envio.' }, 502)
    }
    const cartItemId = cart.data.id as string

    // 2. Paga com o saldo da carteira.
    const checkout = await meFetch('shipment/checkout', { orders: [cartItemId] })
    if (!checkout.ok) {
      console.error('Falha ao pagar frete (checkout) no Melhor Envio:', checkout.data)
      return json({ error: checkout.data?.message ?? 'Não foi possível pagar o frete — confira o saldo da carteira do Melhor Envio.' }, 502)
    }

    // 3. Gera a etiqueta.
    const generate = await meFetch('shipment/generate', { orders: [cartItemId] })
    if (!generate.ok) {
      console.error('Falha ao gerar etiqueta no Melhor Envio:', generate.data)
      return json({ error: generate.data?.message ?? 'Frete pago, mas falhou ao gerar a etiqueta. Gere manualmente no painel do Melhor Envio.' }, 502)
    }

    // 4. Busca o PDF pra impressão.
    const print = await meFetch('shipment/print', { orders: [cartItemId], mode: 'private' })
    const labelUrl: string | null = print.data?.url ?? null

    const trackingCode: string | null =
      generate.data?.[cartItemId]?.tracking ?? generate.data?.tracking ?? null

    await supabase
      .from('sales')
      .update({
        melhor_envio_order_id: cartItemId,
        shipping_label_url: labelUrl,
        shipping_tracking_code: trackingCode,
      })
      .eq('id', saleId)

    return json({ labelUrl, trackingCode })
  } catch (err) {
    console.error('Erro ao gerar etiqueta:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado ao gerar etiqueta.' }, 500)
  }
})
