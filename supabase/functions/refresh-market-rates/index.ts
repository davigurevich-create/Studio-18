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

// AwesomeAPI (economia.awesomeapi.com.br) — gratuita, sem chave, usada por
// vários projetos brasileiros pra cotação de moedas. O par CNY-BRL direto
// não é confiável na API (a chamada combinada "USD-BRL,CNY-BRL" voltava
// vazia pros dois), então busca USD-BRL e USD-CNY separadamente — ambos
// pares bem suportados — e calcula o cruzado CNY-BRL = USD-BRL / USD-CNY.
async function fetchFx(): Promise<{ usdBrl: number | null; cnyBrl: number | null }> {
  let usdBrl: number | null = null
  let usdCny: number | null = null

  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')
    if (!res.ok) throw new Error(`status ${res.status}`)
    const data = await res.json()
    usdBrl = data?.USDBRL?.bid ? Number(data.USDBRL.bid) : null
  } catch (err) {
    console.error('Falha ao buscar USD-BRL (AwesomeAPI):', err)
  }

  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-CNY')
    if (!res.ok) throw new Error(`status ${res.status}`)
    const data = await res.json()
    usdCny = data?.USDCNY?.bid ? Number(data.USDCNY.bid) : null
  } catch (err) {
    console.error('Falha ao buscar USD-CNY (AwesomeAPI):', err)
  }

  const cnyBrl = usdBrl != null && usdCny != null && usdCny !== 0 ? usdBrl / usdCny : null
  return { usdBrl, cnyBrl }
}

// Endpoint de cotação do Yahoo Finance — não é uma API oficial/documentada,
// mas é de uso comum e gratuito pra esse tipo de dado (futuro do Brent,
// ticker BZ=F). Se um dia parar de responder, trocar por outra fonte aqui
// é só mexer nessa function, sem tocar no resto do pipeline.
async function fetchBrentUsd(): Promise<number | null> {
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Studio 18 market rates)' },
    })
    if (!res.ok) throw new Error(`status ${res.status}`)
    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    return typeof price === 'number' ? price : null
  } catch (err) {
    console.error('Falha ao buscar preço do Brent (Yahoo Finance):', err)
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const [fx, brentUsd] = await Promise.all([fetchFx(), fetchBrentUsd()])

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    // Só sobrescreve cada campo se a busca deu certo — uma fonte fora do ar
    // não precisa apagar o último valor bom que já tínhamos.
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (fx.usdBrl !== null) update.usd_brl = fx.usdBrl
    if (fx.cnyBrl !== null) update.cny_brl = fx.cnyBrl
    if (brentUsd !== null) update.brent_usd = brentUsd

    const { error } = await supabase.from('market_rates_snapshot').update(update).eq('id', 'latest')
    if (error) {
      console.error('Falha ao gravar cotações:', error)
      return json({ error: error.message }, 500)
    }

    return json({ ok: true, ...fx, brentUsd })
  } catch (err) {
    console.error('Erro ao atualizar cotações:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado.' }, 500)
  }
})
