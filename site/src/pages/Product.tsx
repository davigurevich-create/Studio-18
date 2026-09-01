import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cog, Heart, Truck } from 'lucide-react'
import { ProductGallery } from '@/components/ProductGallery'
import { RestockWaitlistForm } from '@/components/RestockWaitlistForm'
import { getProduct, getShippingOptions } from '@/lib/api'
import { formatBRL } from '@/lib/format'
import { installmentPrice, LOW_STOCK_THRESHOLD, MAX_INSTALLMENTS, pixPrice, unitPriceWithMotor } from '@/lib/pricing'
import { useCart } from '@/lib/cart'
import { useAuth } from '@/lib/auth'
import { useFavorites } from '@/lib/favorites'
import type { CatalogProduct, ShippingOption } from '@/types/catalog'

export function Product() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { session } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [product, setProduct] = useState<CatalogProduct | null | undefined>(undefined)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [wantMotor, setWantMotor] = useState(false)

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

  const hasMotorOption = Boolean(product.motor_product_id && product.motor_price_brl)
  const motorInStock = (product.motor_quantity_available ?? 0) > 0
  const withMotor = hasMotorOption && motorInStock && wantMotor
  const effectivePrice = unitPriceWithMotor(product, withMotor)

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
          <ProductGallery key={product.id} product={product} className="w-full" />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="mb-4 flex items-center justify-between gap-3">
            {product.collection_tag ? (
              <span
                className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold tracking-widest"
                style={{ background: 'var(--gold-wash)', color: 'var(--gold-bright)', border: '1px solid var(--gold-dim)' }}
              >
                {product.collection_tag.toUpperCase()}
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => {
                if (!session) {
                  navigate('/conta')
                  return
                }
                toggleFavorite(product.id)
              }}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
              style={{
                borderColor: isFavorite(product.id) ? 'var(--gold-dim)' : 'var(--hairline)',
                color: isFavorite(product.id) ? 'var(--gold-bright)' : 'var(--ink-secondary)',
              }}
            >
              <Heart size={14} strokeWidth={2} fill={isFavorite(product.id) ? 'var(--gold-bright)' : 'none'} />
              {isFavorite(product.id) ? 'Favoritado' : 'Favoritar'}
            </button>
          </div>
          <h1 className="text-3xl sm:text-4xl">{product.name}</h1>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-y py-6 sm:grid-cols-4" style={{ borderColor: 'var(--hairline)' }}>
            <Info label="Fabricante" value={product.manufacturer ?? '—'} />
            <Info label="Escala" value={product.scale} />
            <Info label="Peças" value={product.piece_count?.toLocaleString('pt-BR') ?? '—'} />
            <Info label="Dimensões" value={formatDimensions(product)} />
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

          {product.spec_highlights && product.spec_highlights.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-sm font-semibold tracking-wide" style={{ color: 'var(--ink)' }}>
                Ficha técnica
              </h2>
              <ul className="flex flex-col gap-2">
                {product.spec_highlights.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--ink-secondary)' }}>
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: 'var(--gold)' }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10 border-t pt-6" style={{ borderColor: 'var(--hairline)' }}>
            {product.quantity_available > 0 && product.quantity_available <= LOW_STOCK_THRESHOLD && (
              <div className="mb-3 text-sm font-medium" style={{ color: '#e2a33f' }}>
                Restam só {product.quantity_available} unidades neste lote
              </div>
            )}

            {hasMotorOption && (
              <button
                type="button"
                onClick={() => motorInStock && setWantMotor((v) => !v)}
                disabled={!motorInStock}
                className="mb-4 flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  borderColor: withMotor ? 'var(--gold-dim)' : 'var(--hairline)',
                  background: withMotor ? 'var(--gold-wash)' : 'transparent',
                }}
              >
                <span className="flex items-center gap-2">
                  <Cog size={16} strokeWidth={2} style={{ color: withMotor ? 'var(--gold-bright)' : 'var(--ink-secondary)' }} />
                  <span>
                    <span className="block text-sm font-medium" style={{ color: withMotor ? 'var(--gold-bright)' : 'var(--ink)' }}>
                      Adicionar motor funcional
                    </span>
                    <span className="block text-xs" style={{ color: 'var(--ink-muted)' }}>
                      {motorInStock ? 'Réplica funcional do motor, peça a peça' : 'Sem estoque no momento'}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="tabular text-sm font-medium" style={{ color: withMotor ? 'var(--gold-bright)' : 'var(--ink-secondary)' }}>
                    +{formatBRL(product.motor_price_brl!)}
                  </span>
                  <span
                    className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
                    style={{ background: withMotor ? 'var(--gold)' : 'var(--carbon-2)' }}
                  >
                    <span
                      className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                      style={{ transform: withMotor ? 'translateX(18px)' : 'translateX(2px)' }}
                    />
                  </span>
                </span>
              </button>
            )}

            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                  À VISTA NO PIX
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="tabular text-3xl font-semibold" style={{ color: 'var(--gold-bright)' }}>
                    {formatBRL(pixPrice(effectivePrice))}
                  </span>
                  <span className="tabular text-sm line-through" style={{ color: 'var(--ink-muted)' }}>
                    {formatBRL(effectivePrice)}
                  </span>
                </div>
                <div className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
                  ou {MAX_INSTALLMENTS}x de {formatBRL(installmentPrice(effectivePrice))} no cartão, ou boleto
                </div>
              </div>

              {product.quantity_available > 0 && (
                <div className="flex items-center gap-2 rounded-full border px-2 py-1.5" style={{ borderColor: 'var(--hairline)' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-sm"
                    style={{ color: 'var(--ink)' }}
                  >
                    −
                  </button>
                  <span className="tabular w-5 text-center text-sm" style={{ color: 'var(--ink)' }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-sm"
                    style={{ color: 'var(--ink)' }}
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {product.quantity_available > 0 ? (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    addItem(product.id, quantity, product.name, withMotor)
                    setAdded(true)
                    setTimeout(() => setAdded(false), 2000)
                  }}
                  className="flex-1 rounded-full border px-8 py-3 text-sm font-medium tracking-wide"
                  style={{ borderColor: 'var(--gold)', color: 'var(--gold-bright)' }}
                >
                  {added ? 'Adicionado ✓' : 'Adicionar ao carrinho'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addItem(product.id, quantity, undefined, withMotor)
                    navigate('/checkout')
                  }}
                  className="flex-1 rounded-full px-8 py-3 text-sm font-medium tracking-wide"
                  style={{ background: 'var(--gold)', color: '#0a0a0a' }}
                >
                  Comprar agora
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border p-4" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}>
                <p className="mb-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>
                  Esgotado no lote atual
                </p>
                <RestockWaitlistForm productId={product.id} />
              </div>
            )}

            <ShippingCalculator productId={product.id} quantity={quantity} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function ShippingCalculator({ productId, quantity }: { productId: string; quantity: number }) {
  const [zipCode, setZipCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<ShippingOption[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const calculate = async () => {
    const digits = zipCode.replace(/\D/g, '')
    if (digits.length !== 8) return
    setLoading(true)
    setMessage(null)
    setOptions(null)
    try {
      const res = await getShippingOptions(zipCode, [{ productId, quantity }])
      setOptions(res.options)
      if (res.options.length === 0) setMessage(res.message ?? 'Nenhuma opção de frete disponível para este CEP.')
    } catch {
      setOptions([])
      setMessage('Não foi possível calcular o frete agora. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-5 rounded-xl border p-4" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--ink)' }}>
        <Truck size={16} style={{ color: 'var(--gold)' }} />
        Calcular frete e prazo
      </div>
      <div className="flex gap-2">
        <input
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && calculate()}
          placeholder="00000-000"
          className="w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm outline-none"
          style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
        />
        <button
          type="button"
          onClick={calculate}
          disabled={loading || zipCode.replace(/\D/g, '').length !== 8}
          className="shrink-0 rounded-lg border px-4 py-2 text-xs font-medium disabled:opacity-50"
          style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
        >
          {loading ? 'Calculando...' : 'Calcular'}
        </button>
      </div>

      {message && (
        <p className="mt-3 text-xs" style={{ color: '#e88b8b' }}>
          {message}
        </p>
      )}

      {options && options.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {options.map((opt) => (
            <div
              key={`${opt.company}-${opt.service}`}
              className="flex items-center justify-between text-xs"
              style={{ color: 'var(--ink-secondary)' }}
            >
              <span>
                {opt.company} {opt.service} · até {opt.deliveryDays} dias úteis
              </span>
              <span className="tabular font-medium" style={{ color: 'var(--gold-bright)' }}>
                {formatBRL(opt.price)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDimensions(product: CatalogProduct): string {
  const { length_cm, height_cm, width_cm } = product
  if (length_cm != null && height_cm != null && width_cm != null) {
    const fmt = (n: number) => String(n).replace('.', ',')
    return `${fmt(length_cm)} × ${fmt(height_cm)} × ${fmt(width_cm)} cm`
  }
  return product.dimensions ?? 'Em breve'
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
