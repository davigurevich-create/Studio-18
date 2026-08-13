import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { ProductArt } from '@/components/ProductArt'
import { RestockWaitlistForm } from '@/components/RestockWaitlistForm'
import { getProduct } from '@/lib/api'
import { formatBRL } from '@/lib/format'
import { installmentPrice, LOW_STOCK_THRESHOLD, MAX_INSTALLMENTS, pixPrice } from '@/lib/pricing'
import { useCart } from '@/lib/cart'
import { useAuth } from '@/lib/auth'
import { useFavorites } from '@/lib/favorites'
import type { CatalogProduct } from '@/types/catalog'

export function Product() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { session } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [product, setProduct] = useState<CatalogProduct | null | undefined>(undefined)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

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
          {product.video_url && (
            <video
              key={product.video_url}
              src={product.video_url}
              controls
              playsInline
              className="mt-4 aspect-video w-full rounded-2xl"
              style={{ background: 'var(--carbon-2)' }}
            />
          )}
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

            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                  À VISTA NO PIX
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="tabular text-3xl font-semibold" style={{ color: 'var(--gold-bright)' }}>
                    {formatBRL(pixPrice(product.sale_price_brl))}
                  </span>
                  <span className="tabular text-sm line-through" style={{ color: 'var(--ink-muted)' }}>
                    {formatBRL(product.sale_price_brl)}
                  </span>
                </div>
                <div className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
                  ou {MAX_INSTALLMENTS}x de {formatBRL(installmentPrice(product.sale_price_brl))} no cartão, ou boleto
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
                    addItem(product.id, quantity, product.name)
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
                    addItem(product.id, quantity)
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
          </div>
        </motion.div>
      </div>
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
