import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useSwipeNav } from '@/lib/useSwipeNav'

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
  const goPrev = () => onIndexChange((index - 1 + total) % total)
  const goNext = () => onIndexChange((index + 1) % total)
  const swipe = useSwipeNav(goNext, goPrev)

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
        className="flex max-h-[78vh] max-w-[92vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={gallery[index]}
            src={gallery[index]}
            alt={productName}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="max-h-[78vh] max-w-[92vw] rounded-lg object-contain"
          />
        </AnimatePresence>
      </div>
    </motion.div>,
    document.body,
  )
}
