import type { ReactNode } from 'react'

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

/**
 * Conversor minimo de texto do blog: paragrafos separados por linha em
 * branco, "## " vira subtitulo, "**texto**" vira negrito. Sem dependencia
 * de parser de markdown completo — so o suficiente para estruturar artigos
 * com boa hierarquia (H2) para SEO.
 */
export function renderBlogContent(content: string): ReactNode[] {
  const blocks = content
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)

  return blocks.map((block, i) => {
    if (block.startsWith('## ')) {
      return (
        <h2 key={i} className="mt-4 text-xl font-semibold sm:text-2xl" style={{ color: 'var(--ink)' }}>
          {renderInline(block.slice(3))}
        </h2>
      )
    }
    return (
      <p key={i} className="text-base leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
        {renderInline(block)}
      </p>
    )
  })
}
