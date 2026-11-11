import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Maximize2, Play, X } from 'lucide-react'
import { ProductArt } from '@/components/ProductArt'
import { ProductLightbox } from '@/components/ProductLightbox'
import { COVER_TRANSITION_NAME } from '@/lib/coverTransition'
import type { CatalogProduct } from '@/types/catalog'

/** Cycling span pattern for the mosaic tiles that follow the (larger) cover tile. */
const TILE_PATTERNS = ['', 'sm:col-span-2', 'row-span-2', '']

function tileSpan(index: number) {
  if (index === 0) return 'col-span-2 row-span-2'
  return TILE_PATTERNS[(index - 1) % TILE_PATTERNS.length]
}

export function ProductGallery({
  product,
  className = '',
  mobileOverlay,
}: {
  product: CatalogProduct
  className?: string
  /** conteúdo sobreposto à capa no layout mobile (ex: botão de voltar) */
  mobileOverlay?: ReactNode
}) {
  const gallery = [product.image_url, ...product.image_urls].filter((u): u is string => !!u)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  // foto em destaque na capa do layout mobile (escolhida nas miniaturas)
  const [selected, setSelected] = useState(0)
  const [videoOpen, setVideoOpen] = useState(false)

  if (gallery.length === 0) {
    return <ProductArt product={product} className={`aspect-square rounded-2xl ${className}`} />
  }

  return (
    <div className={className}>
      {/* MOBILE — capa grande de ponta a ponta no topo da tela e, embaixo,
          miniaturas todas do mesmo tamanho pra escolher a foto. Tocar na
          capa abre o lightbox (zoom / tela cheia) na foto atual. */}
      <div className="sm:hidden">
        <div
          data-product-cover
          className="relative -mx-6 aspect-[4/3] overflow-hidden"
          style={{ background: 'var(--carbon-2)', viewTransitionName: COVER_TRANSITION_NAME }}
        >
          <AnimatePresence initial={false}>
            <motion.img
              key={gallery[selected]}
              src={gallery[selected]}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>
          <button
            type="button"
            aria-label="Ampliar foto"
            onClick={() => setLightboxIndex(selected)}
            className="absolute inset-0"
          />
          {/* escurece só o topo, onde o cabeçalho do site passa por cima da foto */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}
          />
          <div
            className="pointer-events-none absolute bottom-3 right-3 rounded-full p-1.5"
            style={{ background: 'rgba(6,6,6,0.55)', color: 'var(--ink)' }}
          >
            <Maximize2 size={14} />
          </div>
          {mobileOverlay}
        </div>

        {(gallery.length > 1 || product.video_url) && (
          /* sempre uma linha só: com mais fotos do que cabem, rola de lado
             (vai até a borda da tela pra deixar a próxima miniatura espiando) */
          <div className="no-scrollbar -mx-6 mt-3 flex gap-2 overflow-x-auto px-6">
            {gallery.map((url, i) => (
              <button
                key={url}
                type="button"
                aria-label={`Ver foto ${i + 1} de ${gallery.length}`}
                aria-pressed={i === selected}
                onClick={() => setSelected(i)}
                className="relative aspect-[4/3] w-[21vw] shrink-0 overflow-hidden rounded-lg border transition-opacity"
                style={{
                  borderColor: i === selected ? 'var(--gold)' : 'var(--hairline)',
                  opacity: i === selected ? 1 : 0.6,
                }}
              >
                <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
            {product.video_url && (
              <button
                type="button"
                aria-label="Assistir ao vídeo"
                onClick={() => setVideoOpen(true)}
                className="relative aspect-[4/3] w-[21vw] shrink-0 overflow-hidden rounded-lg border"
                style={{ borderColor: 'var(--hairline)' }}
              >
                <img src={gallery[0]} alt="" className="h-full w-full object-cover opacity-50" loading="lazy" />
                <span className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--ink)' }}>
                  <Play size={18} fill="currentColor" />
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* DESKTOP — mosaico */}
      <div
        className="hidden auto-rows-[170px] grid-cols-3 gap-3 sm:grid"
        style={{ gridAutoFlow: 'dense' }}
      >
        {gallery.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setLightboxIndex(i)}
            data-product-cover={i === 0 ? '' : undefined}
            className={`group/tile relative overflow-hidden rounded-2xl ${tileSpan(i)}`}
            style={i === 0 ? { viewTransitionName: COVER_TRANSITION_NAME } : undefined}
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
