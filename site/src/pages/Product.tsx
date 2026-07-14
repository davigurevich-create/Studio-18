import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ProductArt } from '@/components/ProductArt'
import { getProduct } from '@/lib/api'
import { formatBRL } from '@/lib/format'
import type { CatalogProduct } from '@/types/catalog'

export function Product() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<CatalogProduct | null | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    getProduct(id).then((p) => setProduct(p ?? null))
  }, [id])

  if (product === undefined) {
    return <div className="px-6 py-40 text-center" style={{ color: 'var(--ink-muted)' }}>Carregando...</div>
  }

  if (product === null) {
    return (
      <div className="px-6 py-40 text-center">
        <p style={{ color: 'var(--ink-muted)' }}>Modelo não encontrado.</p>
        <Link to="/" className="mt-4 inline-block text-sm" style={{ color: 'var(--gold)' }}>
          Voltar para a coleção
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <button
        onClick={() => navigate(-1)}
        className="mb-8 text-sm"
        style={{ color: 'var(--ink-muted)' }}
      >
        ← Voltar para a coleção
      </button>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <ProductArt product={product} className="aspect-square w-full rounded-2xl" />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          {product.collection_tag && (
            <span
              className="mb-4 inline-block rounded-full px-3 py-1 text-[11px] font-semibold tracking-widest"
              style={{ background: 'var(--gold-wash)', color: 'var(--gold-bright)', border: '1px solid var(--gold-dim)' }}
            >
              {product.collection_tag.toUpperCase()}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl">{product.name}</h1>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-y py-6 sm:grid-cols-4" style={{ borderColor: 'var(--hairline)' }}>
            <Info label="Fabricante" value={product.manufacturer ?? '—'} />
            <Info label="Escala" value={product.scale} />
            <Info label="Peças" value={product.piece_count?.toLocaleString('pt-BR') ?? '—'} />
            <Info label="Dimensões" value={product.dimensions ?? 'Em breve'} />
          </dl>

          <div className="mt-8">
            <h2 className="mb-2 text-sm font-semibold tracking-wide" style={{ color: 'var(--ink)' }}>
              História automotiva
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              {product.automotive_history ??
                'A história completa deste modelo está sendo preparada pela nossa curadoria e chega em breve — mas o legado de engenharia por trás dele já está presente em cada uma das peças deste set.'}
            </p>
          </div>

          <div className="mt-10 flex items-end justify-between border-t pt-6" style={{ borderColor: 'var(--hairline)' }}>
            <div>
              <div className="text-[10px] tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                INVESTIMENTO DE
              </div>
              <div className="tabular text-3xl font-semibold" style={{ color: 'var(--gold-bright)' }}>
                {formatBRL(product.sale_price_brl)}
              </div>
            </div>
            <Link
              to={`/checkout/${product.id}`}
              className="rounded-full px-8 py-3 text-sm font-medium tracking-wide"
              style={{ background: 'var(--gold)', color: '#0a0a0a' }}
            >
              Comprar
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-widest" style={{ color: 'var(--ink-muted)' }}>
        {label.toUpperCase()}
      </div>
      <div className="mt-1 text-sm" style={{ color: 'var(--ink)' }}>
        {value}
      </div>
    </div>
  )
}
