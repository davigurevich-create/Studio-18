// Link de descadastro no rodapé do e-mail de campanha aponta direto pra
// esta function (sem precisar de uma rota no site) — pública, sem login,
// só com o id (uuid, não adivinhável) do lead como prova de identidade.
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function html(body: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><title>Studio 18</title></head>
     <body style="margin:0;background:#060606;color:#f3f1ec;font-family:Helvetica,Arial,sans-serif;">
       <div style="max-width:480px;margin:80px auto;padding:0 24px;text-align:center;">${body}</div>
     </body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return html('<p>Link inválido.</p>', 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { error } = await supabase.from('leads').update({ unsubscribed_at: new Date().toISOString() }).eq('id', id)
    if (error) {
      console.error('Falha ao descadastrar lead:', error)
      return html('<p>Não foi possível processar agora. Tente novamente em instantes.</p>', 500)
    }

    return html('<h1 style="font-size:20px;">Pronto.</h1><p style="color:#b7b3a9;">Você não vai mais receber e-mails de campanha da Studio 18.</p>')
  } catch (err) {
    console.error('Erro em unsubscribe-lead:', err)
    return html('<p>Não foi possível processar agora.</p>', 500)
  }
})
