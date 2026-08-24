import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { ProductArt } from '@/components/ProductArt'
import { ProductLightbox } from '@/components/ProductLightbox'
import { labelForGalleryImage } from '@/lib/galleryLabels'
import { useSwipeNav } from '@/lib/useSwipeNav'
import type { CatalogProduct } from '@/types/catalog'

/** Tracks whether a scrollable row has more content past its left/right edges. */
function useEdgeFade(ref: React.RefObject<HTMLDivElement | null>, deps: unknown[]) {
  const [fade, setFade] = useState({ left: false, right: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      setFade({
        left: el.scrollLeft > 4,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      })
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      resizeObserver.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return fade
}

export function ProductGallery({ product, className = '' }: { product: CatalogProduct; className?: string }) {
  const gallery = [product.image_url, ...product.image_urls].filter((u): u is string => !!u)
  const labels = gallery.map((url, i) => labelForGalleryImage(url, i))
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const total = gallery.length
  const goNext = () => setActiveIndex((i) => (i + 1) % total)
  const goPrev = () => setActiveIndex((i) => (i - 1 + total) % total)
  const swipe = useSwipeNav(goNext, goPrev)
  const railRef = useRef<HTMLDivElement>(null)
  const fade = useEdgeFade(railRef, [total])

  if (gallery.length === 0) {
    return <ProductArt product={product} className={className} />
  }

  return (
    <div>
      <div
        role="group"
        aria-label="Galeria de fotos do produto"
        tabIndex={total > 1 && !lightboxOpen ? 0 : -1}
        onKeyDown={(e) => {
          if (lightboxOpen) return
          if (e.key === 'ArrowRight') goNext()
          if (e.key === 'ArrowLeft') goPrev()
        }}
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
        onClick={(e) => {
          ;(e.currentTarget as HTMLElement).blur()
          setLightboxOpen(true)
        }}
        className={`group relative cursor-zoom-in overflow-hidden focus:outline-none ${className}`}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={gallery[activeIndex]}
            src={gallery[activeIndex]}
            alt={`${product.name} — ${labels[activeIndex]}`}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </AnimatePresence>

        <div
          className="pointer-events-none absolute right-3 top-3 rounded-full p-2 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: 'rgba(6,6,6,0.55)', color: 'var(--ink)' }}
        >
          <Maximize2 size={16} />
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-2 opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              style={{ background: 'rgba(6,6,6,0.55)', color: 'var(--ink)' }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              style={{ background: 'rgba(6,6,6,0.55)', color: 'var(--ink)' }}
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="relative mt-4">
          <div
            ref={railRef}
            className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-1"
            style={{ scrollSnapType: 'x proximity' }}
          >
            {gallery.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActiveIndex(i)}
                className="group/thumb flex shrink-0 flex-col items-center gap-1.5"
                style={{ scrollSnapAlign: 'start' }}
              >
                <span
                  className="block h-20 w-28 overflow-hidden rounded-lg border-2 transition-opacity sm:h-24 sm:w-32"
                  style={{
                    borderColor: i === activeIndex ? 'var(--gold)' : 'var(--hairline)',
                    opacity: i === activeIndex ? 1 : 0.6,
                  }}
                >
                  <img
                    src={url}
                    alt={`${product.name} — ${labels[i]}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                    loading="lazy"
                  />
                </span>
                <span
                  className="text-[10px] tracking-widest"
                  style={{ color: i === activeIndex ? 'var(--gold-bright)' : 'var(--ink-muted)' }}
                >
                  {labels[i].toUpperCase()}
                </span>
              </button>
            ))}
          </div>

          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-10 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(to right, var(--carbon-0), transparent)',
              opacity: fade.left ? 1 : 0,
            }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(to left, var(--carbon-0), transparent)',
              opacity: fade.right ? 1 : 0,
            }}
          />
        </div>
      )}

      <AnimatePresence>
        {lightboxOpen && (
          <ProductLightbox
            key="lightbox"
            gallery={gallery}
            labels={labels}
            index={activeIndex}
            onIndexChange={setActiveIndex}
            onClose={() => setLightboxOpen(false)}
            productName={product.name}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
