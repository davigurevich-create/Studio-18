import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, ShoppingBag } from 'lucide-react'
import { ProductArt } from '@/components/ProductArt'
import { formatBRL } from '@/lib/format'
import { pixPrice } from '@/lib/pricing'
import { useCart } from '@/lib/cart'
import type { CatalogProduct } from '@/types/catalog'

export function ProductCard({ product, index = 0 }: { product: CatalogProduct; index?: number }) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [justAdded, setJustAdded] = useState(false)

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
          <span
            className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide opacity-90 transition-opacity group-hover:opacity-100"
            style={{ background: 'rgba(6,6,6,0.7)', color: 'var(--ink-secondary)', border: '1px solid var(--hairline)' }}
          >
            Mais detalhes
            <ArrowUpRight size={11} strokeWidth={2} />
          </span>
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

          <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
            <div>
              <div className="text-[10px] tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                À VISTA NO PIX
              </div>
              <div className="flex items-baseline gap-2">
                <span className="tabular text-lg font-semibold" style={{ color: 'var(--gold-bright)' }}>
                  {formatBRL(pixPrice(product.sale_price_brl))}
                </span>
                <span className="tabular text-xs line-through" style={{ color: 'var(--ink-muted)' }}>
                  {formatBRL(product.sale_price_brl)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                addItem(product.id, 1, product.name)
                setJustAdded(true)
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium"
              style={{ background: 'var(--gold)', color: '#0a0a0a' }}
            >
              <ShoppingBag size={13} strokeWidth={2} />
              + Carrinho
            </button>
          </div>

          <AnimatePresence>
            {justAdded && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    navigate('/checkout')
                  }}
                  className="w-full rounded-full border py-2.5 text-xs font-semibold tracking-wide"
                  style={{ borderColor: 'var(--gold)', color: 'var(--gold-bright)', background: 'var(--gold-wash)' }}
                >
                  Finalizar compra →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>
    </motion.div>
  )
}
