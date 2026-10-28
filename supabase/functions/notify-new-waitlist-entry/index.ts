// Chamada por um trigger do Postgres (ver migration 108_notify_new_waitlist_entry.sql)
// toda vez que alguém entra na lista de espera de reposição pelo site —
// avisa os sócios no Telegram que tem demanda represada nova.
//
// Não precisa de autenticação de staff: só o próprio trigger do Postgres
// (via pg_net, com a service role key) chama essa function.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')
const DASHBOARD_URL = Deno.env.get('DASHBOARD_URL') ?? 'https://painel.studio18bricks.com.br'

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
    const { entryId } = await req.json()
    if (!entryId) return json({ error: 'entryId é obrigatório.' }, 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: entry } = await supabase
      .from('restock_waitlist')
      .select('customer_name, customer_email, product:products(name)')
      .eq('id', entryId)
      .maybeSingle()
    if (!entry) return json({ ok: true, skipped: 'entry_not_found' })

    const productName = (entry.product as { name?: string } | null)?.name ?? 'Produto'
    const customerLabel = entry.customer_name || entry.customer_email

    await sendTelegram(
      `🔔 <b>Nova entrada na lista de espera</b>\n${productName}\n${customerLabel} (${entry.customer_email})\n\n${DASHBOARD_URL}/lista-espera`,
    )

    return json({ ok: true })
  } catch (err) {
    console.error('Erro ao notificar nova entrada na lista de espera:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado.' }, 500)
  }
})
