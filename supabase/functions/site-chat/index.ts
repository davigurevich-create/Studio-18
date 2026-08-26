// Chatbot do site — responde duvidas gerais (FAQ, politica de devolucao,
// catalogo) e consulta status de pedido via tool use. A chave da Anthropic
// fica so aqui (variavel de ambiente da function), nunca no site.
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

// Confere o desafio do Cloudflare Turnstile contra a API deles antes de
// gastar crédito de IA numa mensagem — sem isso, um bot conseguiria chamar
// esta function em loop e gerar uma conta alta rapidamente. Se a secret
// ainda não estiver configurada, deixa passar (não quebra o chat antes do
// Turnstile estar configurado).
async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) return true
  if (!token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: TURNSTILE_SECRET_KEY, response: token }),
    })
    const data = await res.json().catch(() => null)
    return Boolean(data?.success)
  } catch {
    return false
  }
}

const FAQ_AND_POLICY = `
PERGUNTAS FREQUENTES:
- Prazo de entrega: sets em pronta entrega no Brasil, envio em geral entre 5 e 15 dias úteis dependendo da região.
- Como rastrear: o cliente usa a página /rastreio com o número do pedido + e-mail da compra.
- Pagamento: PIX, cartão de crédito (até 12x) e boleto, via Mercado Pago.
- Autenticidade: sets técnicos premium em escala 1:8, curadoria própria da Studio 18, caixa oficial e manual do fabricante.
- Peças faltando/danificadas: contato em até 30 dias corridos do recebimento, reposição ou troca sem custo.

POLÍTICA DE DEVOLUÇÃO:
1. Direito de arrependimento: 7 dias corridos após o recebimento, sem precisar justificar (Art. 49 CDC). Reembolso integral incluindo frete, após devolução do set em condições originais.
2. Defeito ou avaria no transporte: contato em até 30 dias corridos, reposição de peças ou substituição do set sem custo.
3. Condições: embalagem original, todos os acessórios e manual inclusos. Sets já montados ainda podem ser devolvidos dentro do prazo de arrependimento.
4. Como solicitar: contato informando número do pedido e motivo.
5. Prazo de reembolso: até 10 dias úteis após conferência do produto devolvido, no mesmo método de pagamento usado.
`.trim()

const tools = [
  {
    name: 'consultar_pedido',
    description:
      'Consulta o status de um pedido específico. Só funciona se o cliente informar o número do pedido E o e-mail usado na compra — sem os dois não retorna nada, por segurança.',
    input_schema: {
      type: 'object',
      properties: {
        order_id: { type: 'string', description: 'Número do pedido (UUID)' },
        email: { type: 'string', description: 'E-mail usado na compra' },
      },
      required: ['order_id', 'email'],
    },
  },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messages, turnstileToken } = await req.json()
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'Nenhuma mensagem enviada.' }, 400)
    }
    if (!(await verifyTurnstile(turnstileToken))) {
      return json({ error: 'Não foi possível verificar que você não é um robô. Recarregue a página e tente de novo.' }, 403)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: catalog } = await supabase
      .from('public_catalog')
      .select('name, manufacturer, scale, piece_count, sale_price_brl, collection_tag')
      .order('name')

    const catalogText = (catalog ?? [])
      .map(
        (p) =>
          `${p.name} — ${p.manufacturer ?? '—'}, escala ${p.scale}, ${p.piece_count ?? '?'} peças, R$ ${Number(p.sale_price_brl).toFixed(2)}, coleção ${p.collection_tag ?? '—'}`,
      )
      .join('\n')

    const system = `Você é o assistente virtual da Studio 18, uma boutique brasileira de sets técnicos de blocos de montar premium (carros, motos e motores em escala 1:8). Seja cordial, direto e use português do Brasil. Nunca invente informações — se não souber, diga que vai encaminhar para a equipe humana.

${FAQ_AND_POLICY}

CATÁLOGO ATUAL:
${catalogText}

Para perguntas sobre status de um pedido específico, use a ferramenta consultar_pedido — só chame se o cliente já tiver informado o número do pedido E o e-mail. Se faltar algum dos dois, peça antes de chamar a ferramenta.`

    let conversation = [...messages]
    let finalText = ''

    for (let turn = 0; turn < 4; turn++) {
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
          messages: conversation,
          tools,
        }),
      })

      if (!response.ok) {
        const errBody = await response.text()
        return json({ error: `Erro ao consultar o assistente: ${errBody}` }, 502)
      }

      const data = await response.json()
      const toolUse = data.content?.find((c: { type: string }) => c.type === 'tool_use')

      if (data.stop_reason === 'tool_use' && toolUse) {
        conversation.push({ role: 'assistant', content: data.content })

        let toolResult: unknown
        if (toolUse.name === 'consultar_pedido') {
          const { data: order } = await supabase.rpc('get_order_status', {
            order_id: toolUse.input.order_id,
            buyer_email: toolUse.input.email,
          })
          toolResult =
            order && order.length > 0
              ? order[0]
              : { error: 'Nenhum pedido encontrado com esse número e e-mail.' }
        } else {
          toolResult = { error: 'Ferramenta desconhecida.' }
        }

        conversation.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(toolResult),
            },
          ],
        })
        continue
      }

      finalText = data.content?.find((c: { type: string }) => c.type === 'text')?.text ?? ''
      break
    }

    return json({ reply: finalText || 'Desculpe, não consegui responder agora. Tente novamente.' })
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
