import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { recommendSets } from '@/lib/api'
import { useTurnstile } from '@/lib/useTurnstile'
import type { CatalogProduct } from '@/types/catalog'

interface Recommendation {
  product: CatalogProduct
  reason: string
}

export function AiRecommender({ products }: { products: CatalogProduct[] }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Recommendation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { containerRef: turnstileRef, getToken } = useTurnstile()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const text = query.trim()
    if (!text || loading) return

    setLoading(true)
    setError(null)
    try {
      const turnstileToken = await getToken()
      const picks = await recommendSets(text, turnstileToken)

      const matched: Recommendation[] = picks
        .map((p) => {
          const product = products.find((prod) => prod.sku === p.sku)
          return product ? { product, reason: p.reason } : null
        })
        .filter((r): r is Recommendation => r !== null)
        // os modelos ainda sem preço definido (novidades fora de estoque)
        // sempre por último, mesmo que a IA os tenha priorizado
        .sort((a, b) => Number(a.product.sale_price_brl <= 0) - Number(b.product.sale_price_brl <= 0))

      if (matched.length === 0) {
        setError('Não encontramos um set que combine com essa descrição. Tente descrever de outro jeito.')
        setResults(null)
      } else {
        setResults(matched)
      }
    } catch {
      setError('Não conseguimos gerar uma recomendação agora. Tente novamente em instantes.')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-6 py-24">
      <div ref={turnstileRef} />
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow mb-3">IA proprietária Studio 18</p>
        <h2 className="mx-auto mb-4 max-w-xl text-3xl sm:text-4xl">Não sabe por onde começar?</h2>
        <p className="mx-auto mb-10 max-w-lg text-sm" style={{ color: 'var(--ink-muted)' }}>
          Descreva em poucas palavras o que você procura — estilo, marca, uso — e nossa IA sugere o set ideal pra
          você.
        </p>

        <form onSubmit={handleSubmit} className="mx-auto flex max-w-xl flex-col items-center gap-4 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: um carro esportivo italiano, pra exibir na sala"
            className="w-full flex-1 border-b bg-transparent px-1 py-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
          />
          <button
            type="submit"
            disabled={loading || products.length === 0}
            className="glass-pill flex shrink-0 items-center gap-2 px-7 py-3 text-sm font-medium tracking-wide disabled:opacity-50"
            style={{ color: 'var(--gold-bright)' }}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles size={14} strokeWidth={2} />
              {loading ? 'Buscando...' : 'Recomendar'}
            </span>
          </button>
        </form>

        {error && (
          <p className="mt-6 text-sm" style={{ color: 'var(--ink-muted)' }}>
            {error}
          </p>
        )}
      </div>

      {results && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {results.map(({ product, reason }) => (
            <div key={product.id} className="flex flex-col gap-3">
              <ProductCard product={product} />
              <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                <span style={{ color: 'var(--gold-bright)' }}>Por que combina: </span>
                {reason}
              </p>
            </div>
          ))}
        </motion.div>
      )}
    </section>
  )
}
