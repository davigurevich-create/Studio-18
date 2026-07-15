import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ProductArt } from '@/components/ProductArt'
import { formatBRL } from '@/lib/format'
import { useCart } from '@/lib/cart'
import type { CatalogProduct } from '@/types/catalog'

export function ProductCard({ product, index = 0 }: { product: CatalogProduct; index?: number }) {
  const { addItem } = useCart()

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.05 }}
    >
      <Link
        to={`/produto/${product.id}`}
        className="group block overflow-hidden rounded-xl border transition-colors"
        style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold-dim)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--hairline)')}
      >
        <div className="relative">
          <ProductArt product={product} className="h-52 w-full" />
          {product.collection_tag && (
            <span
              className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-widest"
              style={{ background: 'rgba(6,6,6,0.7)', color: 'var(--gold-bright)', border: '1px solid var(--gold-dim)' }}
            >
              {product.collection_tag.toUpperCase()}
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-base font-medium leading-snug" style={{ color: 'var(--ink)' }}>
              {product.name}
            </h3>
            <span className="shrink-0 text-xs" style={{ color: 'var(--ink-muted)' }}>
              {product.scale}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs" style={{ color: 'var(--ink-secondary)' }}>
            <span>{product.manufacturer}</span>
            <span className="tabular">{product.piece_count?.toLocaleString('pt-BR')} peças</span>
          </div>

          <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
            <div>
              <div className="text-[10px] tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                INVESTIMENTO DE
              </div>
              <div className="tabular text-lg font-semibold" style={{ color: 'var(--gold-bright)' }}>
                {formatBRL(product.sale_price_brl)}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                addItem(product.id, 1, product.name)
              }}
              className="shrink-0 rounded-full px-3 py-2 text-xs font-medium"
              style={{ background: 'var(--gold)', color: '#0a0a0a' }}
            >
              + Carrinho
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
