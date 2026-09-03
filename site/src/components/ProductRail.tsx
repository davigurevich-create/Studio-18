import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Move } from 'lucide-react'
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

// distância mínima de movimento pra um pointerdown virar "arraste" — abaixo
// disso é tratado como clique normal (deixa o navegador abrir o produto);
// só a partir daqui a gente chama setPointerCapture/mexe no scrollLeft.
const DRAG_THRESHOLD = 6

export function ProductRail({ products }: { products: CatalogProduct[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [canScroll, setCanScroll] = useState(false)
  const [interacted, setInteracted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const dragRef = useRef<{ down: boolean; dragging: boolean; pointerId: number; startX: number; startY: number; samples: DragSample[] }>({
    down: false,
    dragging: false,
    pointerId: 0,
    startX: 0,
    startY: 0,
    samples: [],
  })
  const momentumRaf = useRef(0)
  const settleTimer = useRef(0)
  const suppressClickRef = useRef(false)
  // índice "alvo" da navegação por seta/teclado — separado do activeIndex
  // (que só é atualizado de forma assíncrona pelo scroll-spy) pra cliques
  // em sequência rápida sempre avançarem a partir de onde a última
  // navegação pediu pra ir, e não do que já tinha renderizado na tela
  const pendingIndexRef = useRef(0)

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

    // índice "ativo" pra uma posição de scroll dada — nas pontas o centro
    // geométrico do container não coincide com o centro do card extremo
    // (o container é mais largo que um card só), então closestIndex por si
    // só erraria a ponta pro vizinho; por isso as pontas são tratadas à parte
    const resolveIndex = (cards: NodeListOf<HTMLElement>, scrollLeft: number) => {
      if (cards.length === 0) return 0
      if (scrollLeft <= 2) return 0
      if (scrollLeft + el.clientWidth >= el.scrollWidth - 2) return cards.length - 1
      return closestIndex(cards)
    }

    const updateActive = () => {
      raf = 0
      const scrollable = el.scrollWidth > el.clientWidth + 1
      setCanScroll(scrollable)
      const cards = el.querySelectorAll<HTMLElement>('[data-rail-card]')
      setActiveIndex(scrollable ? resolveIndex(cards, el.scrollLeft) : 0)
    }

    // ajuste fino: só roda depois que a rolagem (touch, wheel, drag ou o
    // momentum do mouse) já ficou parada por um instante
    const settle = () => {
      if (dragRef.current.dragging) return
      const cards = el.querySelectorAll<HTMLElement>('[data-rail-card]')
      if (cards.length === 0) return
      const index = resolveIndex(cards, el.scrollLeft)
      // só agora (com a rolagem já parada de vez) é seguro sincronizar o
      // índice-alvo da navegação por seta — fazer isso a cada evento de
      // scroll sobrescreveria o alvo com posições intermediárias da própria
      // animação disparada pela seta, quebrando cliques em sequência rápida
      pendingIndexRef.current = index
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
  // então esse handler só entra em ação pra ponteiro tipo "mouse". Só vira
  // "arraste" de verdade depois que o ponteiro anda mais que DRAG_THRESHOLD
  // — um clique normal (sem mover o mouse) nunca chama setPointerCapture
  // nem mexe no scroll, e por isso não atrapalha o link do card abrir o
  // produto (era o bug: capturar o ponteiro em TODO clique, mesmo sem
  // arrastar, fazia o navegador não disparar o "click" no link).
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return
    cancelAnimationFrame(momentumRaf.current)
    dragRef.current = {
      down: true,
      dragging: false,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      samples: [{ t: performance.now(), x: e.clientX }],
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const el = scrollerRef.current
    const drag = dragRef.current
    if (!el || !drag.down) return

    if (!drag.dragging) {
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (Math.abs(dx) < DRAG_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return
      drag.dragging = true
      el.setPointerCapture(drag.pointerId)
      setIsDragging(true)
      markInteracted()
    }

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
    if (!el || !drag.down) return
    drag.down = false
    if (!drag.dragging) return // foi só um clique — deixa o link do card abrir normalmente

    drag.dragging = false
    setIsDragging(false)
    suppressClickRef.current = true
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

  // depois de um arraste de verdade, o navegador ainda dispara um "click"
  // no elemento solto por baixo do cursor — sem isso, arrastar um card
  // acabaria abrindo a página do produto por engano
  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressClickRef.current = false
    }
  }

  // navegação por seta/teclado — mesma lógica de centralização usada pelo
  // ajuste fino automático (settle), só que disparada por clique/tecla
  const scrollToIndex = (index: number) => {
    const el = scrollerRef.current
    if (!el) return
    const cards = el.querySelectorAll<HTMLElement>('[data-rail-card]')
    const clamped = Math.max(0, Math.min(index, cards.length - 1))
    pendingIndexRef.current = clamped
    const card = cards[clamped]
    if (!card) return
    const target = card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2
    const left = Math.max(0, Math.min(target, el.scrollWidth - el.clientWidth))
    el.scrollTo({ left, behavior: 'smooth' })
    markInteracted()
  }

  const goToPrev = () => scrollToIndex(pendingIndexRef.current - 1)
  const goToNext = () => scrollToIndex(pendingIndexRef.current + 1)

  // seta do teclado com o trilho focado navega card a card — sem isso, o
  // navegador rola o container por um valor fixo de pixels (foco nativo em
  // região rolável), o que parece um arraste solto em vez de um passo certeiro
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goToPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      goToNext()
    }
  }

  return (
    <div className="relative">
      {canScroll && (
        <div className="mb-3 flex justify-end gap-2">
          <button
            type="button"
            aria-label="Modelo anterior"
            onClick={goToPrev}
            disabled={activeIndex === 0}
            className="glass-pill flex h-9 w-9 items-center justify-center disabled:opacity-30"
          >
            <ChevronLeft size={16} strokeWidth={2.5} className="relative z-10" style={{ color: 'var(--ink-secondary)' }} />
          </button>
          <button
            type="button"
            aria-label="Próximo modelo"
            onClick={goToNext}
            disabled={activeIndex === products.length - 1}
            className="glass-pill flex h-9 w-9 items-center justify-center disabled:opacity-30"
          >
            <ChevronRight size={16} strokeWidth={2.5} className="relative z-10" style={{ color: 'var(--ink-secondary)' }} />
          </button>
        </div>
      )}

      <div className="relative -mx-6 px-6 sm:mx-0 sm:px-0">
        {/* esmaecimento nas bordas — só aparece do lado em que realmente
            existe um card espiando (senão cobre uma fatia do próprio card
            ativo quando ele está encostado numa ponta) */}
        {canScroll && activeIndex > 0 && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:left-0 sm:w-16"
            style={{ background: 'linear-gradient(to right, var(--carbon-0), transparent)' }}
          />
        )}
        {canScroll && activeIndex < products.length - 1 && (
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
          onClickCapture={onClickCapture}
          onWheel={markInteracted}
          onDragStart={(e) => e.preventDefault()}
          onKeyDown={onKeyDown}
          tabIndex={canScroll ? 0 : -1}
          className={`no-scrollbar flex gap-5 overflow-x-auto pb-3 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold-dim)] ${
            isDragging ? 'cursor-grabbing select-none' : 'sm:cursor-grab'
          }`}
        >
          {products.map((p, i) => (
            <RailCard key={p.id} product={p} index={i} active={!canScroll || i === activeIndex} />
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
