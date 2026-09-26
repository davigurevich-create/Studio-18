import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const SWIPE_MIN_OFFSET = 60
const SWIPE_VELOCITY_WEIGHT = 0.35

const imageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '30%' : '-30%',
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

  const goPrev = () => {
    setDirection(-1)
    onIndexChange((index - 1 + total) % total)
  }
  const goNext = () => {
    setDirection(1)
    onIndexChange((index + 1) % total)
  }

  const onDragEnd = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (total <= 1) return
    // distância OU velocidade do gesto decide a navegação — um flick curto e rápido
    // navega tanto quanto um arrasto longo e lento (momentum, não só posição final).
    const passedDistance = Math.abs(info.offset.x) > SWIPE_MIN_OFFSET
    const passedVelocity = Math.abs(info.velocity.x) > SWIPE_MIN_OFFSET / SWIPE_VELOCITY_WEIGHT
    if (!passedDistance && !passedVelocity) return
    if (info.offset.x < 0 || info.velocity.x < -100) goNext()
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
        className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-white/5 sm:right-6 sm:top-6"
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
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 transition-colors hover:bg-white/5 sm:left-6"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 transition-colors hover:bg-white/5 sm:right-6"
            style={{ color: 'var(--ink-secondary)' }}
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      <div
        className="relative flex max-h-[78vh] max-w-[92vw] items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.img
            key={gallery[index]}
            src={gallery[index]}
            alt={productName}
            custom={direction}
            variants={imageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', damping: 1, stiffness: 380 }}
            drag={total > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.65}
            dragTransition={{ power: 0.15, timeConstant: 200 }}
            onDragEnd={onDragEnd}
            className="max-h-[78vh] max-w-[92vw] touch-pan-y rounded-lg object-contain"
          />
        </AnimatePresence>
      </div>
    </motion.div>,
    document.body,
  )
}
