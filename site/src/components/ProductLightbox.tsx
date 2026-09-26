import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const SWIPE_MIN_OFFSET = 60
const SWIPE_MIN_VELOCITY = 0.35 // px/ms

const imageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '30%' : direction < 0 ? '-30%' : 0,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? '-30%' : '30%',
    opacity: 0,
  }),
}

export function ProductLightbox({
  gallery,
  index,
  onIndexChange,
  onClose,
  productName,
}: {
  gallery: string[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  productName: string
}) {
  const total = gallery.length
  const [direction, setDirection] = useState(0)
  // Rastreado à parte do framer-motion: manter fora do drag do motion.img
  // evita o conflito conhecido entre `drag` e `animate`/`exit` no mesmo
  // eixo, que travava a foto antiga sobreposta na nova.
  const pointer = useRef<{ x: number; t: number } | null>(null)

  const goPrev = () => {
    setDirection(-1)
    onIndexChange((index - 1 + total) % total)
  }
  const goNext = () => {
    setDirection(1)
    onIndexChange((index + 1) % total)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (total <= 1) return
    pointer.current = { x: e.clientX, t: e.timeStamp }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!pointer.current) return
    const dx = e.clientX - pointer.current.x
    const dt = Math.max(1, e.timeStamp - pointer.current.t)
    pointer.current = null
    const velocity = dx / dt
    // distância OU velocidade do gesto decide a navegação — um flick curto
    // e rápido navega tanto quanto um arrasto longo e lento (momentum, não
    // só posição final do dedo).
    const passedDistance = Math.abs(dx) > SWIPE_MIN_OFFSET
    const passedVelocity = Math.abs(velocity) > SWIPE_MIN_VELOCITY
    if (!passedDistance && !passedVelocity) return
    if (dx < 0) goNext()
    else goPrev()
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, total])

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center px-4"
      style={{ background: 'rgba(6,6,6,0.94)' }}
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full p-2 transition-colors hover:bg-white/5 sm:right-6 sm:top-6"
        style={{ color: 'var(--ink-secondary)' }}
      >
        <X size={26} />
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 transition-colors hover:bg-white/5 sm:left-6"
            style={{ color: 'var(--ink-secondary)' }}
          >
            <ChevronLeft size={32} />
          </button>
          <button
            type="button"
            aria-label="Próxima foto"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 transition-colors hover:bg-white/5 sm:right-6"
            style={{ color: 'var(--ink-secondary)' }}
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      <div
        className="relative h-[78vh] w-[92vw] touch-pan-y"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pointer.current = null
        }}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={gallery[index]}
            src={gallery[index]}
            alt={productName}
            custom={direction}
            variants={imageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            // absolute + inset-0 + m-auto: as duas fotos (a que sai e a que
            // entra) ficam empilhadas exatamente na mesma caixa durante a
            // troca — sem isso elas ficavam lado a lado, parcialmente
            // sobrepostas, criando um efeito de "dupla exposição".
            className="absolute inset-0 m-auto max-h-full max-w-full rounded-lg object-contain"
          />
        </AnimatePresence>
      </div>
    </motion.div>,
    document.body,
  )
}
