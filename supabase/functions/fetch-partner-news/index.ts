// Roda 3x por dia via pg_cron (ver migration 104_partner_news.sql) — varre
// o Google News RSS (gratuito, sem chave de API) por buscas genéricas de
// comércio exterior/importação/exportação e grava as notícias novas na
// tabela partner_news, sem duplicar (url é unique).
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

// Buscas propositalmente genéricas (qualquer notícia de
// importação/exportação importa, não só China) — mais a eleição, por conta
// do impacto direto que a política comercial do próximo governo tem no
// negócio.
const SEARCH_QUERIES = [
  'importação Brasil',
  'exportação Brasil',
  'comércio exterior Brasil',
  'tarifa importação OR protecionismo Brasil',
  'eleição 2026 comércio exterior OR importação Brasil',
]

// Tags automáticas pra filtrar no painel — procura palavras-chave no
// título+resumo. Uma notícia pode cair em mais de um tema.
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

    const toInsert = Array.from(allItems.values())
      .filter((item) => !existingUrls.has(item.url))
      .map((item) => ({
        title: item.title,
        url: item.url,
        source: item.source,
        summary: item.summary,
        published_at: item.publishedAt,
        topics: detectTopics(`${item.title} ${item.summary ?? ''}`),
      }))

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

    return json({ fetched: allItems.size, inserted: insertedCount })
  } catch (err) {
    console.error('Erro ao buscar notícias de comércio exterior:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado.' }, 500)
  }
})
