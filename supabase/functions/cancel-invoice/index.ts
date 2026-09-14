// Cancela uma NF-e já autorizada via Focus NFe. Só a equipe (staff) pode
// chamar isso — mesmo padrão do emit-invoice/generate-shipping-label.
//
// A SEFAZ só permite cancelamento dentro de um prazo curto depois da
// autorização (normalmente 24h, varia por UF) — se a Focus NFe recusar por
// prazo expirado, o erro dela já vem com essa explicação.
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
const FOCUS_NFE_ENV = Deno.env.get('FOCUS_NFE_ENV') ?? 'homologacao'
const FOCUS_BASE_URL = FOCUS_NFE_ENV === 'producao' ? 'https://api.focusnfe.com.br' : 'https://homologacao.focusnfe.com.br'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function focusAuthHeader() {
  return 'Basic ' + btoa(`${FOCUS_NFE_TOKEN}:`)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!FOCUS_NFE_TOKEN) {
      return json({ error: 'Focus NFe ainda não configurado (secret FOCUS_NFE_TOKEN).' }, 400)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autenticado.' }, 401)
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: isStaff } = await callerClient.rpc('is_staff')
    if (!isStaff) return json({ error: 'Só a equipe pode cancelar nota fiscal.' }, 403)

    const { saleId, justificativa } = await req.json()
    if (!saleId) return json({ error: 'saleId é obrigatório.' }, 400)
    // A SEFAZ exige justificativa com pelo menos 15 caracteres — a Focus
    // NFe rejeita o pedido de cancelamento sem isso.
    if (!justificativa || String(justificativa).trim().length < 15) {
      return json({ error: 'A justificativa precisa ter pelo menos 15 caracteres.' }, 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: sale, error: saleError } = await supabase.from('sales').select('*').eq('id', saleId).maybeSingle()
    if (saleError || !sale) return json({ error: 'Pedido não encontrado.' }, 404)

    if (sale.invoice_status !== 'autorizada' || !sale.invoice_ref) {
      return json({ error: 'Esse pedido não tem uma nota fiscal autorizada pra cancelar.' }, 400)
    }

    const cancel = await fetch(`${FOCUS_BASE_URL}/v2/nfe/${sale.invoice_ref}`, {
      method: 'DELETE',
      headers: { Authorization: focusAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ justificativa: String(justificativa).trim() }),
    })
    const data = await cancel.json().catch(() => null)

    if (!cancel.ok) {
      const message = typeof data?.mensagem === 'string' ? data.mensagem : 'Falha ao cancelar nota fiscal na Focus NFe.'
      return json({ error: message, raw: data }, 502)
    }

    await supabase
      .from('sales')
      .update({ invoice_status: 'cancelada', invoice_error: null })
      .eq('id', saleId)

    return json({ status: 'cancelada' })
  } catch (err) {
    console.error('Erro ao cancelar nota fiscal:', err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado ao cancelar nota fiscal.' }, 500)
  }
})
