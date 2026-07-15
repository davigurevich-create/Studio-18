// Gera automaticamente um rascunho de artigo de blog a cada ~10 dias
// (chamada via pg_cron, ver 008_blog_automation.sql). Antes de escrever,
// compara os proximos temas da fila (blog_topics) com TODOS os artigos ja
// existentes (publicados, rascunhos, gerados manualmente ou por IA) para
// evitar repetir assunto. Grava o resultado como rascunho (published =
// false) para o time revisar e aprovar no painel de gestao.
import { createClient } from 'npm:@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MODEL = 'claude-sonnet-5'

// Quantos temas da fila (em ordem de prioridade) sao oferecidos como opcao —
// da margem pra IA pular um tema ja coberto sem travar o pipeline inteiro.
const CANDIDATE_COUNT = 6

const BRAND_CONTEXT = `
Você é o redator-chefe de conteúdo da Studio 18, uma boutique brasileira de sets técnicos de blocos de montar premium (carros, motos e motores em escala 1:8), com pronta entrega no Brasil e curadoria própria.

Seu trabalho tem duas etapas:

1. CURADORIA — Você recebe uma lista de temas candidatos (em ordem de prioridade) e a lista de títulos de artigos que já existem no blog (publicados ou em rascunho, escritos manualmente ou por você mesmo em execuções anteriores). Escolha o PRIMEIRO tema candidato que ainda não tenha sido coberto, mesmo que o título de um artigo existente use palavras diferentes — o que importa é se o ASSUNTO CENTRAL já foi tratado. Por exemplo, "guia para escolher seu primeiro set técnico" e "guia completo de compra de carros de blocos de montar" são o MESMO assunto, mesmo com títulos diferentes. Se TODOS os temas candidatos já estiverem cobertos, invente você mesmo um tema novo, dentro do universo central (sets técnicos, montagem, colecionismo, escala 1:8) ou adjacente (engenharia automotiva, design, hobbies manuais, decoração, presentes) — nunca um assunto desconexo da marca (nada de política, notícias genéricas, outros nichos de colecionismo sem relação, etc).

2. REDAÇÃO — Depois de escolher o tema, escreva um artigo de blog em português do Brasil, otimizado para SEO, que:
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
    description: 'Registra qual tema candidato foi escolhido (ou o novo tema inventado) e cria o artigo de blog completo, pronto para publicação como rascunho.',
    input_schema: {
      type: 'object',
      properties: {
        chosen_candidate_topic: {
          type: 'string',
          description:
            'Copie EXATAMENTE (palavra por palavra) o texto de um dos temas candidatos fornecidos, se você escolheu um deles. Se nenhum candidato servia (todos já cobertos) e você inventou um tema novo, deixe este campo como string vazia.',
        },
        title: { type: 'string', description: 'Título do artigo, chamativo e com boa palavra-chave' },
        slug: { type: 'string', description: 'Slug em minúsculas, com hífens, sem acentos, curto (ex: guia-carros-blocos-montar)' },
        excerpt: { type: 'string', description: 'Resumo de 1-2 frases para a listagem do blog e meta-descrição' },
        content: { type: 'string', description: 'Conteúdo completo do artigo, seguindo as regras de formatação' },
      },
      required: ['chosen_candidate_topic', 'title', 'slug', 'excerpt', 'content'],
    },
  },
]

Deno.serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: candidateTopics } = await supabase
      .from('blog_topics')
      .select('id, topic')
      .eq('used', false)
      .order('position', { ascending: true })
      .limit(CANDIDATE_COUNT)

    const { data: existingPosts } = await supabase
      .from('blog_posts')
      .select('title, excerpt')
      .order('created_at', { ascending: false })
      .limit(60)

    const existingList = (existingPosts ?? [])
      .map((p) => `- ${p.title}${p.excerpt ? ` (${p.excerpt})` : ''}`)
      .join('\n')
    const candidateList = (candidateTopics ?? []).map((t, i) => `${i + 1}. ${t.topic}`).join('\n')

    const userPrompt = `TEMAS CANDIDATOS (em ordem de prioridade):
${candidateList || '(fila vazia — invente um tema novo dentro do universo da marca)'}

ARTIGOS JÁ EXISTENTES NO BLOG (não repita o assunto central de nenhum destes):
${existingList || '(nenhum artigo existente ainda)'}

Siga o processo de curadoria descrito nas suas instruções: escolha o primeiro tema candidato ainda não coberto, ou invente um novo se todos já estiverem cobertos. Depois escreva o artigo completo.`

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

    const article = toolUse.input as {
      chosen_candidate_topic: string
      title: string
      slug: string
      excerpt: string
      content: string
    }
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

    // So marca como usado o tema que a IA realmente escolheu (comparando o
    // texto exato) — assim, temas pulados por ja estarem cobertos continuam
    // disponiveis para reavaliacao futura em vez de sumir da fila.
    const matchedTopic = (candidateTopics ?? []).find(
      (t) => t.topic.trim() === article.chosen_candidate_topic?.trim(),
    )
    if (matchedTopic) {
      await supabase.from('blog_topics').update({ used: true }).eq('id', matchedTopic.id)
    }

    return json({ success: true, post: inserted, chosen_topic: article.chosen_candidate_topic || '(tema novo, inventado)' })
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
