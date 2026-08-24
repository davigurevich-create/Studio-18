import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Maximize2 } from 'lucide-react'
import { ProductArt } from '@/components/ProductArt'
import { ProductLightbox } from '@/components/ProductLightbox'
import { labelForGalleryImage } from '@/lib/galleryLabels'
import { useSwipeNav } from '@/lib/useSwipeNav'
import type { CatalogProduct } from '@/types/catalog'

export function ProductGallery({ product, className = '' }: { product: CatalogProduct; className?: string }) {
  const gallery = [product.image_url, ...product.image_urls].filter((u): u is string => !!u)
  const labels = gallery.map((url, i) => labelForGalleryImage(url, i))
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const total = gallery.length
  const goNext = () => setActiveIndex((i) => (i + 1) % total)
  const goPrev = () => setActiveIndex((i) => (i - 1 + total) % total)
  const swipe = useSwipeNav(goNext, goPrev)

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
          <div
            className="pointer-events-none absolute bottom-3 left-3 rounded-full px-3 py-1 text-[11px] tracking-widest"
            style={{ background: 'rgba(6,6,6,0.55)', color: 'var(--gold-bright)', border: '1px solid var(--hairline-strong)' }}
          >
            {activeIndex + 1} / {total} — {labels[activeIndex].toUpperCase()}
          </div>
        )}
      </div>

      {total > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {gallery.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="group/thumb flex shrink-0 flex-col items-center gap-1.5"
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
