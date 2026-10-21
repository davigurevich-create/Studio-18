import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getDeliveredStates, type DeliveredState } from '@/lib/api'
import { BRAZIL_MAP_HEIGHT, BRAZIL_MAP_WIDTH, STATE_PATHS } from '@/lib/brazilStatePaths'

export function BrazilDeliveryMap() {
  const [delivered, setDelivered] = useState<Map<string, string[]>>(new Map())
  const [loaded, setLoaded] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getDeliveredStates()
      .then((states: DeliveredState[]) => {
        setDelivered(new Map(states.map((s) => [s.federalUnit.toUpperCase(), s.cities])))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (loaded && delivered.size === 0) return null

  const handleMove = (uf: string) => (e: React.MouseEvent) => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const rect = wrapper.getBoundingClientRect()
    setHovered(uf)
    setCardPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  // No touch (mobile) não existe hover — o toque vira "clique", que mostra
  // o mesmo card; tocar fora de um estado (no wrapper) fecha de novo.
  const handleTap = (uf: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    handleMove(uf)(e)
  }

  return (
    <section className="px-6 py-20 sm:py-24" style={{ background: '#000' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-3xl text-center"
      >
        <p className="eyebrow mb-2">Pronta entrega, de verdade</p>
        <h2 className="mb-10 text-2xl font-medium sm:text-3xl">
          Contribuindo com coleções em{' '}
          <span style={{ color: 'var(--gold-bright)' }}>{delivered.size} estado{delivered.size === 1 ? '' : 's'}</span>{' '}
          do Brasil
        </h2>

        <div
          ref={wrapperRef}
          className="relative mx-auto"
          style={{ maxWidth: 360 }}
          onClick={() => setHovered(null)}
        >
          {/* Halo dourado ambiente atrás do mapa */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(230,199,120,0.16), transparent 72%)',
              filter: 'blur(4px)',
            }}
          />

          <svg
            viewBox={`0 0 ${BRAZIL_MAP_WIDTH} ${BRAZIL_MAP_HEIGHT}`}
            className="relative w-full"
            role="img"
            aria-label="Mapa do Brasil com os estados já atendidos em destaque"
          >
            <defs>
              <filter id="stateGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#e6c778" floodOpacity="0.85" />
              </filter>
            </defs>
            {Object.entries(STATE_PATHS).map(([uf, { d }]) => {
              const isDelivered = delivered.has(uf)
              const isHovered = hovered === uf
              return (
                <path
                  key={uf}
                  d={d}
                  onMouseMove={isDelivered ? handleMove(uf) : undefined}
                  onMouseLeave={() => isDelivered && setHovered((h) => (h === uf ? null : h))}
                  onClick={isDelivered ? handleTap(uf) : undefined}
                  style={{
                    transformOrigin: 'center',
                    transformBox: 'fill-box',
                    transform: isHovered ? 'scale(1.015)' : 'scale(1)',
                    transition: 'transform 0.25s ease-out, filter 0.25s ease-out',
                    fill: isDelivered ? 'var(--gold-bright)' : 'var(--carbon-3)',
                    stroke: isDelivered ? 'var(--carbon-0)' : 'var(--hairline-strong)',
                    strokeWidth: 1.2,
                    filter: isDelivered && isHovered ? 'url(#stateGlow)' : 'none',
                    cursor: isDelivered ? 'pointer' : 'default',
                  }}
                />
              )
            })}
          </svg>

          <AnimatePresence>
            {hovered && cardPos && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="pointer-events-none absolute z-10 w-max max-w-[220px] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-xl px-4 py-3 text-left"
                style={{
                  left: cardPos.x,
                  top: cardPos.y,
                  // Mesmo glassmorphism do header flutuante (Layout.tsx) —
                  // fundo translúcido + blur + saturate, com inset highlight
                  // sutil simulando o reflexo de vidro — mais a borda e o
                  // glow dourados próprios desse card.
                  background: 'rgba(6,6,6,0.72)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(205,164,77,0.4)',
                  boxShadow:
                    '0 0 28px -4px rgba(230,199,120,0.45), 0 16px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--gold-bright)' }}>
                  {STATE_PATHS[hovered].name}
                </div>
                {delivered.get(hovered) && delivered.get(hovered)!.length > 0 && (
                  <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                    {delivered.get(hovered)!.join(' · ')}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 text-xs sm:hidden" style={{ color: 'var(--ink-muted)' }}>
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ background: 'var(--gold-bright)' }}
            />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: 'var(--gold-bright)' }} />
          </span>
          Toque nos estados em destaque pra ver as cidades
        </p>
      </motion.div>
    </section>
  )
}
