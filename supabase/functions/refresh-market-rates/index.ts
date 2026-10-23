// Roda a cada 15 min via pg_cron (ver migration 104_partner_news.sql) —
// busca dólar, yuan (ambos em reais) e o barril de petróleo Brent, e grava
// numa única linha (market_rates_snapshot) que o painel lê. Isso evita que
// o painel bata direto nas fontes externas toda vez que alguém abre a aba
// (nem toda fonte tem CORS liberado pro navegador, e assim fica rápido e
// sem risco de limite de requisição).
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Endpoint de cotação do Yahoo Finance — não é uma API oficial/documentada,
// mas é de uso comum e gratuito. Comprovadamente alcançável a partir da
// rede do Supabase (é a mesma fonte usada pro Brent, que já funciona). A
// AwesomeAPI foi tentada antes pro câmbio mas falhava silenciosamente a
// partir daqui — trocado por essa fonte única pros 3 valores, pra não
// depender de dois provedores diferentes.
async function fetchYahooPrice(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Studio 18 market rates)' },
    })
    if (!res.ok) throw new Error(`status ${res.status}`)
    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    return typeof price === 'number' ? price : null
  } catch (err) {
    console.error(`Falha ao buscar cotação (Yahoo Finance, ${symbol}):`, err)
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // BRL=X = quantos reais vale 1 dólar. CNY=X = quantos yuans vale 1
    // dólar — usado pra calcular o cruzado CNY→BRL (não existe um ticker
    // direto CNY/BRL confiável no Yahoo).
    const [usdBrl, usdCny, brentUsd] = await Promise.all([
      fetchYahooPrice('BRL=X'),
      fetchYahooPrice('CNY=X'),
      fetchYahooPrice('BZ=F'),
    ])
    const cnyBrl = usdBrl != null && usdCny != null && usdCny !== 0 ? usdBrl / usdCny : null

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    // Só sobrescreve cada campo se a busca deu certo — uma fonte fora do ar
    // não precisa apagar o último valor bom que já tínhamos.
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (usdBrl !== null) update.usd_brl = usdBrl
    if (cnyBrl !== null) update.cny_brl = cnyBrl
    if (brentUsd !== null) update.brent_usd = brentUsd

    const { error } = await supabase.from('market_rates_snapshot').update(update).eq('id', 'latest')
    if (error) {
      console.error('Falha ao gravar cotações:', error)
      return json({ error: error.message }, 500)
    }

    return json({ ok: true, usdBrl, cnyBrl, brentUsd })
  } catch (err) {
    console.error('Erro ao atualizar cotações:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado.' }, 500)
  }
})
