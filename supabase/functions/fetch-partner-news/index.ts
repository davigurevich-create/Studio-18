// Roda 3x por dia via pg_cron (ver migrations 104 e 105) — varre o Google
// News RSS (gratuito, sem chave de API) por buscas genéricas de comércio
// exterior/importação/exportação, classifica cada notícia nova com a
// Anthropic (é ou não é realmente crítica pro negócio do Studio 18) e grava
// tudo em partner_news. Quando alguma notícia dá positivo na classificação
// crítica, manda um e-mail de alerta pros sócios (staff_members) — isso é o
// "sala de guerra" do painel ganhando vida própria, não só um filtro manual.
//
// Não precisa de autenticação de staff: só o próprio agendamento do
// Postgres (com a service role key) chama essa function, nunca o painel.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const MODEL = 'claude-sonnet-5'

// --- E-mail transacional (Resend) — mesmo padrão do resto do projeto ---
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Studio 18 <onboarding@resend.dev>'
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://studio18.vercel.app'
// URL do painel de gestão (diferente do site de clientes) — pra onde o
// e-mail de alerta linka. Configure essa secret se o domínio do painel for
// diferente do padrão abaixo.
const DASHBOARD_URL = Deno.env.get('DASHBOARD_URL') ?? 'https://painel.studio18bricks.com.br'
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')

async function sendTelegram(text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    })
    if (!res.ok) console.error('Falha ao enviar notificação Telegram:', await res.text())
  } catch (err) {
    console.error('Erro ao enviar notificação Telegram:', err)
  }
}

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
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0c0c0c" style="max-width:560px;background:#0c0c0c;border:1px solid #262626;border-radius:12px;">
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
                Studio 18 — Sala de guerra de notícias.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

// Buscas propositalmente genéricas (qualquer notícia de
// importação/exportação importa, não só China) — mais a eleição, por conta
// do impacto direto que a política comercial do próximo governo tem no
// negócio. A triagem fina de relevância fica por conta do classificador de
// IA abaixo, não dessas buscas.
const SEARCH_QUERIES = [
  'importação Brasil',
  'exportação Brasil',
  'comércio exterior Brasil',
  'tarifa importação OR protecionismo Brasil',
  'eleição 2026 comércio exterior OR importação Brasil',
]

// Tags automáticas pra filtrar no painel — procura palavras-chave no
// título+resumo. Isso é só pra UI (chips de filtro); não tem relação com a
// classificação de criticidade, que é bem mais rigorosa (ver abaixo).
const TOPIC_KEYWORDS: Record<string, string[]> = {
  China: ['china', 'chinês', 'chinesa', 'yuan', 'renminbi'],
  'Tarifas': ['tarifa', 'imposto de importação', 'taxação', 'taxa de importação', 'protecionis'],
  'Eleição': ['eleição', 'eleições', 'candidato', 'candidata', 'presidencial', 'segundo turno', 'urnas'],
  'Câmbio': ['câmbio', 'dólar', 'cotação', 'moeda'],
  Logística: ['frete', 'logística', 'porto', 'alfândega', 'desembaraço', 'aduana', 'transportadora'],
}

function detectTopics(text: string): string[] {
  const lower = text.toLowerCase()
  const topics: string[] = []
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) topics.push(topic)
  }
  return topics
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '') // o <description> do Google News vem com HTML embutido (links etc.)
    .trim()
}

function extractTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  if (!match) return null
  return match[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim()
}

interface ParsedItem {
  title: string
  url: string
  source: string | null
  summary: string | null
  publishedAt: string | null
}

function parseRssItems(xml: string): ParsedItem[] {
  const items: ParsedItem[] = []
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
  for (const block of itemBlocks) {
    const rawTitle = extractTag(block, 'title')
    const link = extractTag(block, 'link')
    if (!rawTitle || !link) continue
    const title = decodeEntities(rawTitle)
    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)
    const source = sourceMatch ? decodeEntities(sourceMatch[1]) : null
    const rawDescription = extractTag(block, 'description')
    const summary = rawDescription ? decodeEntities(rawDescription) : null
    const pubDate = extractTag(block, 'pubDate')
    const publishedAt = pubDate ? new Date(pubDate).toISOString() : null
    items.push({ title, url: link.trim(), source, summary, publishedAt })
  }
  return items
}

