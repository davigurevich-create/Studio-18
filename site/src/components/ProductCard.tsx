import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Cog, Heart, ShoppingBag } from 'lucide-react'
import { ProductArt } from '@/components/ProductArt'
import { formatBRL } from '@/lib/format'
import { installmentValue, INTEREST_FREE_INSTALLMENTS, LOW_STOCK_THRESHOLD, pixPrice, unitPriceWithMotor } from '@/lib/pricing'
import { useCart } from '@/lib/cart'
import { useAuth } from '@/lib/auth'
import { useFavorites } from '@/lib/favorites'
import { navigateWithCoverTransition } from '@/lib/coverTransition'
import { cardAngles } from '@/lib/productAngles'
import type { CatalogProduct } from '@/types/catalog'

// intervalo entre uma foto e a próxima quando o card está alternando ângulos
const ANGLE_INTERVAL_MS = 2200

export function ProductCard({
  product,
  index = 0,
  inRail = false,
  railActive = false,
}: {
  product: CatalogProduct
  index?: number
  /** card dentro de um trilho horizontal (ProductRail) — liga o brilho que acompanha a inclinação */
  inRail?: boolean
  /** card centralizado no trilho — alterna os ângulos da foto sozinho */
  railActive?: boolean
}) {
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

  // Troca de ângulo: o card em destaque (centro do trilho no celular, ou sob
  // o mouse no desktop) alterna sozinho entre a capa e mais dois ângulos do
  // modelo. As fotos extras só entram no DOM na primeira vez que o card
  // fica em destaque — senão cada card da vitrine baixaria 3 fotos de cara.
  const imageRef = useRef<HTMLDivElement>(null)
  const angles = useMemo(() => cardAngles(product), [product])
  const reducedMotion = useReducedMotion()
  const inView = useInView(imageRef, { amount: 0.6 })
  const [hovered, setHovered] = useState(false)
  const [angleIndex, setAngleIndex] = useState(0)
  const [extrasMounted, setExtrasMounted] = useState(false)
  const cycling = !reducedMotion && angles.length > 1 && inView && (railActive || hovered)

  useEffect(() => {
    if (!cycling) {
      setAngleIndex(0)
      return
    }
    setExtrasMounted(true)
    const timer = window.setInterval(() => setAngleIndex((i) => (i + 1) % angles.length), ANGLE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [cycling, angles.length])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.05 }}
    >
      <Link
        id={`product-${product.id}`}
        to={`/produto/${product.id}`}
        className="group block overflow-hidden rounded-xl border transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[var(--gold-dim)] hover:shadow-[0_24px_44px_-18px_rgba(0,0,0,0.6)]"
        style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
        onClick={(e) => {
          sessionStorage.setItem('lastViewedProduct', product.id)
          // clique simples: a foto do card "voa" e vira a capa da página do
          // produto. Ctrl/Cmd+clique, botão do meio etc. seguem o link normal.
          if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
          e.preventDefault()
          navigateWithCoverTransition(imageRef.current, () => navigate(`/produto/${product.id}`))
        }}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <div className="relative">
          <div ref={imageRef} data-card-cover={product.id} className="relative h-52 w-full overflow-hidden">
            <ProductArt product={product} className="h-full w-full" />
            {extrasMounted &&
              angles.slice(1).map((angle, i) => (
                <img
                  key={angle.url}
                  src={angle.url}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                  style={{ opacity: angleIndex === i + 1 ? 1 : 0 }}
                />
              ))}
            {inRail && <div className="rail-sheen pointer-events-none absolute inset-0" />}
            {cycling && (
              <span
                className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider"
                style={{ background: 'rgba(6,6,6,0.7)', color: 'var(--ink-secondary)', border: '1px solid var(--hairline)' }}
              >
                {angles[angleIndex]?.label}
                <span className="flex gap-[3px]">
                  {angles.map((angle, i) => (
                    <span
                      key={angle.url}
                      className="h-1 w-1 rounded-full transition-colors duration-300"
                      style={{ background: i === angleIndex ? 'var(--gold-bright)' : 'var(--ink-muted)' }}
                    />
                  ))}
                </span>
              </span>
            )}
          </div>
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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-2 gap-y-3 border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
            <div className="min-w-0">
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
                    ou {formatBRL(effectivePrice)} em {INTEREST_FREE_INSTALLMENTS}x de{' '}
                    {formatBRL(installmentValue(effectivePrice, INTEREST_FREE_INSTALLMENTS))} sem juros
                  </div>
                </>
              )}
            </div>
            {outOfStock ? (
              <span
                className="ml-auto shrink-0 rounded-full px-3 py-2 text-xs font-medium"
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
                className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium"
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
