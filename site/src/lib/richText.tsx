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
 * branco, "## " vira subtitulo, "- " no inicio de todas as linhas de um
 * bloco vira lista, "**texto**" vira negrito. Sem dependencia de parser de
 * markdown completo — so o suficiente para estruturar artigos com boa
 * hierarquia (H2) e listas para SEO.
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

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length > 0 && lines.every((l) => l.startsWith('- '))) {
      return (
        <ul key={i} className="list-disc pl-5" style={{ color: 'var(--ink-secondary)' }}>
          {lines.map((l, j) => (
            <li key={j} className="text-base leading-relaxed">
              {renderInline(l.slice(2))}
            </li>
          ))}
        </ul>
      )
    }

    return (
      <p key={i} className="text-base leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
        {lines.flatMap((l, j) => (j === 0 ? renderInline(l) : [<br key={`br-${j}`} />, ...renderInline(l)]))}
      </p>
    )
  })
}