// --- Classificador de criticidade (Anthropic) -------------------------------
//
// RACIONAL: uma notícia só é "crítica" (entra na sala de guerra + dispara
// e-mail pros sócios) quando descreve algo com CONSEQUÊNCIA REAL E DIRETA
// pro negócio do Studio 18 — pra boa ou pra ruim — não qualquer menção
// tangencial a comércio exterior. O critério é deliberadamente rigoroso
// porque o custo de ser permissivo demais é os sócios pararem de prestar
// atenção nos alertas.
const CRITICALITY_CONTEXT = `
Você é o analista de risco comercial do Studio 18, uma boutique brasileira que importa da China e revende no Brasil sets técnicos de blocos de montar premium (carros, motos e motores em escala 1:8). O negócio depende diretamente de: (1) importar produtos fabricados na China, (2) o câmbio dólar/yuan, que afeta o custo de compra, (3) tarifas e impostos de importação brasileiros, (4) logística de desembaraço aduaneiro e transporte, e (5) política de comércio exterior do governo brasileiro (incluindo o resultado da eleição em curso).

Sua tarefa: julgar, pra cada notícia da lista, se ela é "crítica" — ou seja, se descreve algo com consequência REAL e DIRETA pro negócio do Studio 18, boa ou ruim. Seja rigoroso. Marque como crítica (critica=true) SOMENTE quando a notícia se encaixar claramente em pelo menos um destes casos:

1. Fala especificamente sobre importação de brinquedos, blocos de montar, miniaturas, modelismo, ou brinquedos/produtos manufaturados da China em geral.
2. Anuncia uma MUDANÇA CONCRETA (lei aprovada, decreto, portaria, decisão, taxa nova, imposto alterado, proibição, liberação, acordo assinado, sanção) nas regras de importação de produtos da China pro Brasil — mesmo que não mencione brinquedos especificamente, desde que seja ampla o bastante pra afetar qualquer importador (ex: mudança nas regras do Remessa Conforme, novo imposto de importação geral sobre produtos chineses, acordo ou ruptura comercial Brasil-China).
3. Um candidato à eleição anuncia vitória, ou apresenta uma proposta FORMAL E CONCRETA de política de comércio exterior/importação (não um mero debate ou especulação sobre o que "poderia" fazer).
4. Uma mudança cambial BRUSCA (não a variação comum do dia a dia) ou uma decisão de política monetária com impacto direto e imediato no custo de importar.
5. Uma interrupção logística relevante que afeta importação/desembaraço de mercadorias da China pro Brasil (greve portuária, bloqueio aduaneiro relevante, crise numa transportadora de carga internacional).

NÃO marque como crítica: notícias de agronegócio, commodities agrícolas, remédios, ou qualquer outro setor sem relação com blocos de montar/brinquedos/importação geral da China — MESMO que a palavra "importação" ou "exportação" apareça na notícia. Também não marque debates/especulações sem decisão concreta, nem variações cambiais do dia a dia dentro do normal, nem notícias genéricas de economia sem relação direta com os 5 critérios acima. Na dúvida, NÃO marque como crítica — é melhor perder uma notícia de verdade do que acostumar os sócios a ignorar os alertas.

Quando marcar como crítica, escreva em "motivo" uma frase curta e objetiva (máximo ~20 palavras) explicando o impacto direto no negócio do Studio 18.
`.trim()

const classifierTools = [
  {
    name: 'classificar_noticias',
    description: 'Classifica cada notícia da lista quanto à relevância crítica real para o negócio do Studio 18.',
    input_schema: {
      type: 'object',
      properties: {
        classificacoes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'A URL exata da notícia, copiada da lista recebida.' },
              critica: { type: 'boolean' },
              motivo: { type: 'string', description: 'Só preencha se critica=true: frase curta explicando o impacto direto no negócio.' },
            },
            required: ['url', 'critica'],
          },
        },
      },
      required: ['classificacoes'],
    },
  },
]

interface Classification {
  critica: boolean
  motivo: string | null
}

// Classifica em lotes pequenos, em paralelo, em vez de mandar tudo numa
// chamada só — uma rodada normal tem poucas notícias novas, mas a primeira
// execução (ou uma falha de alguns dias sem rodar) pode acumular centenas
// de uma vez, e uma chamada única com centenas de itens estourava o limite
// de tokens de resposta e o tempo da function (erro genérico 500).
const CLASSIFY_CHUNK_SIZE = 20

async function classifyCriticality(items: ParsedItem[]): Promise<Map<string, Classification>> {
  const result = new Map<string, Classification>()
  if (!ANTHROPIC_API_KEY || items.length === 0) return result

  const chunks: ParsedItem[][] = []
  for (let i = 0; i < items.length; i += CLASSIFY_CHUNK_SIZE) {
    chunks.push(items.slice(i, i + CLASSIFY_CHUNK_SIZE))
  }

  const chunkResults = await Promise.all(chunks.map(classifyChunk))
  for (const chunkMap of chunkResults) {
    for (const [url, c] of chunkMap) result.set(url, c)
  }
  return result
}

async function classifyChunk(items: ParsedItem[]): Promise<Map<string, Classification>> {
  const result = new Map<string, Classification>()
  const list = items.map((it, i) => `${i + 1}. URL: ${it.url}\nTítulo: ${it.title}\nResumo: ${it.summary ?? '(sem resumo)'}`).join('\n\n')

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // ~150 tokens por classificação + folga — suficiente pro lote de
        // 20 itens sem desperdiçar tokens em lotes menores (último lote de
        // uma leva grande).
        model: MODEL,
        max_tokens: Math.min(8192, items.length * 150 + 512),
        system: CRITICALITY_CONTEXT,
        messages: [{ role: 'user', content: `Classifique cada notícia abaixo:\n\n${list}` }],
        tools: classifierTools,
        tool_choice: { type: 'tool', name: 'classificar_noticias' },
      }),
    })
    if (!response.ok) {
      console.error('Falha ao classificar lote de criticidade (Anthropic):', await response.text())
      return result
    }
    const data = await response.json()
    const toolUse = data.content?.find((c: { type: string }) => c.type === 'tool_use')
    const classificacoes = toolUse?.input?.classificacoes as Array<{ url: string; critica: boolean; motivo?: string }> | undefined
    if (!classificacoes) return result
    for (const c of classificacoes) {
      result.set(c.url, { critica: !!c.critica, motivo: c.critica ? c.motivo ?? null : null })
    }
  } catch (err) {
    console.error('Erro ao classificar lote de criticidade:', err)
  }
  return result
}

