import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Cog, Heart, ShoppingBag } from 'lucide-react'
import { ProductArt } from '@/components/ProductArt'
import { formatBRL } from '@/lib/format'
import { installmentPrice, LOW_STOCK_THRESHOLD, MAX_INSTALLMENTS, pixPrice, unitPriceWithMotor } from '@/lib/pricing'
import { useCart } from '@/lib/cart'
import { useAuth } from '@/lib/auth'
import { useFavorites } from '@/lib/favorites'
import type { CatalogProduct } from '@/types/catalog'

export function ProductCard({ product, index = 0 }: { product: CatalogProduct; index?: number }) {
  const { addItem } = useCart()
  const { session } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const navigate = useNavigate()
  const [justAdded, setJustAdded] = useState(false)
  const [wantMotor, setWantMotor] = useState(false)
  const favorited = isFavorite(product.id)
  const priceUnknown = product.sale_price_brl <= 0
  const outOfStock = product.quantity_available <= 0
  const lowStock = !outOfStock && product.quantity_available <= LOW_STOCK_THRESHOLD
  const hasMotorOption = Boolean(product.motor_product_id && product.motor_price_brl)
  const motorInStock = (product.motor_quantity_available ?? 0) > 0
  const withMotor = hasMotorOption && motorInStock && wantMotor
  const effectivePrice = unitPriceWithMotor(product, withMotor)

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
          <span
            className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide opacity-90 transition-opacity group-hover:opacity-100"
            style={{ background: 'rgba(6,6,6,0.7)', color: 'var(--ink-secondary)', border: '1px solid var(--hairline)' }}
          >
            Mais detalhes
            <ArrowUpRight size={11} strokeWidth={2} />
          </span>

          <button
            type="button"
            aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!session) {
                navigate('/conta')
                return
              }
              toggleFavorite(product.id)
            }}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition"
            style={{ background: 'rgba(6,6,6,0.7)', border: '1px solid var(--hairline)' }}
          >
            <Heart
              size={14}
              strokeWidth={2}
              fill={favorited ? 'var(--gold-bright)' : 'none'}
              style={{ color: favorited ? 'var(--gold-bright)' : 'var(--ink-secondary)' }}
            />
          </button>
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

          {lowStock && (
            <div className="mt-2 text-xs font-medium" style={{ color: '#e2a33f' }}>
              Restam só {product.quantity_available} unidades
            </div>
          )}
          {outOfStock && (
            <div className="mt-2 text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
              Esgotado no lote atual
            </div>
          )}

          {hasMotorOption && !outOfStock && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (motorInStock) setWantMotor((v) => !v)
              }}
              disabled={!motorInStock}
              className="mt-3 flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: withMotor ? 'var(--gold-dim)' : 'var(--hairline)',
                background: withMotor ? 'var(--gold-wash)' : 'transparent',
              }}
            >
              <span className="flex items-center gap-1.5" style={{ color: withMotor ? 'var(--gold-bright)' : 'var(--ink-secondary)' }}>
                <Cog size={12} strokeWidth={2} />
                Motor funcional
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="tabular" style={{ color: withMotor ? 'var(--gold-bright)' : 'var(--ink-muted)' }}>
                  {motorInStock ? `+${formatBRL(product.motor_price_brl!)}` : 'indisponível'}
                </span>
                {motorInStock && (
                  <span
                    className="relative h-3.5 w-6 shrink-0 rounded-full border transition-colors"
                    style={{
                      background: withMotor ? 'var(--gold)' : 'var(--carbon-1)',
                      borderColor: withMotor ? 'var(--gold)' : 'var(--ink-muted)',
                    }}
                  >
                    <span
                      className="absolute top-1/2 h-2.5 w-2.5 rounded-full transition-transform"
                      style={{
                        background: withMotor ? '#0a0a0a' : 'var(--ink-muted)',
                        transform: withMotor ? 'translate(11px, -50%)' : 'translate(1px, -50%)',
                      }}
                    />
                  </span>
                )}
              </span>
            </button>
          )}

          <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
            <div>
              {priceUnknown ? (
                <div className="text-sm font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  Preço em breve
                </div>
              ) : (
                <>
                  <div className="text-[10px] tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                    À VISTA NO PIX
                  </div>
                  <div className="tabular text-lg font-semibold" style={{ color: 'var(--gold-bright)' }}>
                    {formatBRL(pixPrice(effectivePrice))}
                  </div>
                  <div className="tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                    ou {MAX_INSTALLMENTS}x de {formatBRL(installmentPrice(effectivePrice))} no cartão
                  </div>
                </>
              )}
            </div>
            {outOfStock ? (
              <span
                className="shrink-0 rounded-full px-3 py-2 text-xs font-medium"
                style={{ border: '1px solid var(--gold-dim)', color: 'var(--gold-bright)' }}
              >
                Avise-me →
              </span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  addItem(product.id, 1, product.name, withMotor)
                  setJustAdded(true)
                }}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium"
                style={{ background: 'var(--gold)', color: '#0a0a0a' }}
              >
                <ShoppingBag size={13} strokeWidth={2} />
                + Carrinho
              </button>
            )}
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
