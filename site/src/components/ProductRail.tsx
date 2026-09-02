import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Move } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import type { CatalogProduct } from '@/types/catalog'

function RailCard({ product, index, active }: { product: CatalogProduct; index: number; active: boolean }) {
  return (
    <div
      data-rail-card
      className="w-[74vw] shrink-0 sm:w-[480px]"
      style={{
        transform: active ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(6px)',
        opacity: active ? 1 : 0.68,
        filter: active ? 'none' : 'saturate(0.75)',
        transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.45s ease, filter 0.45s ease',
      }}
    >
      <ProductCard product={product} index={index} />
    </div>
  )
}

// amostras recentes de (tempo, x) usadas só pra estimar a velocidade do
// "flick" no momento em que o mouse é solto — uma janela curta (não só o
// último movimento) deixa a estimativa mais estável
type DragSample = { t: number; x: number }

// tempo sem nenhum evento de scroll pra considerar que o trilho "parou" —
// só então fazemos o ajuste fino (snap) pro card mais próximo. Sem isso
// (ou usando scroll-snap-type do CSS), o navegador tenta corrigir a
// posição a cada pixel rolado, brigando com o momentum e fazendo tudo
// parecer travado logo no primeiro cliquezinho de rolagem.
const SETTLE_DELAY = 120