async function notifyStaffOfCritical(supabase: ReturnType<typeof createClient>, criticalItems: Array<{ title: string; url: string; critical_reason: string | null }>): Promise<void> {
  if (criticalItems.length === 0) return
  const { data: staff } = await supabase.from('staff_members').select('email')
  const emails = (staff ?? []).map((s: { email: string }) => s.email).filter(Boolean)
  if (emails.length === 0) return

  const itemsHtml = criticalItems
    .map(
      (n) => `<div style="margin:0 0 16px;padding:14px 16px;border-radius:8px;background:rgba(208,59,59,0.08);border:1px solid rgba(208,59,59,0.35);">
        <a href="${n.url}" style="color:#f3f1ec;font-weight:600;text-decoration:none;">${n.title}</a>
        ${n.critical_reason ? `<div style="margin-top:6px;font-size:13px;color:#e08a8a;">${n.critical_reason}</div>` : ''}
      </div>`,
    )
    .join('')

  const subject =
    criticalItems.length === 1
      ? 'Notícia crítica pro negócio — Studio 18'
      : `${criticalItems.length} notícias críticas pro negócio — Studio 18`

  for (const email of emails) {
    await sendEmail(
      email,
      subject,
      emailShell(
        'Isso aqui merece sua atenção',
        `<p>O robô de notícias encontrou ${criticalItems.length === 1 ? 'uma notícia' : `${criticalItems.length} notícias`} com consequência real pro negócio do Studio 18:</p>
         ${itemsHtml}
         <p style="margin-top:20px;">
           <a href="${DASHBOARD_URL}/noticias" style="color:#e6c778;">Ver na sala de guerra do painel</a>
         </p>`,
      ),
    )
  }

  const telegramList = criticalItems.map((n) => `• ${n.title}${n.critical_reason ? `\n  ${n.critical_reason}` : ''}`).join('\n')
  await sendTelegram(`🚨 <b>${subject}</b>\n\n${telegramList}\n\n${DASHBOARD_URL}/noticias`)
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const allItems = new Map<string, ParsedItem>()
    for (const query of SEARCH_QUERIES) {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`
      try {
        const res = await fetch(rssUrl, { headers: { 'User-Agent': 'Studio 18 (contato@studio18bricks.com.br)' } })
        if (!res.ok) {
          console.error(`Falha ao buscar RSS pra "${query}" (status ${res.status})`)
          continue
        }
        const xml = await res.text()
        for (const item of parseRssItems(xml)) {
          if (!allItems.has(item.url)) allItems.set(item.url, item)
        }
      } catch (err) {
        console.error(`Erro ao buscar RSS pra "${query}":`, err)
      }
    }

    if (allItems.size === 0) return json({ fetched: 0, inserted: 0 })

    // Evita gravar de novo URLs que já estão na tabela.
    const urls = Array.from(allItems.keys())
    const { data: existing } = await supabase.from('partner_news').select('url').in('url', urls)
    const existingUrls = new Set((existing ?? []).map((r: { url: string }) => r.url))

    const newItems = Array.from(allItems.values()).filter((item) => !existingUrls.has(item.url))

    const classifications = await classifyCriticality(newItems)

    const toInsert = newItems.map((item) => {
      const c = classifications.get(item.url)
      return {
        title: item.title,
        url: item.url,
        source: item.source,
        summary: item.summary,
        published_at: item.publishedAt,
        topics: detectTopics(`${item.title} ${item.summary ?? ''}`),
        is_critical: c?.critica ?? false,
        critical_reason: c?.motivo ?? null,
      }
    })

    let insertedCount = 0
    if (toInsert.length > 0) {
      // Upsert em vez de insert simples: se duas buscas trouxerem a mesma
      // notícia na mesma rodada (já filtrado acima pelo Map), ou se uma
      // corrida rara colidir no unique de url, não quebra a function toda.
      const { error, count } = await supabase.from('partner_news').upsert(toInsert, { onConflict: 'url', ignoreDuplicates: true, count: 'exact' })
      if (error) {
        console.error('Falha ao gravar notícias novas:', error)
        return json({ error: error.message }, 500)
      }
      insertedCount = count ?? toInsert.length
    }

    const criticalInserted = toInsert.filter((n) => n.is_critical)
    await notifyStaffOfCritical(supabase, criticalInserted)

    return json({ fetched: allItems.size, inserted: insertedCount, critical: criticalInserted.length })
  } catch (err) {
    console.error('Erro ao buscar notícias de comércio exterior:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado.' }, 500)
  }
})
