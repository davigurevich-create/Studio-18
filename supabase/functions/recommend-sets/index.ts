// Recomendação de sets via IA — o cliente descreve em poucas palavras o que
// procura e a IA escolhe 1 a 3 sets do catálogo que fazem mais sentido, com
// uma frase curta explicando cada escolha. Mesmo modelo/chave/proteção
// (Turnstile) do site-chat, mas resposta sempre em JSON estruturado (via
// tool use forçado) em vez de texto livre, pra dar pra montar os cards no
// site sem precisar interpretar texto.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TURNSTILE_SECRET_KEY = Deno.env.get('TURNSTILE_SECRET_KEY')
const MODEL = 'claude-sonnet-5'

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

const tool = {
  name: 'recommend',
  description: 'Retorna de 1 a 3 sets do catálogo que melhor combinam com o que o cliente descreveu.',
  input_schema: {
    type: 'object',
    properties: {
      picks: {
        type: 'array',
        minItems: 1,
        maxItems: 3,
        items: {
          type: 'object',
          properties: {
            sku: { type: 'string', description: 'SKU exato do set, copiado do catálogo (ex: S18-001).' },
            reason: { type: 'string', description: 'Frase curta (até 20 palavras) explicando por que esse set combina com o pedido do cliente.' },
          },
          required: ['sku', 'reason'],
        },
      },
    },
    required: ['picks'],
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query, turnstileToken } = await req.json()
    if (!query || typeof query !== 'string' || !query.trim()) {
      return json({ error: 'Descreva o que você procura.' }, 400)
    }
    if (!(await verifyTurnstile(turnstileToken))) {
      return json({ error: 'Não foi possível verificar que você não é um robô. Recarregue a página e tente de novo.' }, 403)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: catalog } = await supabase
      .from('public_catalog')
      .select('sku, name, manufacturer, scale, piece_count, sale_price_brl, collection_tag, automotive_history')
      .order('name')

    const catalogText = (catalog ?? [])
      .map((p: Record<string, unknown>) => {
        const price = Number(p.sale_price_brl) > 0 ? `R$ ${Number(p.sale_price_brl).toFixed(2)}` : 'preço a definir (novidade, ainda não à venda)'
        const history = p.automotive_history ? ` — ${p.automotive_history}` : ''
        return `SKU ${p.sku}: ${p.name} — ${p.manufacturer ?? '—'}, escala ${p.scale}, ${p.piece_count ?? '?'} peças, ${price}, coleção ${p.collection_tag ?? '—'}${history}`
      })
      .join('\n')

    const system = `Você é o curador de recomendações da Studio 18, uma boutique brasileira de sets técnicos de blocos de montar premium (carros, motos e motores em escala 1:8). Um cliente vai descrever em poucas palavras o que procura (estilo, marca, uso, sentimento, orçamento etc.) e você deve escolher de 1 a 3 sets do catálogo abaixo que melhor combinam, chamando a ferramenta "recommend". Use APENAS SKUs que existem no catálogo abaixo — nunca invente um SKU. Priorize combinar com a intenção real do cliente, não só palavras-chave literais. Responda sempre chamando a ferramenta, nunca em texto livre.

CATÁLOGO ATUAL:
${catalogText}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: query.trim().slice(0, 500) }],
        tools: [tool],
        tool_choice: { type: 'tool', name: 'recommend' },
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      return json({ error: `Erro ao consultar a IA: ${errBody}` }, 502)
    }

    const data = await response.json()
    const toolUse = data.content?.find((c: { type: string; name?: string }) => c.type === 'tool_use' && c.name === 'recommend')
    const picks = Array.isArray(toolUse?.input?.picks) ? toolUse.input.picks : []

    const validSkus = new Set((catalog ?? []).map((p: Record<string, unknown>) => p.sku))
    const cleanPicks = picks
      .filter((p: { sku?: unknown }) => p && typeof p.sku === 'string' && validSkus.has(p.sku))
      .slice(0, 3)

    return json({ picks: cleanPicks })
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
