import { useEffect, useRef, useState, type RefObject } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import type { CatalogProduct } from '@/types/catalog'

function RailCard({
  product,
  index,
  rootRef,
}: {
  product: CatalogProduct
  index: number
  rootRef: RefObject<HTMLDivElement | null>
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(index === 0)

  useEffect(() => {
    const root = rootRef.current
    const el = cardRef.current
    if (!root || !el) return
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      root,
      // encolhe a "zona de foco" pro miolo horizontal do trilho — só o card
      // mais centralizado fica ativo, os vizinhos ficam levemente recuados
      rootMargin: '0px -32% 0px -32%',
      threshold: 0.6,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootRef])

  return (
    <div
      ref={cardRef}
      data-rail-card
      className="w-[78vw] shrink-0 snap-center sm:w-[300px]"
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
            <RailCard key={p.id} product={p} index={i} rootRef={scrollerRef} />
          ))}
        </div>
      </div>
    </div>
  )
}
