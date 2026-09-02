import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import type { CatalogProduct } from '@/types/catalog'

function RailCard({ product, index, active }: { product: CatalogProduct; index: number; active: boolean }) {
  return (
    <div
      data-rail-card
      className="w-[68vw] shrink-0 snap-center sm:w-[300px]"
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

export function CollectionRail({ title, products }: { title: string; products: CatalogProduct[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [canScroll, setCanScroll] = useState(false)

  // determina o card "ativo" pela distância real do centro de cada card ao
  // centro visível do trilho — muito mais confiável do que IntersectionObserver
  // com rootMargin percentual, que quebra em trilhos com 1-2 cards (a zona
  // "central" artificial pode nunca coincidir com nenhum card real).
  // Nas pontas (início/fim do scroll, incluindo trilhos que nem chegam a
  // precisar rolar) força o primeiro/último card — perto do centro do
  // CONTAINER (em vez do centro do conteúdo) o cálculo por distância pode
  // escolher o card errado quando sobra muito espaço vazio à direita.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    let raf = 0
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

      const containerCenter = el.scrollLeft + el.clientWidth / 2
      let closestIndex = 0
      let closestDistance = Infinity
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2
        const distance = Math.abs(cardCenter - containerCenter)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = i
        }
      })
      setActiveIndex(closestIndex)
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(updateActive)
    }

    updateActive()
    el.addEventListener('scroll', onScroll, { passive: true })
    const resizeObserver = new ResizeObserver(updateActive)
    resizeObserver.observe(el)
    return () => {
      el.removeEventListener('scroll', onScroll)
      resizeObserver.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [products.length])

  const scrollByCards = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-rail-card]')
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-[0.22em]" style={{ color: 'var(--ink-secondary)' }}>
          {title.toUpperCase()}
        </h3>
        {canScroll && (
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              aria-label="Rolar para a esquerda"
              onClick={() => scrollByCards(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
              style={{ borderColor: 'var(--hairline)', color: 'var(--ink-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold-dim)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--hairline)')}
            >
              <ChevronLeft size={14} strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Rolar para a direita"
              onClick={() => scrollByCards(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
              style={{ borderColor: 'var(--hairline)', color: 'var(--ink-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold-dim)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--hairline)')}
            >
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      <div className="relative -mx-6 px-6 sm:mx-0 sm:px-0">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:left-0 sm:w-16"
          style={{ background: 'linear-gradient(to right, var(--carbon-0), transparent)' }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:right-0 sm:w-16"
          style={{ background: 'linear-gradient(to left, var(--carbon-0), transparent)' }}
        />

        <div
          ref={scrollerRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3"
          style={{ scrollPaddingLeft: 24, scrollPaddingRight: 24 }}
        >
          {products.map((p, i) => (
            <RailCard key={p.id} product={p} index={i} active={i === activeIndex} />
          ))}
        </div>
      </div>

      {/* indicador de posição / affordance de "tem mais pra rolar" — só no mobile,
          onde a espiadinha do próximo card é sutil demais pra ser óbvia sozinha */}
      {canScroll && (
        <div className="mt-3 flex justify-center gap-1.5 sm:hidden">
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
      )}
    </div>
  )
}
