import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import type { CatalogProduct } from '@/types/catalog'

function RailCard({ product, index, active }: { product: CatalogProduct; index: number; active: boolean }) {
  return (
    <div
      data-rail-card
      className="w-[74vw] shrink-0 snap-start sm:w-[320px]"
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

export function ProductRail({ products }: { products: CatalogProduct[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [canScroll, setCanScroll] = useState(false)
  const [sweepDone, setSweepDone] = useState(false)

  // cards alinham (snap-start) pela borda esquerda, então o card "ativo" é
  // simplesmente o que está com a borda esquerda mais próxima do scrollLeft
  // atual — ao contrário de "mais próximo do centro do container", isso
  // funciona igual não importa quantos cards cabem na tela ao mesmo tempo
  // (era o bug: num trilho largo no desktop, com vários cards visíveis, o
  // centro do CONTAINER fica longe do centro de qualquer card individual
  // perto das pontas, fazendo o cálculo "pular" pro card errado)
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

      let closestIndex = 0
      let closestDistance = Infinity
      cards.forEach((card, i) => {
        const distance = Math.abs(card.offsetLeft - el.scrollLeft)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = i
        }
      })
      setActiveIndex(closestIndex)
    }

    const onScroll = () => {
      setSweepDone(true)
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
    <div className="group/rail relative">
      <div className="relative -mx-6 px-6 sm:mx-0 sm:px-0">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:left-0 sm:w-16"
          style={{ background: 'linear-gradient(to right, var(--carbon-0), transparent)' }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:right-0 sm:w-16"
          style={{ background: 'linear-gradient(to left, var(--carbon-0), transparent)' }}
        />

        {/* sweep de luz — roda uma vez quando o trilho entra na tela,
            indicando que dá pra rolar de lado; some assim que o usuário
            realmente rolar */}
        {canScroll && !sweepDone && (
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
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3"
        >
          {products.map((p, i) => (
            <RailCard key={p.id} product={p} index={i} active={i === activeIndex} />
          ))}
        </div>

        {canScroll && (
          <>
            <button
              type="button"
              aria-label="Rolar para a esquerda"
              onClick={() => scrollByCards(-1)}
              className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover/rail:opacity-100 sm:flex"
              style={{ background: 'rgba(6,6,6,0.65)', borderColor: 'var(--hairline)', color: 'var(--ink-secondary)' }}
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Rolar para a direita"
              onClick={() => scrollByCards(1)}
              className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover/rail:opacity-100 sm:flex"
              style={{ background: 'rgba(6,6,6,0.65)', borderColor: 'var(--hairline)', color: 'var(--ink-secondary)' }}
            >
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          </>
        )}
      </div>

      {/* indicador de posição — só no mobile, reforça que dá pra rolar de lado */}
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