export function ProductRail({ products }: { products: CatalogProduct[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [canScroll, setCanScroll] = useState(false)
  const [interacted, setInteracted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const dragRef = useRef<{ active: boolean; samples: DragSample[] }>({ active: false, samples: [] })
  const momentumRaf = useRef(0)
  const settleTimer = useRef(0)

  const markInteracted = () => setInteracted(true)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    let raf = 0
    const getTargetLeft = (index: number, cards: NodeListOf<HTMLElement>) => {
      const card = cards[index]
      if (!card) return 0
      const target = card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2
      return Math.max(0, Math.min(target, el.scrollWidth - el.clientWidth))
    }

    // card "ativo" = o mais próximo do centro do trilho — com um card
    // grande e só uma pontinha do vizinho de cada lado, o centro do
    // container corresponde de fato ao card centralizado no momento
    const closestIndex = (cards: NodeListOf<HTMLElement>) => {
      const containerCenter = el.scrollLeft + el.clientWidth / 2
      let closest = 0
      let closestDistance = Infinity
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2
        const distance = Math.abs(cardCenter - containerCenter)
        if (distance < closestDistance) {
          closestDistance = distance
          closest = i
        }
      })
      return closest
    }

    const updateActive = () => {
      raf = 0
      const scrollable = el.scrollWidth > el.clientWidth + 1
      setCanScroll(scrollable)

      const cards = el.querySelectorAll<HTMLElement>('[data-rail-card]')
      if (!scrollable || el.scrollLeft <= 2) {
        setActiveIndex(0)
        return
      }
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
        setActiveIndex(cards.length - 1)
        return
      }
      setActiveIndex(closestIndex(cards))
    }

    // ajuste fino: só roda depois que a rolagem (touch, wheel, drag ou o
    // momentum do mouse) já ficou parada por um instante
    const settle = () => {
      if (dragRef.current.active) return
      const cards = el.querySelectorAll<HTMLElement>('[data-rail-card]')
      if (cards.length === 0) return
      const index = closestIndex(cards)
      el.scrollTo({ left: getTargetLeft(index, cards), behavior: 'smooth' })
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(updateActive)
      window.clearTimeout(settleTimer.current)
      settleTimer.current = window.setTimeout(settle, SETTLE_DELAY)
    }

    updateActive()
    el.addEventListener('scroll', onScroll, { passive: true })
    const resizeObserver = new ResizeObserver(updateActive)
    resizeObserver.observe(el)
    return () => {
      el.removeEventListener('scroll', onScroll)
      resizeObserver.disconnect()
      if (raf) cancelAnimationFrame(raf)
      window.clearTimeout(settleTimer.current)
    }
  }, [products.length])

  useEffect(() => () => cancelAnimationFrame(momentumRaf.current), [])

  // arrastar com o mouse (clique e segure) pra rolar livremente, com
  // inércia ao soltar — o touch já rola com momentum nativo do navegador,
  // então esse handler só entra em ação pra ponteiro tipo "mouse"
  const onPointerDown = (e: React.PointerEvent) => {
    markInteracted()
    if (e.pointerType === 'touch') return
    const el = scrollerRef.current
    if (!el) return
    cancelAnimationFrame(momentumRaf.current)
    el.setPointerCapture(e.pointerId)
    dragRef.current = { active: true, samples: [{ t: performance.now(), x: e.clientX }] }
    setIsDragging(true)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const el = scrollerRef.current
    const drag = dragRef.current
    if (!el || !drag.active) return
    const samples = drag.samples
    const last = samples[samples.length - 1]
    el.scrollLeft -= e.clientX - last.x
    const now = performance.now()
    samples.push({ t: now, x: e.clientX })
    // guarda só os últimos ~120ms de histórico — o suficiente pra medir o "flick"
    while (samples.length > 2 && now - samples[0].t > 120) samples.shift()
  }

  const endDrag = (e: React.PointerEvent) => {
    const el = scrollerRef.current
    const drag = dragRef.current
    if (!el || !drag.active) return
    drag.active = false
    setIsDragging(false)
    try {
      el.releasePointerCapture(e.pointerId)
    } catch {
      // ignora — o ponteiro pode já ter perdido a captura (ex: saiu pela borda)
    }

    const samples = drag.samples
    const first = samples[0]
    const last = samples[samples.length - 1]
    const dt = last.t - first.t
    // px/ms de velocidade no instante em que soltou, a partir da janela recente
    let velocity = dt > 0 ? ((last.x - first.x) / dt) * 16 : 0 // aproxima pra px por frame (~16ms)

    const friction = 0.955
    const step = () => {
      if (Math.abs(velocity) < 0.3) {
        momentumRaf.current = 0
        return
      }
      el.scrollLeft -= velocity
      velocity *= friction
      momentumRaf.current = requestAnimationFrame(step)
    }
    cancelAnimationFrame(momentumRaf.current)
    momentumRaf.current = requestAnimationFrame(step)
  }

  return (
    <div className="relative">
      <div className="relative -mx-6 px-6 sm:mx-0 sm:px-0">
        {/* esmaecimento nas bordas — só aparece do lado em que realmente
            existe um card espiando (senão cobre uma fatia do próprio card
            ativo quando ele está encostado numa ponta) */}
        {activeIndex > 0 && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:left-0 sm:w-16"
            style={{ background: 'linear-gradient(to right, var(--carbon-0), transparent)' }}
          />
        )}
        {activeIndex < products.length - 1 && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:right-0 sm:w-16"
            style={{ background: 'linear-gradient(to left, var(--carbon-0), transparent)' }}
          />
        )}

        {/* sweep de luz no mobile — roda uma vez quando o trilho entra na
            tela, indicando que dá pra rolar de lado */}
        {canScroll && !interacted && (
          <motion.div
            className="pointer-events-none absolute inset-y-0 -left-1/3 z-10 w-1/3 sm:hidden"
            style={{ background: 'linear-gradient(75deg, transparent, rgba(230,199,120,0.22), transparent)' }}
            initial={{ x: '-40%' }}
            whileInView={{ x: '340%' }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.3 }}
          />
        )}

        <div
          ref={scrollerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={markInteracted}
          onDragStart={(e) => e.preventDefault()}
          className={`no-scrollbar flex gap-5 overflow-x-auto pb-3 ${
            isDragging ? 'cursor-grabbing select-none' : 'sm:cursor-grab'
          }`}
        >
          {products.map((p, i) => (
            <RailCard key={p.id} product={p} index={i} active={i === activeIndex} />
          ))}
        </div>
      </div>

      {/* indicador de posição — reforça quantos modelos tem e que dá pra
          rolar de lado, tanto no mobile quanto no desktop */}
      {canScroll && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="flex gap-1.5">
            {products.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === activeIndex ? 16 : 6,
                  background: i === activeIndex ? 'var(--gold-bright)' : 'var(--hairline-strong)',
                }}
              />
            ))}
          </div>

          {/* dica discreta de arrastar — só no desktop (mouse), some assim
              que o usuário interage uma vez */}
          {!interacted && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hidden items-center gap-1.5 text-[11px] tracking-wide sm:flex"
              style={{ color: 'var(--ink-muted)' }}
            >
              <Move size={12} strokeWidth={2} />
              Arraste para explorar
            </motion.span>
          )}
        </div>
      )}
    </div>
  )
}
