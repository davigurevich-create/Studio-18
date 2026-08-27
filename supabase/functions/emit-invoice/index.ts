// Emite a NFC-e de um pedido já pago, via Focus NFe. Só a equipe (staff)
// pode chamar isso — mesmo padrão do generate-shipping-label: verifica
// is_staff() com o token de quem chamou, nunca dispara sozinho.
//
// IMPORTANTE: os campos fiscais abaixo (CFOP, CSOSN, situação do PIS/COFINS,
// código de forma de pagamento) são os valores mais comuns para um Simples
// Nacional vendendo direto ao consumidor final dentro do estado — CONFIRME
// com seu contador e teste em FOCUS_NFE_ENV=homologacao antes de ligar em
// produção. A Focus NFe não emite nota fiscal de verdade em homologação.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FOCUS_NFE_TOKEN = Deno.env.get('FOCUS_NFE_TOKEN') ?? ''
// 'homologacao' (padrão, mais seguro) até você confirmar que quer emitir
// notas de verdade — aí muda essa secret pra 'producao'.
const FOCUS_NFE_ENV = Deno.env.get('FOCUS_NFE_ENV') ?? 'homologacao'
const FOCUS_NFE_CNPJ = (Deno.env.get('FOCUS_NFE_CNPJ') ?? Deno.env.get('SHIPPING_ORIGIN_DOCUMENT') ?? '').replace(/\D/g, '')
const FOCUS_BASE_URL = FOCUS_NFE_ENV === 'producao' ? 'https://api.focusnfe.com.br' : 'https://homologacao.focusnfe.com.br'

