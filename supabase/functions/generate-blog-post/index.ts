// Gera automaticamente um rascunho de artigo de blog a cada ~10 dias
// (chamada via pg_cron, ver 008_blog_automation.sql). Consome o proximo
// tema nao usado da fila (blog_topics), pede pra Claude escrever o artigo
// completo com foco em SEO, e grava como rascunho (published = false) para
// o time revisar e aprovar no painel de gestao antes de publicar.
import { createClient } from 'npm:@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MODEL = 'claude-sonnet-5'

const BRAND_CONTEXT = `
Você é o redator de conteúdo da Studio 18, uma boutique brasileira de sets técnicos de blocos de montar premium (carros, motos e motores em escala 1:8), com pronta entrega no Brasil e curadoria própria.

Seu objetivo é escrever um artigo de blog em português do Brasil, otimizado para SEO, que:
- Seja natural e informativo, nunca "recheado" de palavras-chave de forma forçada.
- Use termos que pessoas realmente buscam no Google: "carros de blocos de montar", "sets técnicos", "escala 1:8", "kit de montagem premium", "colecionador de miniaturas", conforme fizer sentido para o tema.
- Tenha entre 600 e 900 palavras.
- Seja estruturado com 4 a 6 subtítulos (##).
- Use **negrito** para destacar 2 a 4 termos ou frases-chave importantes ao longo do texto.
- Quando fizer sentido, use uma lista com marcadores (linhas começando com "- ").
- Termine com uma seção final "## Perguntas frequentes" com 2 a 3 perguntas e respostas curtas.
- Mencione a Studio 18 de forma natural em pelo menos um parágrafo (nunca como propaganda excessiva), reforçando pronta entrega no Brasil e curadoria própria.
- NÃO use links, markdown de imagem, ou qualquer sintaxe além de "##" (subtítulo), "**texto**" (negrito) e "- " (item de lista).
- Separe parágrafos e blocos com uma linha em branco.
`.trim()

const tools = [
  {
    name: 'criar_artigo',
    description: 'Cria o artigo de blog completo, estruturado, pronto para publicação como rascunho.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título do artigo, chamativo e com boa palavra-chave' },
        slug: { type: 'string', description: 'Slug em minúsculas, com hífens, sem acentos, curto (ex: guia-carros-blocos-montar)' },
        excerpt: { type: 'string', description: 'Resumo de 1-2 frases para a listagem do blog e meta-descrição' },
        content: { type: 'string', description: 'Conteúdo completo do artigo, seguindo as regras de formatação' },
      },
      required: ['title', 'slug', 'excerpt', 'content'],
    },
  },
]

Deno.serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: nextTopic } = await supabase
      .from('blog_topics')
      .select('id, topic')
      .eq('used', false)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle()

    const { data: existingPosts } = await supabase.from('blog_posts').select('title').order('created_at', { ascending: false }).limit(30)
    const existingTitles = (existingPosts ?? []).map((p) => p.title).join('\n- ')

    const topic =
      nextTopic?.topic ??
      `Escolha um tema novo e relevante sobre carros/motos/motores de blocos de montar técnicos (ou um tema adjacente: engenharia, colecionismo, design automotivo, hobbies manuais) que ainda não foi coberto pelos artigos já publicados abaixo:\n- ${existingTitles}`

    const userPrompt = `Escreva o artigo sobre o seguinte tema: "${topic}"${
      nextTopic ? '' : '\n\nEvite repetir assuntos já cobertos pelos títulos existentes listados acima.'
    }`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: BRAND_CONTEXT,
        messages: [{ role: 'user', content: userPrompt }],
        tools,
        tool_choice: { type: 'tool', name: 'criar_artigo' },
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      return json({ error: `Erro ao gerar artigo: ${errBody}` }, 502)
    }

    const data = await response.json()
    const toolUse = data.content?.find((c: { type: string }) => c.type === 'tool_use')
    if (!toolUse) {
      return json({ error: 'A IA não retornou um artigo estruturado.' }, 502)
    }

    const article = toolUse.input as { title: string; slug: string; excerpt: string; content: string }
    const slug = article.slug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const { data: inserted, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: article.title,
        slug,
        excerpt: article.excerpt,
        content: article.content,
        author: 'Studio 18',
        published: false,
        ai_generated: true,
      })
      .select()
      .single()

    if (insertError) {
      return json({ error: `Erro ao salvar rascunho: ${insertError.message}` }, 500)
    }

    if (nextTopic) {
      await supabase.from('blog_topics').update({ used: true }).eq('id', nextTopic.id)
    }

    return json({ success: true, post: inserted })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado.' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
