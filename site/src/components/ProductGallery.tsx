import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Maximize2, Play, X } from 'lucide-react'
import { ProductArt } from '@/components/ProductArt'
import { ProductLightbox } from '@/components/ProductLightbox'
import type { CatalogProduct } from '@/types/catalog'

/** Cycling span pattern for the mosaic tiles that follow the (larger) cover tile. */
const TILE_PATTERNS = ['', 'sm:col-span-2', 'row-span-2', '']

function tileSpan(index: number) {
  if (index === 0) return 'col-span-2 row-span-2'
  return TILE_PATTERNS[(index - 1) % TILE_PATTERNS.length]
}

export function ProductGallery({ product, className = '' }: { product: CatalogProduct; className?: string }) {
  const gallery = [product.image_url, ...product.image_urls].filter((u): u is string => !!u)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [videoOpen, setVideoOpen] = useState(false)

  if (gallery.length === 0) {
    return <ProductArt product={product} className={`aspect-square rounded-2xl ${className}`} />
  }

  return (
    <div className={className}>
      <div
        className="grid grid-cols-2 auto-rows-[140px] gap-3 sm:grid-cols-3 sm:auto-rows-[170px]"
        style={{ gridAutoFlow: 'dense' }}
      >
        {gallery.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className={`group/tile relative overflow-hidden rounded-2xl ${tileSpan(i)}`}
          >
            <img
              src={url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover/tile:scale-105"
              loading="lazy"
            />
            <div
              className="pointer-events-none absolute right-2.5 top-2.5 rounded-full p-1.5 opacity-0 transition-opacity group-hover/tile:opacity-100"
              style={{ background: 'rgba(6,6,6,0.55)', color: 'var(--ink)' }}
            >
              <Maximize2 size={14} />
            </div>
          </button>
        ))}

        {product.video_url && (
          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            className="group/tile relative col-span-2 overflow-hidden rounded-2xl"
          >
            <img src={gallery[0]} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 transition-colors" style={{ background: 'rgba(6,6,6,0.4)' }} />
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform group-hover/tile:scale-110"
              style={{ color: 'var(--ink)' }}
            >
              <div className="rounded-full p-4" style={{ background: 'rgba(6,6,6,0.55)' }}>
                <Play size={24} fill="currentColor" />
              </div>
            </div>
          </button>
        )}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <ProductLightbox
            key="lightbox"
            gallery={gallery}
            index={lightboxIndex}
            onIndexChange={setLightboxIndex}
            onClose={() => setLightboxIndex(null)}
            productName={product.name}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {videoOpen && product.video_url && (
          <motion.div
            key="video-player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-4"
            style={{ background: 'rgba(6,6,6,0.94)' }}
            onClick={() => setVideoOpen(false)}
          >
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setVideoOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-white/5 sm:right-6 sm:top-6"
              style={{ color: 'var(--ink-secondary)' }}
            >
              <X size={26} />
            </button>
            <video
              src={product.video_url}
              controls
              autoPlay
              playsInline
              onClick={(e) => e.stopPropagation()}
              className="max-h-[78vh] max-w-[92vw] rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