const PAYMENT_CODE: Record<string, string> = {
  pix: '17',
  cartao: '03',
  boleto: '15',
  dinheiro: '01',
  outro: '99',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function focusAuthHeader() {
  // Basic Auth com o token como usuário e senha vazia.
  return 'Basic ' + btoa(`${FOCUS_NFE_TOKEN}:`)
}

async function focusFetch(path: string, init: RequestInit) {
  const res = await fetch(`${FOCUS_BASE_URL}${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: focusAuthHeader(), 'Content-Type': 'application/json' },
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, data: data as Record<string, unknown> | null }
}

// A Focus NFe devolve caminho_danfe/caminho_xml_nota_fiscal como caminhos
// relativos (ex: "/v2/nfce/.../danfe"), não URLs completas — sem completar
// com o domínio, o link "Ver nota" no painel abria a própria URL do painel
// em vez do PDF (confirmado testando).
function absoluteUrl(path: unknown): string | null {
  return typeof path === 'string' && path ? new URL(path, FOCUS_BASE_URL).toString() : null
}

function statusFromFocus(data: Record<string, unknown> | null): 'processando' | 'autorizada' | 'erro' {
  const s = String(data?.status ?? '')
  if (s === 'autorizado') return 'autorizada'
  if (s === 'processando_autorizacao' || s === '') return 'processando'
  return 'erro'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!FOCUS_NFE_TOKEN) {
      return json({ error: 'Focus NFe ainda não configurado (secret FOCUS_NFE_TOKEN). Configure assim que tiver a conta e o token de API.' }, 400)
    }
    if (!FOCUS_NFE_CNPJ) {
      return json({ error: 'CNPJ do emitente não configurado (FOCUS_NFE_CNPJ ou SHIPPING_ORIGIN_DOCUMENT).' }, 400)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autenticado.' }, 401)
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: isStaff } = await callerClient.rpc('is_staff')
    if (!isStaff) return json({ error: 'Só a equipe pode emitir nota fiscal.' }, 403)

    const { saleId } = await req.json()
    if (!saleId) return json({ error: 'saleId é obrigatório.' }, 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: sale, error: saleError } = await supabase.from('sales').select('*').eq('id', saleId).maybeSingle()
    if (saleError || !sale) return json({ error: 'Pedido não encontrado.' }, 404)

    // Já autorizada: devolve o que já temos, sem chamar a Focus NFe de novo.
    // Se a URL do PDF ainda estiver salva como caminho relativo (de antes da
    // correção do bug), completa e já corrige no banco antes de devolver.
    if (sale.invoice_status === 'autorizada') {
      let pdfUrl: string | null = sale.invoice_pdf_url
      if (pdfUrl && !pdfUrl.startsWith('http')) {
        pdfUrl = absoluteUrl(pdfUrl)
        await supabase.from('sales').update({ invoice_pdf_url: pdfUrl }).eq('id', saleId)
      }
      return json({
        status: 'autorizada',
        invoiceKey: sale.invoice_key,
        pdfUrl,
        alreadyIssued: true,
      })
    }

    // Já em processamento: só consulta o status da MESMA ref já enviada,
    // não reemite.
    if (sale.invoice_status === 'processando' && sale.invoice_ref) {
      const check = await focusFetch(`/v2/nfce/${sale.invoice_ref}`, { method: 'GET' })
      return await saveAndReturn(supabase, saleId, check.data)
    }

    // Uma ref nova a cada tentativa de emissão de verdade — a Focus NFe
    // reaproveita o XML já gerado (mesmo com payload corrigido) quando
    // reenviamos a mesma ref de uma tentativa rejeitada, então "tentar de
    // novo" precisa de uma referência que ela nunca viu antes.
    const ref = `s18-${saleId}-${Date.now()}`

    if (sale.status !== 'pago' && sale.status !== 'enviado' && sale.status !== 'entregue') {
      return json({ error: 'Só é possível emitir nota de pedidos pagos.' }, 400)
    }
    if (!sale.customer_cpf || !sale.customer_name) {
      return json({ error: 'CPF ou nome do cliente ausente neste pedido.' }, 400)
    }
    if (!sale.shipping_zip_code || !sale.shipping_street_name || !sale.shipping_street_number) {
      return json({ error: 'Endereço do cliente incompleto neste pedido.' }, 400)
    }

    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .select('quantity, unit_price_brl, product:products(sku, name, ncm)')
      .eq('sale_id', saleId)
    if (itemsError || !items || items.length === 0) {
      return json({ error: 'Itens do pedido não encontrados.' }, 404)
    }

    const missingNcm = items.filter((it: any) => !it.product?.ncm).map((it: any) => it.product?.sku ?? '?')
    if (missingNcm.length > 0) {
      return json({ error: `Produto(s) sem NCM cadastrado, não dá pra emitir nota: ${missingNcm.join(', ')}. Cadastre o NCM em Estoque antes de emitir.` }, 400)
    }

    const itemsTotal = items.reduce((t: number, it: any) => t + Number(it.unit_price_brl) * it.quantity, 0)
    const shippingCost = Number(sale.shipping_cost_brl ?? 0)
    const paymentCode = PAYMENT_CODE[sale.payment_method ?? 'outro'] ?? '99'

    // A SEFAZ confere se o frete total da nota bate exatamente com a soma do
    // frete distribuído item a item — declarar só no nível geral (sem
    // distribuir) causa rejeição "Total do Frete difere do somatório dos
    // itens". Distribui proporcionalmente ao valor de cada item, e joga
    // qualquer sobra de centavo de arredondamento no último item, pra
    // garantir que a soma bate certinho com o total.
    const itemFreights: number[] = items.map((it: any) =>
      itemsTotal > 0 ? Math.round((Number(it.unit_price_brl) * it.quantity / itemsTotal) * shippingCost * 100) / 100 : 0,
    )
    const freightRounding = Math.round((shippingCost - itemFreights.reduce((t, v) => t + v, 0)) * 100) / 100
    if (itemFreights.length > 0) itemFreights[itemFreights.length - 1] += freightRounding

    const payload = {
      natureza_operacao: 'Venda de mercadoria',
      data_emissao: new Date().toISOString(),
      // NFC-e exige presença do comprador (1) ou entrega a domicílio (4) —
      // "2 (não presencial, pela internet)" só vale pra NF-e modelo 55, e
      // é rejeitado em NFC-e (confirmado com o suporte da Focus NFe). Como
      // toda venda do site é entregue por transportadora, o valor certo é 4.
      presenca_comprador: 4,
      modalidade_frete: 9, // sem transporte (frete cobrado à parte, não como item de venda)
      cnpj_emitente: FOCUS_NFE_CNPJ,
      cpf_destinatario: sale.customer_cpf.replace(/\D/g, ''),
      nome_destinatario: sale.customer_name,
      telefone_destinatario: (sale.customer_phone ?? '').replace(/\D/g, '') || undefined,
      email_destinatario: sale.customer_contact || undefined,
      logradouro_destinatario: sale.shipping_street_name,
      numero_destinatario: sale.shipping_street_number,
      complemento_destinatario: sale.shipping_complement || undefined,
      bairro_destinatario: sale.shipping_neighborhood,
      municipio_destinatario: sale.shipping_city,
      uf_destinatario: sale.shipping_federal_unit,
      cep_destinatario: sale.shipping_zip_code.replace(/\D/g, ''),
      valor_frete: shippingCost || undefined,
      valor_desconto: Number(sale.discount_brl ?? 0) || undefined,
      items: items.map((it: any, idx: number) => ({
        numero_item: idx + 1,
        codigo_produto: it.product.sku,
        descricao: it.product.name,
        // A SEFAZ exige NCM só com os 8 dígitos, sem pontuação — limpa aqui
        // pra poder cadastrar com pontos (mais legível) na aba Estoque. O
        // nome do campo é "codigo_ncm" na API da Focus NFe, não "ncm" (o que
        // a fazia descartar o campo silenciosamente — confirmado com o
        // suporte deles).
        codigo_ncm: String(it.product.ncm).replace(/\D/g, ''),
        cfop: '5102',
        unidade_comercial: 'UN',
        quantidade_comercial: it.quantity,
        valor_unitario_comercial: Number(it.unit_price_brl),
        valor_bruto: Number(it.unit_price_brl) * it.quantity,
        valor_frete: itemFreights[idx] || undefined,
        unidade_tributavel: 'UN',
        quantidade_tributavel: it.quantity,
        valor_unitario_tributacao: Number(it.unit_price_brl),
        icms_origem: 0,
        icms_situacao_tributaria: '102', // CSOSN — Simples Nacional, sem permissão de crédito
        pis_situacao_tributaria: '07', // isento
        cofins_situacao_tributaria: '07', // isento
        // Reforma Tributária (LC 214/2025) — grupo IBS/CBS, obrigatório em
        // toda nota desde 2026. Valores abaixo são o cenário padrão da fase
        // de transição para uma venda comum (CST 000 = tributação integral,
        // cClassTrib 000001 = sem nenhum benefício/exceção específica) com
        // as alíquotas-teste definidas pela Receita para 2026 (IBS 0,1% +
        // CBS 0,9%) — empresas do Simples Nacional não recolhem esse valor
        // de verdade nessa fase, só precisam informar. CONFIRME com seu
        // contador antes de ligar em produção — existem 164 códigos de
        // cClassTrib possíveis dependendo da situação exata do produto.
        ibs_cbs_situacao_tributaria: '000',
        ibs_cbs_classificacao_tributaria: '000001',
        ibs_cbs_base_calculo: Number(it.unit_price_brl) * it.quantity,
        cbs_aliquota: 0.9,
        cbs_valor: Number((Number(it.unit_price_brl) * it.quantity * 0.009).toFixed(2)),
        ibs_uf_aliquota: 0.1,
        ibs_uf_valor: Number((Number(it.unit_price_brl) * it.quantity * 0.001).toFixed(2)),
      })),
      formas_pagamento: [
        { forma_pagamento: paymentCode, valor_pagamento: itemsTotal + shippingCost - Number(sale.discount_brl ?? 0) },
      ],
    }

    const emit = await focusFetch(`/v2/nfce?ref=${ref}`, { method: 'POST', body: JSON.stringify(payload) })
    if (!emit.ok && emit.status !== 202) {
      const message = typeof emit.data?.mensagem === 'string' ? emit.data.mensagem : 'Falha ao emitir nota fiscal na Focus NFe.'
      await supabase.from('sales').update({ invoice_status: 'erro', invoice_error: message, invoice_ref: ref }).eq('id', saleId)
      return json({ error: message, raw: emit.data }, 502)
    }

    return await saveAndReturn(supabase, saleId, emit.data, ref)
  } catch (err) {
    console.error('Erro ao emitir nota fiscal:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado ao emitir nota fiscal.' }, 500)
  }
})

async function saveAndReturn(supabase: ReturnType<typeof createClient>, saleId: string, data: Record<string, unknown> | null, ref?: string) {
  const status = statusFromFocus(data)
  const patch: Record<string, unknown> = { invoice_status: status }
  if (ref) patch.invoice_ref = ref
  if (status === 'autorizada') {
    patch.invoice_number = data?.numero ?? null
    patch.invoice_series = data?.serie ?? null
    patch.invoice_key = data?.chave_nfe ?? null
    patch.invoice_pdf_url = absoluteUrl(data?.caminho_danfe)
    patch.invoice_xml_url = absoluteUrl(data?.caminho_xml_nota_fiscal)
    patch.invoice_error = null
  } else if (status === 'erro') {
    patch.invoice_error = typeof data?.mensagem_sefaz === 'string' ? data.mensagem_sefaz : (typeof data?.mensagem === 'string' ? data.mensagem : 'Erro desconhecido na SEFAZ.')
  }
  await supabase.from('sales').update(patch).eq('id', saleId)
  return json({
    status,
    invoiceKey: patch.invoice_key ?? null,
    pdfUrl: patch.invoice_pdf_url ?? null,
    error: patch.invoice_error ?? null,
  })
}
