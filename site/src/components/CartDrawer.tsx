import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Cog } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { getCatalog } from '@/lib/api'
import { formatBRL } from '@/lib/format'
import { unitPriceWithMotor } from '@/lib/pricing'
import type { CatalogProduct } from '@/types/catalog'

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, setQuantity, removeItem, setMotor } = useCart()
  const [catalog, setCatalog] = useState<CatalogProduct[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (open) getCatalog().then(setCatalog)
  }, [open])

  const items = lines
    .map((l) => ({ line: l, product: catalog.find((p) => p.id === l.productId) }))
    .filter((i) => i.product)

  const total = items.reduce(
    (t, i) => t + unitPriceWithMotor(i.product!, Boolean(i.line.withMotor)) * i.line.quantity,
    0,
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(6,6,6,0.55)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l"
            style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}
          >
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--hairline)' }}>
              <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                Seu carrinho
              </div>
              <button type="button" onClick={onClose} aria-label="Fechar carrinho" style={{ color: 'var(--ink-muted)' }}>
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                  Seu carrinho está vazio.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {items.map(({ line, product }) => {
                    const hasMotorOption = Boolean(product!.motor_product_id && product!.motor_price_brl)
                    // Motor "disponível" aqui já precisa levar em conta a
                    // quantidade da linha, não só se existe pelo menos 1 em
                    // estoque — senão dava pra marcar o motor com 1 unidade
                    // no carrinho e depois ir incrementando a quantidade à
                    // vontade sem o motor acompanhar (foi exatamente assim
                    // que uma venda saiu com motor sem estoque suficiente).
                    const motorStock = product!.motor_quantity_available ?? 0
                    // Só bloqueia LIGAR o motor se não cobrir a quantidade já
                    // escolhida — desligar precisa continuar sempre possível,
                    // mesmo que a linha tenha ficado num estado inconsistente
                    // (ex: quantidade subiu depois que o motor foi marcado).
                    const canEnableMotor = motorStock >= line.quantity
                    const motorCoversQuantity = !line.withMotor || motorStock >= line.quantity
                    const stock = product!.quantity_available ?? Infinity
                    const atStockLimit = line.quantity >= stock
                    const canIncrement = atStockLimit ? false : !line.withMotor || line.quantity + 1 <= motorStock
                    return (
                    <div key={line.productId} className="flex gap-3">
                      <div
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-lg"
                        style={{ background: 'var(--carbon-2)' }}
                      >
                        {product!.image_url && (
                          <img src={product!.image_url} alt={product!.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                          {product!.name}
                        </div>
                        <div className="mt-0.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
                          {formatBRL(unitPriceWithMotor(product!, Boolean(line.withMotor)))}
                        </div>
                        {hasMotorOption && (
                          <button
                            type="button"
                            onClick={() => {
                              if (line.withMotor) setMotor(line.productId, false)
                              else if (canEnableMotor) setMotor(line.productId, true)
                            }}
                            disabled={!line.withMotor && !canEnableMotor}
                            className="mt-1.5 flex items-center gap-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ color: line.withMotor ? 'var(--gold-bright)' : 'var(--ink-muted)' }}
                          >
                            <Cog size={11} strokeWidth={2} />
                            {line.withMotor ? 'Com motor funcional' : canEnableMotor ? `+ motor funcional (+${formatBRL(product!.motor_price_brl!)})` : 'Motor indisponível'}
                          </button>
                        )}
                        {!motorCoversQuantity && (
                          <p className="mt-1 text-[10px]" style={{ color: '#e2a33f' }}>
                            Só há motor funcional pra {motorStock} {motorStock === 1 ? 'unidade' : 'unidades'} — reduza a
                            quantidade ou tire o motor.
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuantity(line.productId, line.quantity - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border text-xs"
                            style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
                          >
                            −
                          </button>
                          <span className="tabular text-sm" style={{ color: 'var(--ink)' }}>
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => canIncrement && setQuantity(line.productId, line.quantity + 1)}
                            disabled={!canIncrement}
                            className="flex h-6 w-6 items-center justify-center rounded-full border text-xs disabled:cursor-not-allowed disabled:opacity-40"
                            style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(line.productId)}
                            className="ml-2 text-xs"
                            style={{ color: 'var(--ink-muted)' }}
                          >
                            remover
                          </button>
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t px-5 py-4" style={{ borderColor: 'var(--hairline)' }}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--ink-muted)' }}>Total</span>
                  <span className="tabular text-lg font-semibold" style={{ color: 'var(--gold-bright)' }}>
                    {formatBRL(total)}
                  </span>
                </div>
                <p className="mb-4 text-[11px]" style={{ color: 'var(--gold-bright)' }}>
                  Pague à vista no PIX e ganhe 5% de desconto no checkout.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate('/checkout')
                  }}
                  className="w-full rounded-full px-6 py-3 text-sm font-medium"
                  style={{ background: 'var(--gold)', color: '#0a0a0a' }}
                >
                  Finalizar compra
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
