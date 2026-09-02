import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { getCategoryBySlug } from '@/lib/categories'
import { getCatalog } from '@/lib/api'
import type { CatalogProduct } from '@/types/catalog'

type SortKey = 'nome' | 'preco-asc' | 'preco-desc' | 'pecas-asc' | 'pecas-desc'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'nome', label: 'Nome (A–Z)' },
  { value: 'preco-asc', label: 'Investimento (menor primeiro)' },
  { value: 'preco-desc', label: 'Investimento (maior primeiro)' },
  { value: 'pecas-asc', label: 'Peças (menos primeiro)' },
  { value: 'pecas-desc', label: 'Peças (mais primeiro)' },
]

export function Categoria() {
  const { slug } = useParams<{ slug: string }>()
  const category = getCategoryBySlug(slug)

  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('nome')

  useEffect(() => {
    getCatalog().then((p) => {
      setProducts(p)
      setLoading(false)
    })
  }, [])

  const categoryProducts = useMemo(() => {
    if (!category) return []
    let list = products.filter((p) => category.skus.includes(p.sku))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.manufacturer?.toLowerCase().includes(q))
    }
    const sorted = [...list]
    switch (sortBy) {
      case 'preco-asc':
        sorted.sort((a, b) => a.sale_price_brl - b.sale_price_brl)
        break
      case 'preco-desc':
        sorted.sort((a, b) => b.sale_price_brl - a.sale_price_brl)
        break
      case 'pecas-asc':
        sorted.sort((a, b) => (a.piece_count ?? 0) - (b.piece_count ?? 0))
        break
      case 'pecas-desc':
        sorted.sort((a, b) => (b.piece_count ?? 0) - (a.piece_count ?? 0))
        break
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name))
    }
    return sorted
  }, [products, category, search, sortBy])

  if (!category) return <Navigate to="/" replace />

  return (
    <div>
      {/* banner de abertura — mesma imagem do card na home, funcionando
          como "introdução" visual à categoria */}
      <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-auto sm:h-[56vh] sm:max-h-[560px]">
        <picture>
          <source media="(max-width: 639px)" srcSet={category.bannerMobile} />
          <img src={category.banner} alt={category.title} className="absolute inset-0 h-full w-full object-cover" />
        </picture>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(to top, var(--carbon-0), transparent 55%)' }}
        />
        <Link
          to="/"
          className="absolute left-6 top-20 z-[60] flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium tracking-wide backdrop-blur-sm transition sm:left-10 sm:top-24"
          style={{ background: 'rgba(6,6,6,0.55)', color: 'var(--ink-secondary)', border: '1px solid var(--hairline)' }}
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Coleção
        </Link>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-16">
        {/* título fica só no banner (já incorporado na imagem) — aqui, uma
            frase curta que dá contexto/significado à categoria, sem repetir
            o nome */}
        <h1 className="sr-only">{category.title}</h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-2 max-w-2xl text-xl leading-snug sm:text-3xl"
        >
          {category.tagline}
        </motion.p>
        <p className="mb-10 text-sm" style={{ color: 'var(--ink-muted)' }}>
          {categoryProducts.length} {categoryProducts.length === 1 ? 'modelo disponível' : 'modelos disponíveis'} nessa
          coleção.
        </p>

        {loading ? (
          <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
            Carregando coleção...
          </p>
        ) : (
          <>
            <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou fabricante..."
                className="w-full rounded-lg border bg-transparent px-4 py-2 text-sm outline-none sm:w-64"
                style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="rounded-lg border px-4 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)', color: 'var(--ink)' }}
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {categoryProducts.length === 0 ? (
              <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
                Nenhum modelo encontrado com esses filtros.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {categoryProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
